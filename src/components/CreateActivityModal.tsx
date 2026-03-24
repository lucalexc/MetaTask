import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, RefreshCw } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/lib/AuthContext';

interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateActivityModal({ isOpen, onClose, onSuccess }: CreateActivityModalProps) {
  const { user } = useAuth();
  
  // Form States
  const [type, setType] = useState<'routine' | 'goal'>('routine');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [period, setPeriod] = useState('morning');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [repetitions, setRepetitions] = useState('1');
  
  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Função para limpar todos os dados do formulário
  const resetForm = () => {
    setType('routine');
    setName('');
    setDescription('');
    setPeriod('morning');
    setTime('');
    setDuration('');
    setRepetitions('1');
    setIsSubmitting(false);
  };

  // 2. Efeito para garantir que o formulário seja limpo sempre que o modal fechar
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 3. Mutação blindada com Supabase
  const handleSave = async () => {
    if (!name.trim()) {
      alert('Por favor, insira o nome da atividade.');
      return;
    }

    if (!user) {
      alert('Usuário não autenticado. Faça login novamente.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Construção do Payload base
      const payload: any = {
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        type,
        is_active: true,
        start_date: new Date().toISOString(),
        active_days: [true, true, true, true, true, true, true], // Padrão: todos os dias
        xp_reward: type === 'goal' ? 50 : 10, // Recompensa baseada no tipo
      };

      // Mapeamento condicional de campos
      if (type === 'routine') {
        payload.period = period;
        payload.scheduled_time = time || null;
        payload.reps_per_day = 1;
        payload.duration_days = null;
      } else {
        payload.period = 'anytime'; // Metas geralmente não têm período fixo no dia
        payload.scheduled_time = null;
        payload.duration_days = duration ? parseInt(duration, 10) : null;
        payload.reps_per_day = repetitions ? parseInt(repetitions, 10) : 1;
      }

      // Inserção oficial via Supabase Client
      const { error } = await supabase.from('activities').insert([payload]);

      if (error) throw error;

      // Sucesso: Invalida/Atualiza a lista e fecha o modal
      onSuccess?.();
      handleClose();

    } catch (error: any) {
      console.error('Erro real ao salvar atividade no Supabase:', error);
      alert(`Erro ao salvar atividade: ${error.message || 'Falha na comunicação com o servidor.'}`);
    } finally {
      setIsSubmitting(false);
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
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-[#0C1020] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col text-[#E8EAF0]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <h2 className="text-lg font-bold tracking-tight">Nova Atividade</h2>
            <button 
              onClick={handleClose} 
              className="text-[#8B90A8] hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            
            {/* Segmented Control (Type Selector) */}
            <div className="flex gap-2 bg-[#06080F] p-1.5 rounded-xl border border-white/5">
              <button
                onClick={() => setType('routine')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  type === 'routine' 
                    ? 'bg-[#111630] text-blue-400 shadow-sm border border-white/10' 
                    : 'text-[#8B90A8] hover:text-[#E8EAF0]'
                }`}
              >
                <RefreshCw className="w-4 h-4" /> Rotina
              </button>
              <button
                onClick={() => setType('goal')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  type === 'goal' 
                    ? 'bg-[#111630] text-purple-400 shadow-sm border border-white/10' 
                    : 'text-[#8B90A8] hover:text-[#E8EAF0]'
                }`}
              >
                <Target className="w-4 h-4" /> Meta
              </button>
            </div>

            {/* Common Fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#8B90A8] uppercase tracking-wider block">Nome da Atividade</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Ler 10 páginas, Meditar..."
                  className="w-full px-4 py-3 bg-[#06080F] border border-white/10 rounded-xl text-sm text-[#E8EAF0] placeholder:text-[#8B90A8]/50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#8B90A8] uppercase tracking-wider block">Descrição (Opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes adicionais..."
                  rows={2}
                  className="w-full px-4 py-3 bg-[#06080F] border border-white/10 rounded-xl text-sm text-[#E8EAF0] placeholder:text-[#8B90A8]/50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                />
              </div>
            </div>

            {/* Conditional Fields */}
            <div className="grid grid-cols-2 gap-4">
               {type === 'routine' ? (
                 <>
                   <div className="space-y-1.5">
                     <label className="text-[11px] font-bold text-[#8B90A8] uppercase tracking-wider block">Período</label>
                     <select 
                       value={period}
                       onChange={(e) => setPeriod(e.target.value)}
                       className="w-full px-4 py-3 bg-[#06080F] border border-white/10 rounded-xl text-sm text-[#E8EAF0] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                     >
                       <option value="morning">Manhã</option>
                       <option value="afternoon">Tarde</option>
                       <option value="night">Noite</option>
                       <option value="anytime">Qualquer Horário</option>
                     </select>
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[11px] font-bold text-[#8B90A8] uppercase tracking-wider block">Horário</label>
                     <input 
                       type="time" 
                       value={time}
                       onChange={(e) => setTime(e.target.value)}
                       className="w-full px-4 py-3 bg-[#06080F] border border-white/10 rounded-xl text-sm text-[#E8EAF0] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all [color-scheme:dark]" 
                     />
                   </div>
                 </>
               ) : (
                 <>
                   <div className="space-y-1.5">
                     <label className="text-[11px] font-bold text-[#8B90A8] uppercase tracking-wider block">Duração da meta</label>
                     <div className="relative">
                       <input 
                         type="number" 
                         value={duration}
                         onChange={(e) => setDuration(e.target.value)}
                         placeholder="Ex: 30"
                         min="1"
                         className="w-full px-4 py-3 bg-[#06080F] border border-white/10 rounded-xl text-sm text-[#E8EAF0] placeholder:text-[#8B90A8]/50 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all pr-12" 
                       />
                       <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#8B90A8] pointer-events-none">dias</span>
                     </div>
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[11px] font-bold text-[#8B90A8] uppercase tracking-wider block">Repetições por dia</label>
                     <div className="relative">
                       <input 
                         type="number" 
                         value={repetitions}
                         onChange={(e) => setRepetitions(e.target.value)}
                         placeholder="Ex: 1"
                         min="1"
                         className="w-full px-4 py-3 bg-[#06080F] border border-white/10 rounded-xl text-sm text-[#E8EAF0] placeholder:text-[#8B90A8]/50 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all pr-28" 
                       />
                       <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#8B90A8] pointer-events-none">vez(es) por dia</span>
                     </div>
                   </div>
                 </>
               )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-5 bg-[#06080F]/50 border-t border-white/5 flex justify-end gap-3">
            <button 
              onClick={handleClose} 
              disabled={isSubmitting} 
              className="px-5 py-2.5 text-sm font-semibold text-[#8B90A8] hover:text-[#E8EAF0] hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSubmitting} 
              className={`px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                type === 'routine' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-blue-500/20' 
                  : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-purple-500/20'
              }`}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Atividade'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
