import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Plus, Edit2, Trash2, X, Clock, ArrowLeft, Check, Loader2, Calendar } from 'lucide-react';
import { startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/lib/AuthContext';

import { toast } from 'sonner';

export type RoutineActivity = {
  id: string;
  routine_id: string;
  user_id: string;
  title: string;
  time: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type Routine = {
  id: string;
  user_id: string;
  name: string;
  days_of_week: number[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  activities?: RoutineActivity[];
};

const DAYS = [
  { id: 0, label: 'D', full: 'Domingo' },
  { id: 1, label: 'S', full: 'Segunda' },
  { id: 2, label: 'T', full: 'Terça' },
  { id: 3, label: 'Q', full: 'Quarta' },
  { id: 4, label: 'Q', full: 'Quinta' },
  { id: 5, label: 'S', full: 'Sexta' },
  { id: 6, label: 'S', full: 'Sábado' },
];

const getPeriodInfo = (time: string) => {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour >= 5 && hour < 12) return { label: 'Manhã', icon: '☀️' };
  if (hour >= 12 && hour < 18) return { label: 'Tarde', icon: '☕' };
  if (hour >= 18 && hour < 24) return { label: 'Noite', icon: '🌙' };
  return { label: 'Madrugada', icon: '🌌' };
};

const RoutineManagerModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingRoutine 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (routine: Partial<Routine>, activities: Partial<RoutineActivity>[]) => void;
  editingRoutine: Routine | null;
}) => {
  const [name, setName] = useState(editingRoutine?.name || '');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(editingRoutine?.days_of_week || []);
  const [activities, setActivities] = useState<Partial<RoutineActivity>[]>(
    editingRoutine?.activities?.map(a => ({ title: a.title, time: a.time, id: a.id })) || []
  );

  useEffect(() => {
    if (isOpen) {
      setName(editingRoutine?.name || '');
      setDaysOfWeek(editingRoutine?.days_of_week || []);
      setActivities(editingRoutine?.activities?.map(a => ({ title: a.title, time: a.time, id: a.id })) || []);
    }
  }, [isOpen, editingRoutine]);

  const toggleDay = (dayId: number) => {
    setDaysOfWeek(prev => 
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId].sort()
    );
  };

  const addActivity = () => {
    setActivities(prev => [...prev, { title: '', time: '08:00' }]);
  };

  const updateActivity = (index: number, field: keyof RoutineActivity, value: string) => {
    if (field === 'time') {
      let val = value.replace(/\D/g, ''); // Remove non-digits
      if (val.length > 4) val = val.slice(0, 4);
      
      let formattedTime = val;
      if (val.length >= 3) {
        formattedTime = `${val.slice(0, 2)}:${val.slice(2)}`;
      }

      // Validate hours and minutes
      if (formattedTime.length >= 2) {
        const hours = parseInt(formattedTime.slice(0, 2));
        if (hours > 23) formattedTime = `23${formattedTime.slice(2)}`;
      }
      if (formattedTime.length === 5) {
        const minutes = parseInt(formattedTime.slice(3, 5));
        if (minutes > 59) formattedTime = `${formattedTime.slice(0, 3)}59`;
      }
      
      setActivities(prev => prev.map((a, i) => i === index ? { ...a, [field]: formattedTime } : a));
    } else {
      setActivities(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
    }
  };

  const removeActivity = (index: number) => {
    setActivities(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isSaveDisabled = !name.trim() || daysOfWeek.length === 0 || activities.length === 0;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overscroll-none h-[100dvh]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]"
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="font-bold text-lg text-slate-800">
            {editingRoutine ? 'Editar Bloco de Rotina' : 'Novo Bloco de Rotina'}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col overflow-y-auto custom-scrollbar">
          {/* Routine Name Row */}
          <div className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-100 rounded-xl mb-4 hover:bg-gray-100/50 transition-colors group">
            <div className="flex items-center gap-3">
              <Edit2 className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
              <span className="text-sm font-medium text-gray-600">Nome da Rotina</span>
            </div>
            <input 
              type="text" 
              placeholder="Ex: Rotina Matinal" 
              className="w-48 bg-transparent text-right text-sm font-semibold text-blue-600 placeholder-blue-300 focus:ring-0 border-none outline-none"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Days of Week Row */}
          <div className="flex flex-col p-3 bg-gray-50/50 border border-gray-100 rounded-xl mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Dias da Semana</span>
            </div>
            <div className="flex justify-between gap-1">
              {DAYS.map(day => (
                <button
                  key={day.id}
                  onClick={() => toggleDay(day.id)}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold transition-all",
                    daysOfWeek.includes(day.id)
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "bg-white border border-gray-100 text-slate-400 hover:bg-slate-50"
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Atividades</span>
              </div>
              <button 
                onClick={addActivity}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3" /> Adicionar
              </button>
            </div>
            
            <div className="space-y-2">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl group hover:border-blue-100 transition-all">
                  <input 
                    type="text" 
                    placeholder="00:00"
                    maxLength={5}
                    className="bg-gray-50 px-2 py-1 rounded-lg text-sm font-bold text-blue-600 w-16 focus:outline-none focus:ring-1 focus:ring-blue-200 text-center"
                    value={activity.time}
                    onChange={e => updateActivity(index, 'time', e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Nome da atividade"
                    className="flex-1 bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
                    value={activity.title}
                    onChange={e => updateActivity(index, 'title', e.target.value)}
                  />
                  <button 
                    onClick={() => removeActivity(index)}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                  <p className="text-sm text-slate-400">Nenhuma atividade adicionada.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/30 sticky bottom-0">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all">
            Cancelar
          </button>
          <button 
            disabled={isSaveDisabled}
            onClick={async () => {
              if (isSaveDisabled) return;
              await onSave({ name, days_of_week: daysOfWeek }, activities);
            }}
            className="px-6 py-2.5 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg shadow-blue-200"
          >
            {editingRoutine ? 'Salvar Alterações' : 'Criar Rotina'}
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
  
  const queryClient = useQueryClient();
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(today);

  const { data: routines = [], isLoading: isLoadingRoutines } = useQuery({
    queryKey: ['routines', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('routines')
        .select('*, routine_activities(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      return data.map(routine => ({
        ...routine,
        activities: routine.routine_activities?.sort((a: any, b: any) => a.time.localeCompare(b.time))
      }));
    },
    enabled: !!user?.id
  });

  const isLoading = isLoadingRoutines;

  const handleSaveRoutine = async (routineData: Partial<Routine>, activitiesData: Partial<RoutineActivity>[]) => {
    if (!user) return;

    try {
      let routineId = editingRoutine?.id;

      if (editingRoutine) {
        // Update routine
        // FIX: Adicionado .select() para garantir o retorno e evitar erro de headers
        const { error: routineError } = await supabase
          .from('routines')
          .update({
            name: routineData.name,
            days_of_week: routineData.days_of_week,
          })
          .eq('id', editingRoutine.id)
          .select();

        if (routineError) throw routineError;

        // Update activities: simple approach - delete all and re-insert
        const { error: deleteError } = await supabase
          .from('routine_activities')
          .delete()
          .eq('routine_id', editingRoutine.id);

        if (deleteError) throw deleteError;
      } else {
        // Create routine - Passo A
        const { data: newRoutine, error: routineError } = await supabase
          .from('routines')
          .insert([{
            user_id: user.id,
            name: routineData.name || '',
            days_of_week: routineData.days_of_week || [],
            is_active: true,
          }])
          .select()
          .single();

        if (routineError) throw routineError;
        routineId = newRoutine.id;
      }

      // Insert activities - Passo B
      if (routineId && activitiesData.length > 0) {
        const activitiesToInsert = activitiesData.map(a => ({
          routine_id: routineId,
          user_id: user.id,
          title: a.title,
          time: a.time,
          is_completed: false,
        }));

        // FIX: Adicionado .select() para garantir o retorno e evitar erro de headers
        const { error: activitiesError } = await supabase
          .from('routine_activities')
          .insert(activitiesToInsert)
          .select();

        if (activitiesError) throw activitiesError;
      }

      await queryClient.invalidateQueries({ queryKey: ['routines'] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['insights'] });
      toast.success(editingRoutine ? 'Rotina atualizada com sucesso!' : 'Rotina criada com sucesso!');
      setIsCreateModalOpen(false);
      setEditingRoutine(null);
    } catch (error: any) {
      console.error('Error saving routine:', error);
      toast.error(error.message || 'Erro ao salvar rotina. Tente novamente.');
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    try {
      const { error } = await supabase
        .from('routines')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['routines'] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['insights'] });
    } catch (error) {
      console.error('Error deleting routine:', error);
    }
  };

  const toggleRoutineMutation = useMutation({
    mutationFn: async ({ activityId, routineId, isCompleted }: { activityId: string, routineId: string, isCompleted: boolean }) => {
      if (!user?.id) throw new Error('User not found');
      const start = startOfDay(new Date()).toISOString();
      const end = endOfDay(new Date()).toISOString();
      const now = new Date().toISOString();
      
      // 1. Update the individual activity
      // FIX: Usando o client oficial com .select() para evitar erro 400 (No API key found)
      const { error: activityError } = await supabase
        .from('routine_activities')
        .update({ 
          is_completed: !isCompleted,
          updated_at: now
        })
        .eq('id', activityId)
        .select();
        
      if (activityError) throw activityError;

      // 2. Check if all activities in this routine block are completed today
      const { data: siblingActivities, error: siblingsError } = await supabase
        .from('routine_activities')
        .select('id, is_completed, updated_at')
        .eq('routine_id', routineId);
        
      if (siblingsError) throw siblingsError;

      // We need to simulate the updated state for the current activity
      const allCompletedToday = siblingActivities.every(act => {
        if (act.id === activityId) return !isCompleted;
        return act.is_completed && new Date(act.updated_at) >= new Date(start);
      });

      // 3. Update routine_logs for the parent block
      if (allCompletedToday) {
        // Check if log already exists
        const { data: existingLog } = await supabase
          .from('routine_logs')
          .select('id')
          .eq('routine_id', routineId)
          .eq('user_id', user?.id)
          .gte('created_at', start)
          .lte('created_at', end)
          .maybeSingle();
          
        if (!existingLog) {
          // FIX: Adicionado .select() para garantir o retorno e evitar erro de headers
          await supabase
            .from('routine_logs')
            .insert({ 
              routine_id: routineId, 
              user_id: user?.id,
              created_at: now
            })
            .select();
        }
      } else {
        // Remove log if not all activities are completed
        await supabase
          .from('routine_logs')
          .delete()
          .eq('routine_id', routineId)
          .eq('user_id', user?.id)
          .gte('created_at', start)
          .lte('created_at', end);
      }
    },
    onMutate: async ({ activityId, routineId, isCompleted }) => {
      const queryKey = ['routines', user?.id];
      await queryClient.cancelQueries({ queryKey });
      
      const previousRoutines = queryClient.getQueryData<any[]>(queryKey);
      
      // Optimistically update the activity
      queryClient.setQueryData<any[]>(queryKey, old => {
        if (!old) return old;
        return old.map(routine => {
          if (routine.id === routineId) {
            return {
              ...routine,
              activities: routine.activities?.map((act: any) => 
                act.id === activityId 
                  ? { ...act, is_completed: !isCompleted, updated_at: new Date().toISOString() } 
                  : act
              )
            };
          }
          return routine;
        });
      });
      
      return { previousRoutines };
    },
    onError: (err, variables, context) => {
      console.error('Error toggling routine activity:', err);
      const queryKey = ['routines', user?.id];
      queryClient.setQueryData(queryKey, context?.previousRoutines);
      toast.error('Erro ao atualizar rotina');
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['routines'] });
      await queryClient.invalidateQueries({ queryKey: ['routine_logs'] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['insights'] });
    }
  });

  const toggleRoutineCompletion = (activityId: string, routineId: string, isCompleted: boolean) => {
    if (!activityId || !routineId) return;
    toggleRoutineMutation.mutate({ activityId, routineId, isCompleted });
  };

  const openEditModal = (routine: Routine) => {
    setEditingRoutine(routine);
    setIsCreateModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingRoutine(null);
    setIsCreateModalOpen(false);
  };

  // Filter routines for today
  const todayDay = new Date().getDay();
  const activeRoutinesToday = routines.filter(r => r.is_active && r.days_of_week?.includes(todayDay));

  // Group activities by period for today's view
  const allActivitiesToday = activeRoutinesToday.flatMap(r => 
    r.activities?.map(a => ({ ...a, routineName: r.name, routineId: r.id })) || []
  ).sort((a, b) => a.time.localeCompare(b.time));

  const groupedToday = allActivitiesToday.reduce((acc, activity) => {
    const periodInfo = getPeriodInfo(activity.time);
    const periodLabel = periodInfo.label;
    if (!acc[periodLabel]) {
      acc[periodLabel] = { label: periodLabel, icon: periodInfo.icon, items: [] };
    }
    acc[periodLabel].items.push(activity);
    return acc;
  }, {} as Record<string, { label: string, icon: string, items: any[] }>);

  const periodOrder = ['Manhã', 'Tarde', 'Noite', 'Madrugada'];

  return (
    <main className="flex-1 flex overflow-y-auto bg-white">
      <div className="max-w-3xl mx-auto w-full pt-6 md:pt-10 px-4 md:px-8 pb-20">
        
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
                Gerenciar Rotinas
              </button>
            </header>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <p className="text-sm">Carregando rotinas...</p>
              </div>
            ) : allActivitiesToday.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-slate-500">Nenhuma rotina programada para hoje.</p>
                <Button 
                  onClick={() => { setEditingRoutine(null); setIsCreateModalOpen(true); }}
                  variant="outline"
                  className="mt-4 text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Configurar Rotinas
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {periodOrder.map(periodLabel => {
                  const group = groupedToday[periodLabel];
                  if (!group || group.items.length === 0) return null;

                  return (
                    <div key={periodLabel}>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-6 mb-2 flex items-center gap-2">
                        <span>{group.icon}</span> {group.label}
                      </h3>
                      <div className="flex flex-col">
                        {group.items.map(activity => {
                          const start = startOfDay(new Date()).toISOString();
                          const isCompleted = activity.is_completed && new Date(activity.updated_at) >= new Date(start);
                          return (
                            <div 
                              key={activity.id}
                              className="flex items-center gap-3 py-3 px-2 border-b border-gray-100 last:border-0 group hover:bg-gray-50/50 active:bg-gray-100 transition-colors duration-200 cursor-pointer"
                              onClick={() => toggleRoutineCompletion(activity.id, activity.routineId, isCompleted)}
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
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  "text-sm font-medium transition-colors truncate",
                                  isCompleted ? "text-slate-400 line-through" : "text-slate-800"
                                )}>
                                  {activity.title}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                  {activity.routineName}
                                </p>
                              </div>
                              <span className="text-xs font-medium text-slate-400 shrink-0">
                                {activity.time}
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
                  Gerenciador de Rotinas
                </h1>
              </div>
              <Button 
                onClick={() => { setEditingRoutine(null); setIsCreateModalOpen(true); }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Bloco
              </Button>
            </header>

            <div className="grid grid-cols-1 gap-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <p className="text-sm">Carregando rotinas...</p>
                </div>
              ) : routines.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                  Nenhum bloco de rotina configurado.
                </div>
              ) : (
                routines.map(routine => (
                  <div 
                    key={routine.id}
                    className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{routine.name}</h3>
                        <div className="flex gap-1">
                          {DAYS.map(day => (
                            <span 
                              key={day.id}
                              className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border",
                                routine.days_of_week?.includes(day.id)
                                  ? "bg-blue-50 border-blue-200 text-blue-600"
                                  : "bg-slate-50 border-slate-100 text-slate-300"
                              )}
                            >
                              {day.label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => openEditModal(routine)} 
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteRoutine(routine.id)} 
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {routine.activities?.slice(0, 3).map(activity => (
                        <div key={activity.id} className="flex items-center gap-2 text-sm text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span className="font-bold w-10">{activity.time}</span>
                          <span className="truncate">{activity.title}</span>
                        </div>
                      ))}
                      {(routine.activities?.length || 0) > 3 && (
                        <p className="text-xs text-slate-400 font-medium pl-5">
                          + {(routine.activities?.length || 0) - 3} outras atividades
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <RoutineManagerModal 
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
