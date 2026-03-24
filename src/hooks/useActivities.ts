import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { startOfDay, endOfDay, format } from 'date-fns';

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
  completed_at: string;
  streak_count: number;
  xp_earned: number;
  date: string;
  rep_number: number;
}

export interface DailyActivity extends Activity {
  completed_reps: number;
  is_completed: boolean;
  streak: number;
}

export function useActivities(date: Date = new Date(), fetchAll: boolean = false) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use date string as dependency to avoid infinite loops from new Date() objects
  const dateString = date.toISOString().split('T')[0];

  const fetchActivities = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const targetDate = new Date(dateString);
      const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // 1. Fetch activities for the user
      let query = supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id);
        
      if (!fetchAll) {
        query = query.eq('is_active', true);
      }

      const { data: allActivities, error: activitiesError } = await query;

      if (activitiesError) throw activitiesError;

      // Filter activities that are active today (if not fetchAll)
      const todayActivities = fetchAll ? (allActivities || []) : (allActivities || []).filter((activity: Activity) => {
        // Check if it's active on this day of the week
        if (!activity.active_days || !activity.active_days[dayOfWeek]) return false;

        // If it's a goal, check if it's within the duration
        if (activity.type === 'goal' && activity.duration_days) {
          const startDate = new Date(activity.start_date);
          const diffTime = Math.abs(targetDate.getTime() - startDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > activity.duration_days) return false;
        }

        return true;
      });

      // 2. Fetch logs for today using the date column
      const { data: logs, error: logsError } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateString);

      if (logsError) throw logsError;

      // 3. Combine activities with logs
      const dailyActivities: DailyActivity[] = todayActivities.map((activity: Activity) => {
        const activityLogs = (logs || []).filter((log: ActivityLog) => log.activity_id === activity.id);
        const completedReps = activityLogs.length;
        const isCompleted = completedReps >= activity.reps_per_day;
        
        // Get the latest streak from the most recent log, or 0
        const latestLog = activityLogs.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0];
        const streak = latestLog ? latestLog.streak_count : 0; // In a real app, we'd fetch the streak from the previous day if no log today

        return {
          ...activity,
          completed_reps: completedReps,
          is_completed: isCompleted,
          streak,
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
  }, [user?.id, dateString, fetchAll]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const toggleActivity = async (activity: DailyActivity) => {
    if (!user) return;

    // Optimistic update
    const newCompletedReps = activity.completed_reps + 1;
    const newIsCompleted = newCompletedReps >= activity.reps_per_day;

    setActivities(prev => prev.map(a => 
      a.id === activity.id 
        ? { ...a, completed_reps: newCompletedReps, is_completed: newIsCompleted } 
        : a
    ));

    try {
      // Calculate XP and Streak (simplified for now, ideally handled by DB trigger or edge function)
      const xpEarned = activity.xp_reward;
      const streakCount = activity.streak + 1; // Simplified
      const repNumber = newCompletedReps;

      const { error } = await supabase
        .from('activity_logs')
        .insert([{
          activity_id: activity.id,
          user_id: user.id,
          xp_earned: xpEarned,
          streak_count: streakCount,
          date: dateString,
          rep_number: repNumber
        }])
        .select();

      if (error) throw error;
    } catch (err) {
      console.error('Error toggling activity:', err);
      // Revert optimistic update
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
