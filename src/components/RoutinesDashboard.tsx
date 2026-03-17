import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Plus, Edit2, Trash2, X, Clock, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/lib/AuthContext';

export type Routine = {
  id: string;
  user_id: string;
  title: string;
  time: string;
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

const getPeriodInfo = (period: string) => {
  switch (period) {
    case 'morning': return { label: 'Manhã', icon: '☀️' };
    case 'afternoon': return { label: 'Tarde', icon: '☕' };
    case 'evening': return { label: 'Noite', icon: '🌙' };
    case 'night': return { label: 'Madrugada', icon: '🌌' };
    default: return { label: 'Manhã', icon: '☀️' };
  }
};

const getPeriodFromTime = (time: string): 'morning' | 'afternoon' | 'evening' | 'night' => {
  if (!time) return 'morning';
  const hour = parseInt(time.split(':')[0], 10);
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 24) return 'evening';
  return 'night';
};

const NewRoutineModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingRoutine 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (routine: Partial<Routine>) => void;
  editingRoutine: Routine | null;
}) => {
  const [title, setTitle] = useState(editingRoutine?.title || '');
  const [time, setTime] = useState(editingRoutine?.time || '08:00');

  useEffect(() => {
    if (isOpen) {
      setTitle(editingRoutine?.title || '');
      setTime(editingRoutine?.time || '08:00');
    }
  }, [isOpen, editingRoutine]);

  if (!isOpen) return null;

  const isSaveDisabled = !title.trim() || !time;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800">
            {editingRoutine ? 'Editar Rotina' : 'Nova Rotina'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Qual a atividade?</label>
            <input 
              type="text" 
              placeholder="Ex: Leitura, Academia..." 
              className="w-full text-base font-medium text-slate-900 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Horário</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="time" 
                lang="pt-BR"
                step="60"
                className="w-full text-base font-medium text-slate-900 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              O sistema detectará automaticamente se é manhã, tarde ou noite.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            Cancelar
          </button>
          <button 
            disabled={isSaveDisabled}
            onClick={() => {
              if (isSaveDisabled) return;
              onSave({ title, time });
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
          >
            Salvar Rotina
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function RoutinesDashboard({ 
  isCreateModalOpen, 
  setIsCreateModalOpen 
}: { 
  isCreateModalOpen: boolean; 
  setIsCreateModalOpen: (v: boolean) => void;
}) {
  const { user } = useAuth();
  const [view, setView] = useState<'today' | 'settings'>('today');
  
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(today);

  useEffect(() => {
    if (user) {
      fetchRoutines();
    }
  }, [user]);

  const fetchRoutines = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', user?.id)
        .order('time', { ascending: true });

      if (error) throw error;
      setRoutines(data || []);
    } catch (error) {
      console.error('Error fetching routines:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRoutine = async (routineData: Partial<Routine>) => {
    if (!user) return;

    const period = getPeriodFromTime(routineData.time || '08:00');

    if (editingRoutine) {
      const updatedRoutine = {
        ...editingRoutine,
        title: routineData.title,
        time: routineData.time,
        period,
      };

      // Optimistic update
      setRoutines(routines.map(r => r.id === editingRoutine.id ? updatedRoutine : r));

      try {
        const { error } = await supabase
          .from('routines')
          .update({
            title: routineData.title,
            time: routineData.time,
            period,
          })
          .eq('id', editingRoutine.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating routine:', error);
        fetchRoutines(); // Revert on error
      }
    } else {
      const newRoutine = {
        user_id: user.id,
        title: routineData.title || '',
        time: routineData.time || '08:00',
        period,
        is_completed: false,
      };

      try {
        const { data, error } = await supabase
          .from('routines')
          .insert([newRoutine])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setRoutines([...routines, data].sort((a, b) => a.time.localeCompare(b.time)));
        }
      } catch (error) {
        console.error('Error creating routine:', error);
      }
    }
    setEditingRoutine(null);
  };

  const handleDeleteRoutine = async (id: string) => {
    // Optimistic update
    setRoutines(routines.filter(r => r.id !== id));

    try {
      const { error } = await supabase
        .from('routines')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting routine:', error);
      fetchRoutines(); // Revert on error
    }
  };

  const toggleCompletion = async (id: string) => {
    const routine = routines.find(r => r.id === id);
    if (!routine) return;

    const newCompletedStatus = !routine.is_completed;

    // Optimistic update
    setRoutines(routines.map(r => 
      r.id === id ? { ...r, is_completed: newCompletedStatus } : r
    ));

    try {
      const { error } = await supabase
        .from('routines')
        .update({ is_completed: newCompletedStatus })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating routine completion:', error);
      fetchRoutines(); // Revert on error
    }
  };

  const openEditModal = (routine: Routine) => {
    setEditingRoutine(routine);
    setIsCreateModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingRoutine(null);
    setIsCreateModalOpen(false);
  };

  // Today's routines
  const todaysRoutines = routines;

  const groupedToday = todaysRoutines.reduce((acc, routine) => {
    const period = routine.period;
    if (!acc[period]) {
      const info = getPeriodInfo(period);
      acc[period] = { label: info.label, icon: info.icon, items: [] };
    }
    acc[period].items.push(routine);
    return acc;
  }, {} as Record<string, { label: string, icon: string, items: Routine[] }>);

  const periodOrder = ['morning', 'afternoon', 'evening', 'night'];

  return (
    <main className="flex-1 flex overflow-y-auto bg-white">
      <div className="max-w-3xl mx-auto w-full pt-10 px-8 pb-20">
        
        {view === 'today' ? (
          <motion.div
            key="today"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <header className="flex items-end justify-between mb-10">
              <div>
                <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
                  Rotina de Hoje
                </h1>
                <p className="text-sm text-slate-500 mt-1 capitalize">{formattedDate}</p>
              </div>
              <button 
                onClick={() => setView('settings')}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Todas as Rotinas
              </button>
            </header>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <p className="text-sm">Carregando rotinas...</p>
              </div>
            ) : todaysRoutines.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-slate-500">Nenhuma rotina programada para hoje.</p>
                <Button 
                  onClick={() => { setEditingRoutine(null); setIsCreateModalOpen(true); }}
                  variant="outline"
                  className="mt-4 text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Rotina
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {periodOrder.map(periodId => {
                  const group = groupedToday[periodId];
                  if (!group || group.items.length === 0) return null;

                  return (
                    <div key={periodId}>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-6 mb-2 flex items-center gap-2">
                        <span>{group.icon}</span> {group.label}
                      </h3>
                      <div className="flex flex-col">
                        {group.items.map(routine => {
                          const isCompleted = routine.is_completed;
                          return (
                            <div 
                              key={routine.id}
                              className="flex items-center gap-3 py-3 border-b border-slate-100 group transition-colors hover:bg-slate-50/50 -mx-4 px-4 rounded-lg cursor-pointer"
                              onClick={() => toggleCompletion(routine.id)}
                            >
                              <button 
                                className={cn(
                                  "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                                  isCompleted 
                                    ? "bg-blue-600 border-blue-600 text-white" 
                                    : "border-slate-300 group-hover:border-blue-400"
                                )}
                              >
                                {isCompleted && <Check className="w-3 h-3" />}
                              </button>
                              <span className={cn(
                                "text-sm font-medium flex-1 transition-colors",
                                isCompleted ? "text-slate-400 line-through" : "text-slate-800"
                              )}>
                                {routine.title}
                              </span>
                              <span className="text-xs font-medium text-slate-400 shrink-0">
                                {routine.time}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <header className="flex items-center justify-between mb-10">
              <div>
                <button 
                  onClick={() => setView('today')}
                  className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para Hoje
                </button>
                <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
                  Configuração de Rotinas
                </h1>
              </div>
              <Button 
                onClick={() => { setEditingRoutine(null); setIsCreateModalOpen(true); }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Rotina
              </Button>
            </header>

            <div className="space-y-10">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <p className="text-sm">Carregando rotinas...</p>
                </div>
              ) : routines.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                  Nenhuma rotina configurada.
                </div>
              ) : (
                <div className="flex flex-col">
                  {routines.map(routine => (
                    <div 
                      key={routine.id}
                      className="flex items-center gap-3 py-2.5 group transition-colors hover:bg-slate-50 -mx-2 px-2 rounded-md"
                    >
                      <span className="text-xs font-medium text-slate-400 w-10 shrink-0">
                        {routine.time}
                      </span>
                      <span className="text-sm font-medium text-slate-700 flex-1">
                        {routine.title}
                      </span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => openEditModal(routine)} 
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteRoutine(routine.id)} 
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <NewRoutineModal 
            isOpen={isCreateModalOpen} 
            onClose={closeEditModal} 
            onSave={handleSaveRoutine}
            editingRoutine={editingRoutine}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
