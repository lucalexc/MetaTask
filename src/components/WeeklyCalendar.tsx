import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isSameDay, eachDayOfInterval, addDays } from 'date-fns';
import { cn } from '@/src/lib/utils';
import { DayStatus } from '@/src/hooks/useWeeklyRoutineStatus';

interface WeeklyCalendarProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  currentWeekStart: Date;
  weekDirection: number;
  handlePrevWeek: () => void;
  handleNextWeek: () => void;
  // Optional function to determine the status of a day
  getDayStatus?: (date: Date) => DayStatus | undefined;
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  selectedDate,
  setSelectedDate,
  currentWeekStart,
  weekDirection,
  handlePrevWeek,
  handleNextWeek,
  getDayStatus
}) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndEvent = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNextWeek();
    }
    if (isRightSwipe) {
      handlePrevWeek();
    }
  };

  return (
    <div 
      className="w-full overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndEvent}
    >
      <div className="relative w-full">
        <AnimatePresence mode="popLayout" custom={weekDirection}>
          <motion.div
            key={currentWeekStart.toISOString()}
            custom={weekDirection}
            variants={{
              initial: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
              animate: { x: 0, opacity: 1 },
              exit: (dir: number) => ({ x: dir > 0 ? -100 : 100, opacity: 0 })
            }}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="grid grid-cols-7 w-full gap-1 sm:gap-2"
          >
            {eachDayOfInterval({ start: currentWeekStart, end: addDays(currentWeekStart, 6) }).map((day, index) => {
              const dayLabels = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];
              const label = dayLabels[index];
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const status = getDayStatus ? getDayStatus(day) : undefined;
              const isFuture = day > new Date() && !isToday;
              
              return (
                <div key={day.toISOString()} className="flex flex-col items-center justify-center gap-1.5">
                  <div className="text-[10px] text-gray-400 uppercase font-medium tracking-wider">
                    {label}
                  </div>
                  <button
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all ease-out duration-200",
                      isSelected 
                        ? "bg-[#1f60c2] text-white font-semibold shadow-md" 
                        : status === 'failed'
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : status === 'success'
                            ? "bg-green-50 text-green-600 hover:bg-green-100"
                            : "hover:bg-gray-100 text-[#202020]"
                    )}
                  >
                    <span className={cn(
                      "text-sm sm:text-base",
                      isToday && !isSelected && status !== 'failed' && status !== 'success' && "text-[#1f60c2] font-bold",
                      status === 'failed' && !isSelected && "text-red-600 font-bold",
                      status === 'success' && !isSelected && "text-green-600 font-bold",
                      !isSelected && !isToday && status !== 'failed' && status !== 'success' && "font-medium",
                      !isSelected && !isToday && (status === 'neutral' || isFuture) && "text-gray-400"
                    )}>
                      {format(day, 'd')}
                    </span>
                  </button>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
