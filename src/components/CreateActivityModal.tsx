import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { supabase } from '@/src/lib/supabase';

interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateActivityModal({ isOpen, onClose, onSuccess }: CreateActivityModalProps) {
  const [type, setType] = useState<'routine' | 'goal'>('routine');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [period, setPeriod] = useState('morning');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [repetitions, setRepetitions] = useState('1');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setType('routine');
    setName('');
    setDescription('');
    setPeriod('morning');
    setTime('');
    setDuration('');
    setRepetitions('1');
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Usuário não autenticado');

      const activityData = {
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        type,
        period: type === 'routine' ? period : null,
        time: type === 'routine' && time ? time : null,
        duration_days: type === 'goal' && duration ? parseInt(duration) : null,
        reps_per_day: type === 'goal' && repetitions ? parseInt(repetitions) : 1,
        xp_reward: type === 'routine' ? 10 : 50, // Recompensa base
        is_completed: false,
        streak: 0,
      };

      const { error } = await supabase
        .from('activities')
        .insert([activityData]);

      if (error) throw error;

      resetForm();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao criar atividade:', error);
      // Aqui você pode adicionar um toast de erro no futuro
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#0C1020] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-[#E8EAF0]">Nova Atividade</h2>
            <button onClick={onClose} className="text-[#8B90A8] hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] scrollbar-none">
            {/* Type Selector */}
            <div className="flex gap-3">
              <button
                onClick={() => setType('routine')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all",
                  type === 'routine'
                    ? "bg-blue-500/10 border-blue-500/50 text-blue-400"
                    : "border-white/10 text-[#8B90A8] hover:bg-white/5"
                )}
              >
                <RefreshCw className="w-4 h-4" /> Rotina
              </button>
              <button
                onClick={() => setType('goal')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all",
                  type === 'goal'
                    ? "bg-blue-500/10 border-blue-500/50 text-blue-400"
                    : "border-white/10 text-[#8B90A8] hover:bg-white/5"
                )}
              >
                <Target className="w-4 h-4" /> Meta
              </button>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#8B90A8] uppercase tracking-wider">Nome da Atividade</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Ler 10 páginas, Meditar..."
                className="w-full bg-[#111630] border border-white/10 rounded-xl px-4 py-3 text-[#E8EAF0] placeholder-[#8B90A8] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#8B90A8] uppercase tracking-wider">Descrição (Opcional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes sobre a atividade..."
                rows={2}
                className="w-full bg-[#111630] border border-white/10 rounded-xl px-4 py-3 text-[#E8EAF0] placeholder-[#8B90A8] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none"
              />
            </div>

            {/* Conditional Fields */}
            {type === 'routine' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#8B90A8] uppercase tracking-wider">Período</label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full bg-[#111630] border border-white/10 rounded-xl px-4 py-3 text-[#E8EAF0] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none"
                  >
                    <option value="morning">Manhã</option>
                    <option value="afternoon">Tarde</option>
                    <option value="evening">Noite</option>
                    <option value="anytime">Qualquer Horário</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#8B90A8] uppercase tracking-wider">Horário (Opcional)</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-[#111630] border border-white/10 rounded-xl px-4 py-3 text-[#E8EAF0] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all [color-scheme:dark]"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#8B90A8] uppercase tracking-wider">Duração (Dias)</label>
                  <input
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Ex: 30"
                    className="w-full bg-[#111630] border border-white/10 rounded-xl px-4 py-3 text-[#E8EAF0] placeholder-[#8B90A8] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#8B90A8] uppercase tracking-wider">Repetições/Dia</label>
                  <input
                    type="number"
                    min="1"
                    value={repetitions}
                    onChange={(e) => setRepetitions(e.target.value)}
                    placeholder="Ex: 1"
                    className="w-full bg-[#111630] border border-white/10 rounded-xl px-4 py-3 text-[#E8EAF0] placeholder-[#8B90A8] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 bg-[#0C1020] flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-[#8B90A8] hover:text-white hover:bg-white/5 transition-colors font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !name.trim()}
              className="px-6 py-2 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Salvar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
