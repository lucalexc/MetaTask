import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Target, Repeat, Clock, Calendar, Trophy } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { useActivities, ActivityType, Period } from '@/src/hooks/useActivities';

export default function CreateActivityModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const { createActivity } = useActivities();
  const [type, setType] = useState<ActivityType>('routine');
  const [name, setName] = useState('');
  const [period, setPeriod] = useState<Period>('morning');
  const [scheduledTime, setScheduledTime] = useState('');
  const [activeDays, setActiveDays] = useState<boolean[]>(Array(7).fill(true));
  const [durationDays, setDurationDays] = useState(30);
  const [repsPerDay, setRepsPerDay] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const periods = [
    { id: 'morning', label: 'Manhã' },
    { id: 'afternoon', label: 'Tarde' },
    { id: 'night', label: 'Noite' },
    { id: 'anytime', label: 'Qualquer Horário' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await createActivity({
        name,
        type,
        period,
        scheduled_time: scheduledTime || undefined,
        active_days: activeDays,
        duration_days: type === 'goal' ? durationDays : undefined,
        reps_per_day: repsPerDay,
        xp_reward: type === 'goal' ? 25 : 10,
        is_active: true,
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create activity', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 text-gray-900"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Nova Atividade</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setType('routine')}
              className={cn(
                "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all",
                type === 'routine' 
                  ? "border-blue-500 bg-blue-50 text-blue-700" 
                  : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
              )}
            >
              <Repeat className="w-8 h-8 mb-3" />
              <span className="font-black uppercase tracking-widest text-[11px]">Rotina</span>
              <span className="text-[10px] opacity-70 mt-1 font-medium">Hábito contínuo</span>
            </button>
            <button
              type="button"
              onClick={() => setType('goal')}
              className={cn(
                "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all",
                type === 'goal' 
                  ? "border-purple-500 bg-purple-50 text-purple-700" 
                  : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
              )}
            >
              <Target className="w-8 h-8 mb-3" />
              <span className="font-black uppercase tracking-widest text-[11px]">Meta</span>
              <span className="text-[10px] opacity-70 mt-1 font-medium">Desafio com prazo</span>
            </button>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nome da Atividade</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={type === 'routine' ? "Ex: Meditar 10 min" : "Ex: Correr 5km"}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
              required
            />
          </div>

          {/* Period & Time */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Período</label>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value as Period)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none font-semibold"
              >
                {periods.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Horário (Opcional)</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-5 py-4 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Active Days */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Dias da Semana</label>
            <div className="flex justify-between gap-2">
              {daysOfWeek.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    const newDays = [...activeDays];
                    newDays[index] = !newDays[index];
                    setActiveDays(newDays);
                  }}
                  className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs transition-all",
                    activeDays[index]
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Goal Specific Fields */}
          <AnimatePresence>
            {type === 'goal' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-6 overflow-hidden"
              >
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Duração (Dias)</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input
                      type="number"
                      min="1"
                      value={durationDays}
                      onChange={e => setDurationDays(parseInt(e.target.value) || 1)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-5 py-4 text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-semibold"
                    />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Repetições/Dia</label>
                  <div className="relative">
                    <Repeat className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input
                      type="number"
                      min="1"
                      value={repsPerDay}
                      onChange={e => setRepsPerDay(parseInt(e.target.value) || 1)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-5 py-4 text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-semibold"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4">
            <Trophy className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold text-blue-800 leading-relaxed">
              {type === 'routine' 
                ? "Rotinas rendem 10 XP por conclusão. Mantenha o streak para subir de nível mais rápido!" 
                : "Metas rendem 25 XP por conclusão. Complete o ciclo para ganhar bônus especiais!"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 text-sm font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-2xl transition-all"
            >
              Cancelar
            </button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className={cn(
                "px-10 py-7 rounded-2xl font-black uppercase tracking-widest text-xs text-white shadow-xl transition-all",
                type === 'routine' 
                  ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20" 
                  : "bg-purple-600 hover:bg-purple-700 shadow-purple-600/20"
              )}
            >
              {isSubmitting ? 'Salvando...' : 'Criar Atividade'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
