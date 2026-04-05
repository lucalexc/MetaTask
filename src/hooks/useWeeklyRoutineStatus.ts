import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { startOfDay, endOfDay, addDays, isBefore, format } from 'date-fns';
import { Activity, ActivityLog } from './useActivities';

export type DayStatus = 'success' | 'failed' | 'neutral';

export function useWeeklyRoutineStatus(weekStart: Date) {
  const { user } = useAuth();
  const [dayStatuses, setDayStatuses] = useState<Record<string, DayStatus>>({});

  useEffect(() => {
    if (!user) return;

    const fetchStatus = async () => {
      const today = startOfDay(new Date());
      const weekEnd = addDays(weekStart, 6);
      
      // Only check days up to yesterday
      const checkEnd = isBefore(weekEnd, today) ? weekEnd : addDays(today, -1);
      
      if (isBefore(checkEnd, weekStart)) {
        setDayStatuses({});
        return; // No past days in this week
      }

      const startStr = format(weekStart, 'yyyy-MM-dd');
      const endStr = format(checkEnd, 'yyyy-MM-dd');

      try {
        // Fetch all active routines
        const { data: routines, error: routinesError } = await supabase
          .from('activities')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'routine')
          .eq('is_active', true);

        if (routinesError) throw routinesError;

        // Fetch all logs for the period using normalized date
        const { data: logs, error: logsError } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('completed_at', startStr)
          .lte('completed_at', endStr);

        if (logsError) throw logsError;

        const newStatuses: Record<string, DayStatus> = {};

        // Check each day from weekStart to checkEnd
        let currentDay = startOfDay(weekStart);
        while (!isBefore(checkEnd, currentDay)) {
          const dayOfWeek = currentDay.getDay();
          const dayStr = format(currentDay, 'yyyy-MM-dd');
          const isoString = currentDay.toISOString();

          // Find routines active on this day
          const activeRoutinesOnDay = (routines || []).filter(routine => {
            // Check if routine was created before or on this day
            const createdDate = new Date(routine.created_at || routine.start_date);
            if (isBefore(endOfDay(currentDay), startOfDay(createdDate))) return false;
            
            // Check if active on this day of week
            if (routine.selected_days && Array.isArray(routine.selected_days)) {
              return routine.selected_days.includes(dayOfWeek);
            }
            return routine.active_days && routine.active_days[dayOfWeek];
          });

          if (activeRoutinesOnDay.length > 0) {
            // Check if all active routines were completed
            let allCompleted = true;
            for (const routine of activeRoutinesOnDay) {
              const routineLogs = (logs || []).filter(log => 
                log.activity_id === routine.id && 
                log.completed_at === dayStr
              );
              
              const isCompleted = routineLogs.some(log => log.is_completed !== false) && routineLogs.length >= (routine.reps_per_day || 1);
              
              if (!isCompleted) {
                allCompleted = false;
                break;
              }
            }

            newStatuses[isoString] = allCompleted ? 'success' : 'failed';
          } else {
            newStatuses[isoString] = 'neutral';
          }

          currentDay = addDays(currentDay, 1);
        }

        setDayStatuses(newStatuses);
      } catch (error) {
        console.error('Error fetching weekly routine status:', error);
      }
    };

    fetchStatus();
  }, [user, weekStart.toISOString()]);

  return { dayStatuses };
}
