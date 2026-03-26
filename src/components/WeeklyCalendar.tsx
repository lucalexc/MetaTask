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
    <div className="flex items-center bg-white py-3 px-2 border-b border-gray-100">
      <Button variant="ghost" size="icon" onClick={handlePrevWeek} className="text-[#808080] hover:text-[#202020] shrink-0 transition-colors ease-out duration-200">
        <ChevronLeft className="w-5 h-5" />
      </Button>
      
      <div className="flex-1 flex flex-col overflow-hidden px-2">
        {/* Static Labels */}
        <div className="flex justify-around mb-2">
          {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'].map(day => (
            <div key={day} className="w-10 text-center text-[10px] font-semibold uppercase tracking-wider text-[#808080]">
              {day}
            </div>
          ))}
        </div>
        
        {/* Animated Numbers */}
        <div className="relative h-10">
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
              className="absolute inset-0 flex justify-around"
            >
              {eachDayOfInterval({ start: currentWeekStart, end: addDays(currentWeekStart, 6) }).map(day => {
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const failed = isDayFailed ? isDayFailed(day) : false;
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg transition-all ease-out duration-200",
                      isSelected 
                        ? "bg-[#dceaff] text-[#1f60c2] font-bold shadow-sm" 
                        : failed
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "hover:bg-gray-50 text-[#808080]"
                    )}
                  >
                    <span className={cn(
                      "text-[14px]",
                      isToday && !isSelected && !failed && "text-[#1f60c2] font-bold",
                      failed && !isSelected && "text-red-600 font-bold"
                    )}>
                      {format(day, 'd')}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <Button variant="ghost" size="icon" onClick={handleNextWeek} className="text-[#808080] hover:text-[#202020] shrink-0 transition-colors ease-out duration-200">
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
};
