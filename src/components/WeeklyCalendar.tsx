import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isSameDay, eachDayOfInterval, addDays } from 'date-fns';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';

interface WeeklyCalendarProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  currentWeekStart: Date;
  weekDirection: number;
  handlePrevWeek: () => void;
  handleNextWeek: () => void;
  // Optional function to determine if a day should be marked as "failed" (red)
  isDayFailed?: (date: Date) => boolean;
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  selectedDate,
  setSelectedDate,
  currentWeekStart,
  weekDirection,
  handlePrevWeek,
  handleNextWeek,
  isDayFailed
}) => {
  return (
    <div className="flex items-center justify-center max-w-fit mx-auto bg-slate-50/50 border border-slate-200 rounded-3xl p-4 px-6 sm:px-8 shadow-sm gap-2 sm:gap-4">
      <Button variant="ghost" size="icon" onClick={handlePrevWeek} className="text-[#808080] hover:text-[#202020] shrink-0 transition-colors ease-out duration-200">
        <ChevronLeft className="w-5 h-5" />
      </Button>
      
      <div className="relative w-full overflow-hidden px-2">
        <AnimatePresence mode="popLayout" custom={weekDirection}>
          <motion.div
            key={currentWeekStart.toISOString()}
            custom={weekDirection}
            variants={{
              initial: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
              animate: { x: 0, opacity: 1 },
              exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 })
            }}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex justify-start sm:justify-center gap-2 sm:gap-6 overflow-x-auto snap-x hide-scrollbar scroll-smooth w-full"
          >
            {eachDayOfInterval({ start: currentWeekStart, end: addDays(currentWeekStart, 6) }).map((day, index) => {
              const dayLabels = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];
              const label = dayLabels[index];
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const failed = isDayFailed ? isDayFailed(day) : false;
              
              return (
                <div key={day.toISOString()} className="flex flex-col items-center gap-2 min-w-[3rem] shrink-0 snap-center">
                  <div className="text-center text-[10px] font-semibold uppercase tracking-wider text-[#808080]">
                    {label}
                  </div>
                  <button
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "flex items-center justify-center w-full h-10 rounded-xl transition-all ease-out duration-200",
                      isSelected 
                        ? "bg-blue-100 text-blue-600 font-bold shadow-sm" 
                        : failed
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "hover:bg-gray-50 text-[#808080]"
                    )}
                  >
                    <span className={cn(
                      "text-[14px]",
                      isToday && !isSelected && !failed && "text-blue-600 font-bold",
                      failed && !isSelected && "text-red-600 font-bold"
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

      <Button variant="ghost" size="icon" onClick={handleNextWeek} className="text-[#808080] hover:text-[#202020] shrink-0 transition-colors ease-out duration-200">
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
};
