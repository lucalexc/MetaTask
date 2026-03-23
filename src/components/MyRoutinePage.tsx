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
    <div className="min-h-screen bg-[#06080F] text-slate-200 pb-24">
      {/* Header & Progress */}
      <div className="sticky top-0 z-10 bg-[#06080F]/80 backdrop-blur-xl border-b border-white/5 px-6 py-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white tracking-tight">Minha Rotina</h1>
              <button 
                onClick={() => setIsManageModalOpen(true)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Gerenciar Atividades"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-400 text-sm mt-1 capitalize">
              {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-3xl font-black text-white">{progressPercentage}%</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Concluído</span>
            </div>
            {/* Circular Progress */}
            <div className="relative w-16 h-16">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" className="stroke-white/10" strokeWidth="8" fill="none" />
                <motion.circle 
                  cx="50" cy="50" r="40" 
                  className="stroke-blue-500" 
                  strokeWidth="8" fill="none" 
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 251.2" }}
                  animate={{ strokeDasharray: `${(progressPercentage / 100) * 251.2} 251.2` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-red-500/10 rounded-2xl border border-red-500/20">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Erro ao carregar rotina</h2>
            <p className="text-red-400 max-w-md mb-6">{error.message}</p>
            <Button onClick={refresh} className="bg-red-600 hover:bg-red-700 text-white">
              Tentar Novamente
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-400 font-medium">Carregando sua rotina...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
              <Calendar className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Sua rotina está vazia</h2>
            <p className="text-slate-400 max-w-md mb-8">
              Adicione rotinas diárias ou metas com prazo para começar a construir disciplina e ganhar XP.
            </p>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-xl text-lg font-bold shadow-lg shadow-blue-900/20"
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Atividade
            </Button>
          </div>
        ) : (
          <div className="space-y-10">
            {periods.map(period => {
              const periodActivities = groupedActivities[period.id];
              if (!periodActivities || periodActivities.length === 0) return null;

              return (
                <div key={period.id} className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    {period.label}
                    <div className="h-px bg-white/5 flex-1 ml-2"></div>
                  </h3>
                  
                  <div className="space-y-3">
                    <AnimatePresence>
                      {periodActivities.map(activity => (
                        <ActivityCard 
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
          // TODO: Implement edit functionality
          console.log('Edit activity', activity);
        }}
      />
    </div>
  );
}

const ActivityCard: React.FC<{ activity: DailyActivity, onToggle: () => void | Promise<void> }> = ({ activity, onToggle }) => {
  const isGoal = activity.type === 'goal';
  const isCompleted = activity.is_completed;
  const hasReps = activity.reps_per_day > 1;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border transition-all duration-300",
        isCompleted 
          ? "bg-[#0C1020]/50 border-white/5 opacity-60" 
          : "bg-[#0C1020] border-white/10 hover:border-white/20 hover:bg-[#111630]"
      )}
    >
      <div className="p-4 sm:p-5 flex items-center gap-4">
        {/* Checkbox / Action Button */}
        <button
          onClick={onToggle}
          disabled={isCompleted}
          className={cn(
            "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
            isCompleted
              ? "bg-green-500/20 text-green-400"
              : hasReps
                ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10"
          )}
        >
          {isCompleted ? (
            <Check className="w-6 h-6" />
          ) : hasReps ? (
            <span className="font-bold text-lg">+{activity.reps_per_day - activity.completed_reps}</span>
          ) : (
            <div className="w-5 h-5 rounded-md border-2 border-current opacity-50 group-hover:opacity-100 transition-opacity" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              "font-bold text-lg truncate transition-colors",
              isCompleted ? "text-slate-500 line-through" : "text-slate-100"
            )}>
              {activity.name}
            </h4>
            {activity.scheduled_time && (
              <span className="text-xs font-medium text-slate-500 bg-white/5 px-2 py-0.5 rounded-md">
                {activity.scheduled_time.substring(0, 5)}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
            {/* Type Tag */}
            <span className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-md",
              isGoal ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
            )}>
              {isGoal ? <Target className="w-3 h-3" /> : <Repeat className="w-3 h-3" />}
              {isGoal ? 'Meta' : 'Rotina'}
            </span>

            {/* Streak */}
            {activity.streak > 0 && (
              <span className="flex items-center gap-1 text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md">
                <Flame className="w-3 h-3" />
                {activity.streak} dias
              </span>
            )}

            {/* XP Reward */}
            <span className="flex items-center gap-1 text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-md">
              <Trophy className="w-3 h-3" />
              +{activity.xp_reward} XP
            </span>

            {/* Reps Progress */}
            {hasReps && !isCompleted && (
              <span className="text-slate-400">
                {activity.completed_reps} / {activity.reps_per_day} feitos
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar for Reps */}
      {hasReps && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
          <motion.div 
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${(activity.completed_reps / activity.reps_per_day) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}
    </motion.div>
  );
}
