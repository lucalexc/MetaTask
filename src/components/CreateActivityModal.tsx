import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, RefreshCw } from 'lucide-react';
import { cn } from '@/src/lib/utils'; // Ajuste o caminho do utils se necessário
import { Button } from '@/src/components/ui/button'; // Ajuste o caminho do botão se necessário
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/lib/AuthContext';

export default function CreateActivityModal({ isOpen, onClose, onSuccess }: any) {
  const { user } = useAuth();
  const [type, setType] = useState<'routine' | 'goal'>('routine');
  const [name, setName] = useState('');
  const [period, setPeriod] = useState('morning');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [repetitions, setRepetitions] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Por favor, insira o nome da atividade.');
      return;
    }

    if (!user) {
      alert('Usuário não autenticado.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        user_id: user.id,
        name: name.trim(),
        type,
        period,
        is_active: true,
        start_date: new Date().toISOString(),
        active_days: [true, true, true, true, true, true, true], // Default to all days
        xp_reward: type === 'goal' ? 50 : 10, // Default XP
      };

      if (type === 'routine') {
        payload.scheduled_time = time || null;
        payload.reps_per_day = 1;
      } else {
        payload.duration_days = duration ? parseInt(duration, 10) : null;
        payload.reps_per_day = repetitions ? parseInt(repetitions, 10) : 1;
      }

      const { error } = await supabase.from('activities').insert([payload]);

      if (error) throw error;

      onSuccess?.();
      onClose();
      
      // Reset form
      setName('');
      setPeriod('morning');
      setTime('');
      setDuration('');
      setRepetitions('1');
      setType('routine');

    } catch (error: any) {
      console.error('Erro ao salvar atividade:', error);
      alert('Erro ao salvar atividade. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Nova Atividade</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            <div className="flex gap-3">
              <button
                onClick={() => setType('routine')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all", 
                  type === 'routine' ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                <RefreshCw className="w-4 h-4" /> Rotina
              </button>
              <button
                onClick={() => setType('goal')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all", 
                  type === 'goal' ? "border-purple-600 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                <Target className="w-4 h-4" /> Meta
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Nome da Atividade</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Ler 10 páginas, Meditar..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <label className="text-xs font-bold text-gray-500 uppercase">Período</label>
                 <select 
                   value={period}
                   onChange={(e) => setPeriod(e.target.value)}
                   className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                 >
                   <option value="morning">Manhã</option>
                   <option value="afternoon">Tarde</option>
                   <option value="evening">Noite</option>
                   <option value="anytime">Qualquer Horário</option>
                 </select>
               </div>
               
               {type === 'routine' ? (
                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-gray-500 uppercase">Horário</label>
                   <input 
                     type="time" 
                     value={time}
                     onChange={(e) => setTime(e.target.value)}
                     className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
                   />
                 </div>
               ) : (
                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-gray-500 uppercase">Duração da meta</label>
                   <div className="relative">
                     <input 
                       type="number" 
                       value={duration}
                       onChange={(e) => setDuration(e.target.value)}
                       placeholder="Ex: 30"
                       min="1"
                       className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all pr-12" 
                     />
                     <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">dias</span>
                   </div>
                 </div>
               )}
            </div>

            {type === 'goal' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Repetições por dia</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={repetitions}
                    onChange={(e) => setRepetitions(e.target.value)}
                    placeholder="Ex: 1"
                    min="1"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all pr-28" 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">vez(es) por dia</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="text-gray-600 hover:bg-gray-200">Cancelar</Button>
            <Button onClick={handleSave} disabled={isSubmitting} className="bg-blue-600 text-white hover:bg-blue-700 px-6">
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
