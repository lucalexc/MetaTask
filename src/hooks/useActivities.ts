import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { startOfDay, endOfDay, format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export type ActivityType = 'routine' | 'goal';
export type Period = 'morning' | 'afternoon' | 'night' | 'anytime';

export interface Activity {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  type: ActivityType;
  period: Period;
  scheduled_time?: string;
  active_days: boolean[];
  selected_days?: number[];
  duration_days?: number;
  reps_per_day: number;
  start_date: string;
  xp_reward: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  activity_id: string;
  user_id: string;
  completed_at: string; // Now used as YYYY-MM-DD to avoid timezone issues
  streak_count: number;
  xp_earned: number;
  is_completed?: boolean;
}

export interface DailyActivity extends Activity {
  completed_reps: number;
  is_completed: boolean;
  streak: number;
  total_completed_days: number;
}

export function useActivities(date: Date = new Date()) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const targetDateStr = format(date, 'yyyy-MM-dd');

      // 1. Fetch active activities for the user
      const { data: allActivities, error: activitiesError } = await supabase
        .from('activities')
        .select('*, activity_logs(count)')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (activitiesError) throw activitiesError;

      // Filter activities that are active today
      const todayActivities = (allActivities || []).filter((activity: Activity) => {
        // Check if the activity's start_date is on or before the target date
        const startDate = new Date(activity.created_at || activity.start_date);
        startDate.setHours(0, 0, 0, 0);
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        
        if (targetDate < startDate) {
          return false;
        }

        // Check if it's active on this day of the week
        if (activity.type === 'routine' && activity.selected_days && Array.isArray(activity.selected_days)) {
          if (!activity.selected_days.includes(dayOfWeek)) return false;
        } else if (activity.active_days && !activity.active_days[dayOfWeek]) {
          return false;
        }

        // If it's a goal, check if it's within the duration
        if (activity.type === 'goal' && activity.duration_days) {
          const diffTime = Math.abs(date.getTime() - startDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > activity.duration_days) return false;
        }

        return true;
      });

      // 2. Fetch logs for today using normalized date
      const { data: logs, error: logsError } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed_at', targetDateStr);

      if (logsError) throw logsError;

      // 3. Combine activities with logs
      const dailyActivities: DailyActivity[] = todayActivities.map((activity: any) => {
        const activityLogs = (logs || []).filter((log: ActivityLog) => log.activity_id === activity.id);
        
        // Check if any log has is_completed = true, or if we are just counting logs (legacy)
        const isCompleted = activityLogs.some(log => log.is_completed !== false) && activityLogs.length >= activity.reps_per_day;
        const completedReps = activityLogs.length;
        
        // Get the latest streak from the most recent log, or 0
        const latestLog = activityLogs.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0];
        const streak = latestLog ? latestLog.streak_count : 0; // In a real app, we'd fetch the streak from the previous day if no log today

        const total_completed_days = activity.activity_logs?.[0]?.count || 0;

        return {
          ...activity,
          completed_reps: completedReps,
          is_completed: isCompleted,
          streak,
          total_completed_days,
        };
      });

      // Sort by scheduled time or period
      dailyActivities.sort((a, b) => {
        if (a.scheduled_time && b.scheduled_time) {
          return a.scheduled_time.localeCompare(b.scheduled_time);
        }
        return 0;
      });

      setActivities(dailyActivities);
    } catch (err: any) {
      console.error('Error fetching activities:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, date.toISOString().split('T')[0]]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const toggleActivity = async (activity: DailyActivity) => {
    if (!user) return;

    const isCompleting = !activity.is_completed;
    const targetDateStr = format(date, 'yyyy-MM-dd');

    // Optimistic update
    setActivities(prev => prev.map(a => 
      a.id === activity.id 
        ? { 
            ...a, 
            is_completed: isCompleting, 
            completed_reps: isCompleting ? a.reps_per_day : 0,
            total_completed_days: isCompleting ? a.total_completed_days + 1 : Math.max(0, a.total_completed_days - 1)
          } 
        : a
    ));

    try {
      // NOTE: Ensure the 'activity_logs' table has RLS policies allowing INSERT and UPDATE 
      // for the authenticated user (auth.uid() = user_id).
      // Also assumes a unique constraint on (activity_id, user_id, completed_at) for upsert to work correctly.
      
      const { error } = await supabase
        .from('activity_logs')
        .upsert({
          activity_id: activity.id,
          user_id: user.id,
          xp_earned: isCompleting ? activity.xp_reward : 0,
          streak_count: isCompleting ? activity.streak + 1 : activity.streak,
          completed_at: targetDateStr,
          is_completed: isCompleting
        }, {
          onConflict: 'activity_id,user_id,completed_at'
        });

      if (error) throw error;

      // Invalidate queries to keep UI in sync
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['activities'] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['insights'] })
      ]);
    } catch (err: any) {
      console.error("Supabase Error:", err.message, err.details, err.hint);
      toast.error('Falha ao atualizar atividade. Verifique sua conexão.');
      // Revert optimistic update by refetching
      fetchActivities();
    }
  };

  const createActivity = async (activityData: Partial<Activity>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert([{ ...activityData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['activities'] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['insights'] });
      
      fetchActivities();
      return data;
    } catch (err) {
      console.error('Error creating activity:', err);
      throw err;
    }
  };

  const updateActivity = async (id: string, updates: Partial<Activity>) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('activities')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['activities'] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['insights'] });

      fetchActivities();
    } catch (err) {
      console.error('Error updating activity:', err);
      throw err;
    }
  };

  const deleteActivity = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['activities'] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['insights'] });

      fetchActivities();
    } catch (err) {
      console.error('Error deleting activity:', err);
      throw err;
    }
  };

  return {
    activities,
    isLoading,
    error,
    toggleActivity,
    createActivity,
    updateActivity,
    deleteActivity,
    refresh: fetchActivities
  };
}
