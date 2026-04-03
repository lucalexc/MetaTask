import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Loader2, Trophy, Calendar, Settings, X, Lock } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { useActivities, DailyActivity } from '@/src/hooks/useActivities';
import CreateActivityModal from './CreateActivityModal';
import { format, isBefore, isAfter, startOfDay, startOfWeek, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WeeklyCalendar } from './WeeklyCalendar';
import { useWeeklyRoutineStatus } from '@/src/hooks/useWeeklyRoutineStatus';

export default function MyRoutinePage({ 
  isCreateModalOpen, 
  setIsCreateModalOpen 
}: { 
  isCreateModalOpen: boolean; 
  setIsCreateModalOpen: (v: boolean) => void; 
}) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weekDirection, setWeekDirection] = useState(0);

  const { activities, isLoading, error, toggleActivity, refresh } = useActivities(selectedDate);
  const [activityToEdit, setActivityToEdit] = useState<DailyActivity | null>(null);
  
  const { failedDays } = useWeeklyRoutineStatus(currentWeekStart);

  const handlePrevWeek = () => {
    setWeekDirection(-1);
    setCurrentWeekStart(prev => subDays(prev, 7));
  };

  const handleNextWeek = () => {
    setWeekDirection(1);
    setCurrentWeekStart(prev => addDays(prev, 7));
  };

  const isPastDate = isBefore(startOfDay(selectedDate), startOfDay(new Date()));
  const isFutureDate = isAfter(startOfDay(selectedDate), startOfDay(new Date()));
  const isLocked = isPastDate || isFutureDate;

  const isDayFailed = (date: Date) => {
    return failedDays.has(startOfDay(date).toISOString());
  };

  const filteredActivities = activities || [];

  const totalActivities = filteredActivities.length || 0;
  const completedActivities = filteredActivities.filter(a => a.is_completed).length || 0;
  const progressPercentage = totalActivities === 0 ? 0 : Math.round((completedActivities / totalActivities) * 100);

  const groupedActivities = filteredActivities.reduce((acc, activity) => {
    const period = activity.period || 'anytime';
    if (!acc[period]) acc[period] = [];
    acc[period].push(activity);
    return acc;
  }, {} as Record<string, DailyActivity[]>);

  const periods = [
    { id: 'morning', label: 'Manhã' },
    { id: 'afternoon', label: 'Tarde' },
    { id: 'evening', label: 'Noite' },
    { id: 'anytime', label: 'Qualquer Horário' }
  ];

  return (
    <div className="w-full bg-[#FCFAF8] text-[#202020] p-4 md:p-8">
      <div className="w-full max-w-7xl mx-auto px-0 md:px-6 lg:px-12 flex flex-col gap-6 md:gap-8">
        
        {/* Calendar at the absolute top */}
        <div className="w-full">
          <WeeklyCalendar 
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            currentWeekStart={currentWeekStart}
            weekDirection={weekDirection}
            handlePrevWeek={handlePrevWeek}
            handleNextWeek={handleNextWeek}
            isDayFailed={isDayFailed}
          />
          <div className="mt-2 text-center sm:text-left px-4 md:px-0">
            <h2 className="text-sm text-gray-500 font-medium capitalize">
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h2>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-gray-200 pb-6 px-4 md:px-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-[26px] leading-[35px] font-bold text-[#202020] tracking-tight">Minha Rotina</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-[#202020]">{completedActivities}/{totalActivities}</span>
                <div className="w-6 h-6 rounded-full border-2 border-gray-200 flex items-center justify-center overflow-hidden relative">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-[#1f60c2] transition-all duration-500 ease-out" 
                      style={{ height: `${progressPercentage}%` }}
                    />
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#1f60c2] mt-1">
                +{filteredActivities.filter(a => a.is_completed).reduce((sum, a) => sum + a.xp_reward, 0) || 0} XP
              </span>
            </div>
          </div>
        </div>

        <div className="w-full px-4 md:px-0">
          {isLocked && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800">
              <Lock className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-[14px] font-bold">
                  {isFutureDate ? 'Modo Visualização (Data Futura)' : 'Modo Leitura (Data Passada)'}
                </h4>
                <p className="text-[13px] mt-1 opacity-90">
                  {isFutureDate 
                    ? 'Você está visualizando uma data futura. As rotinas estão bloqueadas e não podem ser marcadas como concluídas antes da data.'
                    : 'Você está visualizando uma data no passado. As rotinas estão bloqueadas e não podem ser marcadas como concluídas hoje.'}
                </p>
              </div>
            </div>
          )}

          {activities?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-[13px] text-[#808080] mb-4">Sua rotina está vazia.</p>
              <Button onClick={() => setIsCreateModalOpen(true)} className="bg-[#7C3AED] text-white hover:bg-[#6D28D9] rounded-lg px-5 py-2.5 font-semibold transition-colors ease-out duration-200">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Atividade
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {periods.map(period => {
                const periodActivities = groupedActivities[period.id];
                if (!periodActivities || periodActivities.length === 0) return null;

                return (
                  <div key={period.id}>
                    <h3 className="text-[11px] font-bold tracking-wider text-[#808080] uppercase flex items-center mb-2 after:content-[''] after:flex-1 after:border-b after:border-gray-200 after:ml-4">
                      {period.label}
                    </h3>
                    
                    <div className="flex flex-col">
                      <AnimatePresence>
                        {periodActivities.map(activity => (
                          <ActivityRow 
                            key={activity.id} 
                            activity={activity} 
                            onToggle={() => {
                              if (!isLocked) toggleActivity(activity);
                            }}
                            onEdit={() => {
                              if (!isLocked) {
                                setActivityToEdit(activity);
                                setIsCreateModalOpen(true);
                              }
                            }}
                            isLocked={isLocked}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <CreateActivityModal 
        isOpen={isCreateModalOpen} 
        onClose={() => {
          setIsCreateModalOpen(false);
          setActivityToEdit(null);
        }} 
        onSuccess={refresh}
        activityToEdit={activityToEdit}
      />
    </div>
  );
}

const ActivityRow: React.FC<{ 
  activity: DailyActivity, 
  onToggle: () => void,
  onEdit: () => void,
  isLocked?: boolean
}> = ({ activity, onToggle, onEdit, isLocked }) => {
  const isGoal = activity.type === 'goal';
  const isCompleted = activity.is_completed;

  const hasProgress = isGoal && activity.duration_days && activity.duration_days > 1;
  const progressPercentage = hasProgress 
    ? Math.min(Math.round((activity.total_completed_days / activity.duration_days!) * 100), 100) 
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        "flex flex-row items-center py-3 px-2 border-b border-gray-100 last:border-0 transition-colors duration-200 group",
        isLocked ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50/50 active:bg-gray-100 cursor-pointer"
      )}
      onClick={() => {
        if (!isLocked) onEdit();
      }}
    >
      <div 
        className={cn("flex-shrink-0 mr-3 md:mr-4", isLocked ? "cursor-not-allowed" : "cursor-pointer")}
        onClick={(e) => {
          e.stopPropagation();
          if (!isLocked) onToggle();
        }}
      >
        <div className={cn(
            "w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200 ease-out",
            isCompleted ? "bg-[#058527] border-[#058527] text-white" : "border-gray-300 bg-white",
            isLocked && "bg-slate-50 border-slate-200 opacity-40 cursor-not-allowed",
            !isLocked && !isCompleted && "group-hover:border-[#1f60c2]"
          )}
        >
          {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <span className={cn("text-[13px] leading-[18px] transition-colors ease-out duration-200 truncate", isCompleted ? "text-[#808080] line-through" : "text-[#202020] font-medium")}>
              {activity.name}
            </span>
            
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0", isGoal ? "bg-purple-50 text-purple-600" : "bg-gray-100 text-[#808080]")}>
              {isGoal ? 'Meta' : 'Rotina'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {activity.scheduled_time && (
              <span className="text-[11px] text-[#808080]">{activity.scheduled_time.substring(0, 5)}</span>
            )}
            <span className="text-[11px] font-bold text-[#1f60c2]">+ {activity.xp_reward} XP</span>
          </div>
        </div>

        {hasProgress && (
          <div className="flex flex-col gap-1.5 w-full max-w-sm mt-2">
            <span className="text-xs text-slate-500 font-medium">
              Progresso: {activity.total_completed_days}/{activity.duration_days} dias ({progressPercentage}%)
            </span>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="bg-purple-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
