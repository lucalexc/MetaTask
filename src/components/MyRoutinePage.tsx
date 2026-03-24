import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Plus, Loader2, Trophy, Calendar, Settings, X, Target, Repeat } from 'lucide-react';
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
  const [currentDate] = useState(new Date());
  const { activities, isLoading, error, toggleActivity, refresh } = useActivities(currentDate);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const totalActivities = activities.length;
  const completedActivities = activities.filter(a => a.is_completed).length;
  const progressPercentage = totalActivities === 0 ? 0 : Math.round((completedActivities / totalActivities) * 100);

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
    <div className="min-h-screen bg-white text-gray-900 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <header className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-gray-900">Minha Rotina</h1>
              <button 
                onClick={() => setIsManageModalOpen(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm font-medium text-gray-500 mt-1 capitalize">
              {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className="text-sm font-bold text-gray-900">{completedActivities}/{totalActivities}</span>
                <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-blue-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1 justify-end mt-1">
                <Trophy className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-bold text-blue-600">
                  +{activities.filter(a => a.is_completed).reduce((sum, a) => sum + a.xp_reward, 0)} XP
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Section */}
        <main>
          {error ? (
            <div className="py-20 text-center border border-red-100 rounded-2xl bg-red-50/30">
              <X className="w-10 h-10 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-gray-900">Erro ao carregar rotina</h2>
              <p className="text-gray-500 text-sm mt-1">{error.message}</p>
              <Button onClick={refresh} variant="outline" className="mt-6 border-red-200 text-red-600 hover:bg-red-50">
                Tentar Novamente
              </Button>
            </div>
          ) : isLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Sincronizando sua jornada...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
              <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900">Sua rotina está vazia</h2>
              <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
                Adicione rotinas diárias ou metas para começar a ganhar XP e subir de nível.
              </p>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-2xl font-bold shadow-lg shadow-blue-600/20"
              >
                <Plus className="w-5 h-5 mr-2" />
                Começar Agora
              </Button>
            </div>
          ) : (
            <div className="space-y-10">
              {periods.map(period => {
                const periodActivities = groupedActivities[period.id];
                if (!periodActivities || periodActivities.length === 0) return null;

                return (
                  <section key={period.id}>
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
                        {period.label}
                      </h3>
                      <div className="h-px flex-1 bg-gray-100" />
                    </div>
                    
                    <div className="flex flex-col">
                      <AnimatePresence mode="popLayout">
                        {periodActivities.map(activity => (
                          <ActivityRow 
                            key={activity.id} 
                            activity={activity} 
                            onToggle={() => toggleActivity(activity)} 
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </main>
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-row items-center py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors group cursor-pointer"
      onClick={onToggle}
    >
      {/* Checkbox Area */}
      <div className="flex-shrink-0 mr-4">
        {hasReps && !isCompleted ? (
          <button className="w-6 h-6 rounded-full border-2 border-gray-200 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:border-blue-500 group-hover:text-blue-600 transition-all bg-white">
            {activity.reps_per_day - activity.completed_reps}
          </button>
        ) : (
          <div className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
            isCompleted 
              ? "bg-green-500 border-green-500 text-white" 
              : "border-gray-200 group-hover:border-gray-400 bg-white"
          )}>
            {isCompleted && <Check className="w-4 h-4 stroke-[4]" />}
          </div>
        )}
      </div>

      {/* Info Area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className={cn(
              "text-[15px] font-semibold transition-all duration-300",
              isCompleted ? "text-gray-300 line-through" : "text-gray-900"
            )}>
              {activity.name}
            </span>
            <div className="flex items-center gap-3 mt-0.5">
              {activity.scheduled_time && (
                <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {activity.scheduled_time.substring(0, 5)}
                </span>
              )}
              {hasReps && !isCompleted && (
                <span className="text-[11px] font-bold text-blue-500">
                  {activity.completed_reps}/{activity.reps_per_day} concluídos
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
              isGoal ? "bg-purple-50 text-purple-600" : "bg-gray-50 text-gray-500"
            )}>
              {isGoal ? 'Meta' : 'Rotina'}
            </span>
            <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md">
              <Trophy className="w-3 h-3 text-blue-600" />
              <span className="text-[10px] font-black text-blue-600">{activity.xp_reward} XP</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
