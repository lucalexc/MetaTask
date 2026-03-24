import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Plus, Loader2, Target, Repeat, Flame, Trophy, Calendar, Settings, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { useActivities, DailyActivity } from '@/src/hooks/useActivities';
import CreateActivityModal from './CreateActivityModal';
import ManageActivitiesModal from './ManageActivitiesModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MyRoutinePage({ 
  isCreateModalOpen, 
  setIsCreateModalOpen 
}: { 
  isCreateModalOpen: boolean; 
  setIsCreateModalOpen: (v: boolean) => void; 
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { activities, isLoading, error, toggleActivity, refresh } = useActivities(currentDate);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  // Calculate progress
  const totalActivities = activities.length;
  const completedActivities = activities.filter(a => a.is_completed).length;
  const progressPercentage = totalActivities === 0 ? 0 : Math.round((completedActivities / totalActivities) * 100);

  // Group activities by period
  const groupedActivities = activities.reduce((acc, activity) => {
    const period = activity.period || 'anytime';
    if (!acc[period]) acc[period] = [];
    acc[period].push(activity);
    return acc;
  }, {} as Record<string, DailyActivity[]>);

  const periods = [
    { id: 'morning', label: 'Manhã' },
    { id: 'afternoon', label: 'Tarde' },
    { id: 'night', label: 'Noite' },
    { id: 'anytime', label: 'Qualquer Horário' }
  ];

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A] pb-24">
      {/* Header & Progress */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[#E8E8E8] px-6 py-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#1A1A1A]">Minha Rotina</h1>
              <button 
                onClick={() => setIsManageModalOpen(true)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Gerenciar Atividades"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-500 text-sm mt-0.5 capitalize">
              {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#1A1A1A]">{completedActivities}/{totalActivities}</span>
                {/* Minimal Circular Progress */}
                <div className="relative w-5 h-5">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" className="stroke-gray-100" strokeWidth="10" fill="none" />
                    <motion.circle 
                      cx="50" cy="50" r="45" 
                      className="stroke-blue-600" 
                      strokeWidth="10" fill="none" 
                      strokeLinecap="round"
                      initial={{ strokeDasharray: "0 282.7" }}
                      animate={{ strokeDasharray: `${(progressPercentage / 100) * 282.7} 282.7` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </svg>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-600 mt-1">
                +{activities.filter(a => a.is_completed).reduce((sum, a) => sum + a.xp_reward, 0)} XP
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-4">
        {error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <X className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">Erro ao carregar rotina</h2>
            <p className="text-gray-500 text-sm max-w-md mb-6">{error.message}</p>
            <Button onClick={refresh} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
              Tentar Novamente
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Carregando sua rotina...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Calendar className="w-8 h-8 text-gray-300" />
            </div>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">Sua rotina está vazia</h2>
            <p className="text-gray-500 text-sm max-w-md mb-8">
              Adicione rotinas diárias ou metas com prazo para começar a construir disciplina e ganhar XP.
            </p>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Atividade
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {periods.map(period => {
              const periodActivities = groupedActivities[period.id];
              if (!periodActivities || periodActivities.length === 0) return null;

              return (
                <div key={period.id} className="pb-4">
                  <h3 className="text-xs font-semibold tracking-wide text-gray-500 uppercase flex items-center mt-8 mb-2 after:content-[''] after:flex-1 after:border-b after:border-gray-200 after:ml-4">
                    {period.label}
                  </h3>
                  
                  <div className="divide-y divide-[#E8E8E8]">
                    <AnimatePresence>
                      {periodActivities.map(activity => (
                        <ActivityRow 
                          key={activity.id} 
                          activity={activity} 
                          onToggle={() => toggleActivity(activity)} 
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

      <CreateActivityModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={refresh}
      />

      <ManageActivitiesModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        onEdit={(activity) => {
          console.log('Edit activity', activity);
        }}
      />
    </div>
  );
}

const ActivityRow: React.FC<{ activity: DailyActivity, onToggle: () => void | Promise<void> }> = ({ activity, onToggle }) => {
  const isGoal = activity.type === 'goal';
  const isCompleted = activity.is_completed;
  const hasReps = activity.reps_per_day > 1;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-row items-center py-3 border-b border-[#E8E8E8] hover:bg-[#F5F5F5] transition-colors group cursor-pointer"
      onClick={onToggle}
    >
      {/* Checkbox / Action Button */}
      <div className="flex-shrink-0 mr-3">
        {hasReps && !isCompleted ? (
          <button
            className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            +1
          </button>
        ) : (
          <div
            className={cn(
              "w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200",
              isCompleted
                ? "bg-[#058527] border-[#058527] text-white"
                : "border-gray-300 group-hover:border-gray-400"
            )}
          >
            {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-medium transition-colors",
            isCompleted ? "text-gray-400 line-through" : "text-[#1A1A1A]"
          )}>
            {activity.name}
          </span>
          
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Type Tag */}
            <span className={cn(
              "text-[11px] px-2 py-0.5 rounded-full font-semibold",
              isGoal ? "bg-purple-50 text-purple-700" : "bg-gray-100 text-gray-600"
            )}>
              {isGoal ? 'Meta' : 'Rotina'}
            </span>

            {/* XP Reward */}
            <span className="text-[11px] font-bold text-blue-600 flex items-center gap-0.5">
              <Trophy className="w-3 h-3" />
              +{activity.xp_reward} XP
            </span>
          </div>
        </div>
        
        {/* Reps Progress or Time */}
        <div className="flex items-center gap-2 mt-0.5">
          {hasReps && !isCompleted && (
            <span className="text-xs text-gray-400">
              {activity.completed_reps}/{activity.reps_per_day} feitos
            </span>
          )}
          {activity.scheduled_time && (
            <span className="text-xs text-gray-400">
              {activity.scheduled_time.substring(0, 5)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

