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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white border border-[#E8E8E8] rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-[#E8E8E8]">
          <h2 className="text-xl font-bold text-[#1A1A1A]">Nova Atividade</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('routine')}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
                type === 'routine' 
                  ? "border-blue-600 bg-blue-50 text-blue-700" 
                  : "border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200 hover:bg-gray-100"
              )}
            >
              <Repeat className="w-6 h-6 mb-2" />
              <span className="font-bold">Rotina</span>
              <span className="text-xs opacity-70 mt-1">Hábito contínuo</span>
            </button>
            <button
              type="button"
              onClick={() => setType('goal')}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
                type === 'goal' 
                  ? "border-purple-600 bg-purple-50 text-purple-700" 
                  : "border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200 hover:bg-gray-100"
              )}
            >
              <Target className="w-6 h-6 mb-2" />
              <span className="font-bold">Meta</span>
              <span className="text-xs opacity-70 mt-1">Desafio com prazo</span>
            </button>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Nome da Atividade</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={type === 'routine' ? "Ex: Meditar 10 min" : "Ex: Correr 5km"}
              className="w-full bg-white border border-[#E8E8E8] rounded-xl px-4 py-3 text-[#1A1A1A] placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
              required
            />
          </div>

          {/* Period & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Período</label>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value as Period)}
                className="w-full bg-white border border-[#E8E8E8] rounded-xl px-4 py-3 text-[#1A1A1A] focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all appearance-none"
              >
                {periods.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Horário (Opcional)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  className="w-full bg-white border border-[#E8E8E8] rounded-xl pl-10 pr-4 py-3 text-[#1A1A1A] focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Active Days */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Dias da Semana</label>
            <div className="flex justify-between gap-1">
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
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all",
                    activeDays[index]
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                      : "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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
                className="grid grid-cols-2 gap-4 overflow-hidden"
              >
                <div className="space-y-2 pt-2">
                  <label className="text-sm font-bold text-gray-700">Duração (Dias)</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      min="1"
                      value={durationDays}
                      onChange={e => setDurationDays(parseInt(e.target.value) || 1)}
                      className="w-full bg-white border border-[#E8E8E8] rounded-xl pl-10 pr-4 py-3 text-[#1A1A1A] focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <label className="text-sm font-bold text-gray-700">Repetições/Dia</label>
                  <div className="relative">
                    <Repeat className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      min="1"
                      value={repsPerDay}
                      onChange={e => setRepsPerDay(parseInt(e.target.value) || 1)}
                      className="w-full bg-white border border-[#E8E8E8] rounded-xl pl-10 pr-4 py-3 text-[#1A1A1A] focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
            <Trophy className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 leading-relaxed">
              {type === 'routine' 
                ? "Rotinas rendem 10 XP por conclusão. Mantenha o streak para multiplicar seus ganhos!" 
                : "Metas rendem 25 XP por conclusão. Complete o ciclo para ganhar um bônus especial!"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 border-[#E8E8E8] text-gray-600 hover:bg-gray-50 py-6 rounded-xl font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className={cn(
                "flex-1 py-6 rounded-xl font-bold text-white shadow-md transition-all",
                type === 'routine' 
                  ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/10" 
                  : "bg-purple-600 hover:bg-purple-700 shadow-purple-600/10"
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
