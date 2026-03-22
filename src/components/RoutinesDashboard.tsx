import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Plus, Edit2, Trash2, X, Clock, ArrowLeft, Check, Loader2 } from 'lucide-react';
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
    setActivities(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
  };

  const removeActivity = (index: number) => {
    setActivities(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  const isSaveDisabled = !name.trim() || daysOfWeek.length === 0 || activities.length === 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="font-bold text-lg text-slate-800">
            {editingRoutine ? 'Editar Bloco de Rotina' : 'Novo Bloco de Rotina'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-8 overflow-y-auto">
          {/* Routine Name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome da Rotina</label>
            <input 
              type="text" 
              placeholder="Ex: Rotina Matinal, Faxina de Sábado..." 
              className="w-full text-base font-medium text-slate-900 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Days of Week */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Dias da Semana</label>
            <div className="flex justify-between gap-2">
              {DAYS.map(day => (
                <button
                  key={day.id}
                  onClick={() => toggleDay(day.id)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                    daysOfWeek.includes(day.id)
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Builder */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Atividades</label>
              <button 
                onClick={addActivity}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Adicionar Atividade
              </button>
            </div>
            
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                  <input 
                    type="time" 
                    className="bg-transparent text-sm font-bold text-slate-700 w-20 focus:outline-none"
                    value={activity.time}
                    onChange={e => updateActivity(index, 'time', e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Nome da atividade"
                    className="flex-1 bg-transparent text-sm font-medium text-slate-900 focus:outline-none"
                    value={activity.title}
                    onChange={e => updateActivity(index, 'title', e.target.value)}
                  />
                  <button 
                    onClick={() => removeActivity(index)}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">
                  <p className="text-sm text-slate-400">Nenhuma atividade adicionada.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            Cancelar
          </button>
          <button 
            disabled={isSaveDisabled}
            onClick={async () => {
              if (isSaveDisabled) return;
              await onSave({ name, days_of_week: daysOfWeek }, activities);
            }}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
          >
            {editingRoutine ? 'Atualizar Rotina' : 'Criar Rotina'}
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
  const [routineLogs, setRoutineLogs] = useState<any[]>([]);
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
      const todayDay = new Date().getDay();
      const start = startOfDay(new Date()).toISOString();
      const end = endOfDay(new Date()).toISOString();
      
      // Fetch routines with their activities and routine logs
      const [routinesResponse, logsResponse] = await Promise.all([
        supabase
          .from('routines')
          .select('*, routine_activities(*)')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('routine_logs')
          .select('*')
          .eq('user_id', user?.id)
          .gte('created_at', start)
          .lte('created_at', end)
      ]);

      if (routinesResponse.error) throw routinesResponse.error;
      if (logsResponse.error) throw logsResponse.error;
      
      // Sort activities by time
      const processedData = (routinesResponse.data || []).map(routine => ({
        ...routine,
        activities: routine.routine_activities?.sort((a: any, b: any) => a.time.localeCompare(b.time))
      }));

      setRoutines(processedData);
      setRoutineLogs(logsResponse.data || []);
    } catch (error) {
      console.error('Error fetching routines:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRoutine = async (routineData: Partial<Routine>, activitiesData: Partial<RoutineActivity>[]) => {
    if (!user) return;

    try {
      let routineId = editingRoutine?.id;

      if (editingRoutine) {
        // Update routine
        const { error: routineError } = await supabase
          .from('routines')
          .update({
            name: routineData.name,
            days_of_week: routineData.days_of_week,
          })
          .eq('id', editingRoutine.id);

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

        const { error: activitiesError } = await supabase
          .from('routine_activities')
          .insert(activitiesToInsert);

        if (activitiesError) throw activitiesError;
      }

      toast.success(editingRoutine ? 'Rotina atualizada com sucesso!' : 'Rotina criada com sucesso!');
      setIsCreateModalOpen(false);
      setEditingRoutine(null);
      fetchRoutines();
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
      setRoutines(routines.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting routine:', error);
    }
  };

  const toggleRoutineCompletion = async (routineId: string) => {
    const isCompleted = routineLogs.some(log => log.routine_id === routineId);
    const start = startOfDay(new Date()).toISOString();
    const end = endOfDay(new Date()).toISOString();

    if (isCompleted) {
      // Optimistic update
      setRoutineLogs(routineLogs.filter(log => log.routine_id !== routineId));
      
      try {
        const { error } = await supabase
          .from('routine_logs')
          .delete()
          .eq('routine_id', routineId)
          .eq('user_id', user?.id)
          .gte('created_at', start)
          .lte('created_at', end);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting routine log:', error);
        fetchRoutines(); // Revert
      }
    } else {
      // Optimistic update
      const newLog = { id: 'temp', routine_id: routineId, user_id: user?.id, created_at: new Date().toISOString() };
      setRoutineLogs([...routineLogs, newLog]);
      
      try {
        const { error } = await supabase
          .from('routine_logs')
          .insert({ routine_id: routineId, user_id: user?.id });

        if (error) throw error;
      } catch (error) {
        console.error('Error inserting routine log:', error);
        fetchRoutines(); // Revert
      }
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
                          const isCompleted = routineLogs.some(log => log.routine_id === activity.id);
                          return (
                            <div 
                              key={activity.id}
                              className="flex items-center gap-3 py-3 border-b border-slate-100 group transition-colors hover:bg-slate-50/50 -mx-4 px-4 rounded-lg cursor-pointer"
                              onClick={() => toggleRoutineCompletion(activity.id)}
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
