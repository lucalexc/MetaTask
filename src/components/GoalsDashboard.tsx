import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Trash2, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/lib/AuthContext';

export type Goal = {
  id: string;
  user_id: string;
  title: string;
  description?: string; // JSON string containing { dailyGoal, totalDays }
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
  // Dynamic fields calculated after fetch
  daily_progress?: number;
  current_day?: number;
};

export type GoalLog = {
  id: string;
  goal_id: string;
  user_id: string;
  created_at: string;
};

const getMetadata = (goal: Goal) => {
  try {
    if (goal.description) {
      return JSON.parse(goal.description);
    }
  } catch (e) {
    // ignore
  }
  return { dailyGoal: 1, totalDays: 30 };
};

const calculateCurrentDay = (createdAt: string) => {
  const start = new Date(createdAt);
  start.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays + 1; // Day 1 is the day it was created
};

const GoalCard: React.FC<{ goal: Goal, onIncrement: (id: string) => void, onDelete: (id: string) => void }> = ({ goal, onIncrement, onDelete }) => {
  const meta = getMetadata(goal);
  const progress = goal.daily_progress || 0;
  const currentDay = goal.current_day || 1;
  const isCompleted = progress >= meta.dailyGoal;
  const progressPercent = Math.min(100, (progress / meta.dailyGoal) * 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-4 group"
    >
      {/* Left: Info */}
      <div className="w-1/3 shrink-0">
        <h4 className="text-sm font-bold text-slate-800">{goal.title}</h4>
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
          <span>{progress}/{meta.dailyGoal} vezes hoje</span>
          <span>•</span>
          <span>Dia {currentDay} de {meta.totalDays}</span>
        </div>
      </div>

      {/* Center: Progress Bar */}
      <div className="flex-1 px-4">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-blue-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Right: Action */}
      <div className="shrink-0 flex items-center justify-end gap-2">
        <button
          onClick={() => onDelete(goal.id)}
          className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
          title="Excluir meta"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <motion.button
          whileHover={{ scale: isCompleted ? 1 : 1.05, y: isCompleted ? 0 : -2 }}
          whileTap={{ scale: isCompleted ? 1 : 0.95 }}
          onClick={() => !isCompleted && onIncrement(goal.id)}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors shadow-sm",
            isCompleted 
              ? "bg-emerald-500 text-white cursor-default shadow-emerald-500/20" 
              : "bg-white border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600"
          )}
        >
          {isCompleted ? <Check className="w-5 h-5" /> : "+1"}
        </motion.button>
      </div>
    </motion.div>
  );
};

const NewGoalModal = ({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (g: any) => void }) => {
  const [title, setTitle] = useState('');
  const [totalDays, setTotalDays] = useState('30');
  const [dailyGoal, setDailyGoal] = useState<number>(1);

  if (!isOpen) return null;

  const isSaveDisabled = !title.trim() || !totalDays;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm">
      <div className="min-h-full flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="p-6 flex flex-col gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Qual o seu novo hábito ou meta?</label>
              <input 
                type="text" 
                placeholder="Ex: Beber 2L de Água" 
                className="w-full text-xl font-bold text-slate-900 placeholder-slate-300 focus:outline-none"
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quantos dias deseja manter essa meta?</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  className="w-24 text-lg font-semibold text-slate-900 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                  value={totalDays}
                  onChange={e => setTotalDays(e.target.value)}
                  min="1"
                />
                <span className="text-slate-500 font-medium">dias</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quantas vezes ao dia?</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map(num => (
                  <button
                    key={num}
                    onClick={() => setDailyGoal(num)}
                    className={cn(
                      "w-12 h-10 rounded-xl text-sm font-bold transition-colors border",
                      dailyGoal === num 
                        ? "bg-blue-50 border-blue-500 text-blue-700" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {num}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
            <button 
              disabled={isSaveDisabled}
              onClick={() => {
                if (isSaveDisabled) return;
                onSave({ title, description: JSON.stringify({ totalDays: parseInt(totalDays) || 30, dailyGoal }) });
                setTitle(''); setTotalDays('30'); setDailyGoal(1);
              }}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
            >
              Criar Meta
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default function GoalsDashboard({ isCreateModalOpen, setIsCreateModalOpen }: { isCreateModalOpen: boolean, setIsCreateModalOpen: (v: boolean) => void }) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 1. Fetch Goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (goalsError) throw goalsError;

      // 2. Fetch Logs for Today
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const { data: logsData, error: logsError } = await supabase
        .from('goal_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      if (logsError) throw logsError;

      // 3. Map progress and current day
      const enrichedGoals = (goalsData || []).map(goal => {
        const dailyLogs = (logsData || []).filter(log => log.goal_id === goal.id);
        return {
          ...goal,
          daily_progress: dailyLogs.length,
          current_day: calculateCurrentDay(goal.created_at)
        };
      });

      setGoals(enrichedGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIncrement = async (id: string) => {
    if (!user) return;
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const meta = getMetadata(goal);
    const currentProgress = goal.daily_progress || 0;
    if (currentProgress >= meta.dailyGoal) return;

    // Optimistic update
    setGoals(goals.map(g => 
      g.id === id ? { ...g, daily_progress: currentProgress + 1 } : g
    ));

    try {
      const { error } = await supabase
        .from('goal_logs')
        .insert([{
          goal_id: id,
          user_id: user.id
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error logging goal completion:', error);
      fetchGoals(); // Revert on error
    }
  };

  const handleDeleteGoal = async (id: string) => {
    // Optimistic update
    setGoals(goals.filter(g => g.id !== id));

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting goal:', error);
      fetchGoals(); // Revert on error
    }
  };

  const handleSaveGoal = async (goalData: any) => {
    if (!user) return;

    const newGoal = {
      user_id: user.id,
      title: goalData.title || 'Nova Meta',
      description: goalData.description,
      status: 'active'
    };

    try {
      const { data, error } = await supabase
        .from('goals')
        .insert([newGoal])
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        // Initialize with 0 progress and day 1
        const enrichedNewGoal = {
          ...data,
          daily_progress: 0,
          current_day: 1
        };
        setGoals(prev => [enrichedNewGoal, ...prev]);
        setIsCreateModalOpen(false);
        setToastMsg({ message: 'Meta criada com sucesso!', type: 'success' });
      }
    } catch (error: any) {
      console.error('Error creating goal:', error);
      setToastMsg({ message: `Erro: ${error.message || 'Falha ao criar meta'}`, type: 'error' });
    }
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      <div className="max-w-4xl mx-auto w-full pt-6 md:pt-10 px-4 md:px-8 flex-1 overflow-y-auto pb-12">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight">
              Metas Ativas
            </h1>
            <p className="text-sm text-slate-500 mt-1">Acompanhe seus hábitos e metas diárias.</p>
          </div>
          
          {/* We keep this button here too, or just rely on the sidebar. The prompt says: "Header: Título "Metas Ativas" e um botão primário [+ Nova Meta]." */}
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-xl h-10 px-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Meta
          </Button>
        </header>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-sm">Carregando metas...</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {goals.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8 text-sm text-slate-500"
                >
                  Nenhuma meta ativa. Comece criando uma nova meta!
                </motion.div>
              ) : (
                goals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} onIncrement={handleIncrement} onDelete={handleDeleteGoal} />
                ))
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <NewGoalModal 
            isOpen={isCreateModalOpen} 
            onClose={() => setIsCreateModalOpen(false)} 
            onSave={handleSaveGoal} 
          />
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              "fixed bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-3",
              toastMsg.type === 'error' ? "bg-red-600 text-white" : "bg-slate-900 text-white"
            )}
          >
            {toastMsg.type === 'error' ? (
              <XCircle className="w-5 h-5 text-white" />
            ) : (
              <Check className="w-5 h-5 text-emerald-400" />
            )}
            <span className="font-medium">{toastMsg.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
