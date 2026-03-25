import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Loader2, Trophy, Calendar, Settings, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { useActivities, DailyActivity } from '@/src/hooks/useActivities';
import CreateActivityModal from './CreateActivityModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MyRoutinePage({ 
  isCreateModalOpen, 
  setIsCreateModalOpen 
}: { 
  isCreateModalOpen: boolean; 
  setIsCreateModalOpen: (v: boolean) => void; 
}) {
  const [currentDate] = useState(new Date());
  const { activities, isLoading, error, toggleActivity, refresh } = useActivities(currentDate);
  const [activityToEdit, setActivityToEdit] = useState<DailyActivity | null>(null);

  const totalActivities = activities?.length || 0;
  const completedActivities = activities?.filter(a => a.is_completed).length || 0;
  const progressPercentage = totalActivities === 0 ? 0 : Math.round((completedActivities / totalActivities) * 100);

  const groupedActivities = (activities || []).reduce((acc, activity) => {
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
    <div className="min-h-screen w-full bg-[#FCFAF8] text-[#202020] p-8">
      <div className="max-w-3xl mx-auto mb-8">
        <div className="flex items-center justify-between border-b border-gray-200 pb-6 mb-8">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-[26px] leading-[35px] font-bold text-[#202020] tracking-tight">Minha Rotina</h1>
            </div>
            <p className="text-[13px] text-[#808080] mt-1 capitalize">
              {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
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
                +{activities?.filter(a => a.is_completed).reduce((sum, a) => sum + a.xp_reward, 0) || 0} XP
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          {activities?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-[13px] text-[#808080] mb-4">Sua rotina está vazia.</p>
              <Button onClick={() => setIsCreateModalOpen(true)} className="bg-[#202020] text-white hover:bg-black transition-colors ease-out duration-200">
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
                            onToggle={() => toggleActivity(activity)}
                            onEdit={() => {
                              setActivityToEdit(activity);
                              setIsCreateModalOpen(true);
                            }}
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
  onEdit: () => void 
}> = ({ activity, onToggle, onEdit }) => {
  const isGoal = activity.type === 'goal';
  const isCompleted = activity.is_completed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-row items-center py-3 border-b border-gray-200 hover:bg-gray-100 transition-colors ease-out duration-200 group cursor-pointer"
      onClick={onEdit}
    >
      <div 
        className="flex-shrink-0 mr-4"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <div className={cn(
            "w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200 ease-out",
            isCompleted ? "bg-[#058527] border-[#058527] text-white" : "border-gray-300 group-hover:border-[#1f60c2] bg-white"
          )}
        >
          {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className={cn("text-[13px] leading-[18px] transition-colors ease-out duration-200", isCompleted ? "text-[#808080] line-through" : "text-[#202020] font-medium")}>
              {activity.name}
            </span>
            
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider", isGoal ? "bg-purple-50 text-purple-600" : "bg-gray-100 text-[#808080]")}>
              {isGoal ? 'Meta' : 'Rotina'}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {activity.scheduled_time && (
              <span className="text-[11px] text-[#808080]">{activity.scheduled_time.substring(0, 5)}</span>
            )}
            <span className="text-[11px] font-bold text-[#1f60c2]">+ {activity.xp_reward} XP</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
