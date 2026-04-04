import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, RefreshCw, Loader2, Clock, Calendar, Repeat } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { supabase } from '@/src/lib/supabase';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';

interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => Promise<void> | void;
  activityToEdit?: any;
}

export default function CreateActivityModal({ isOpen, onClose, onSuccess, activityToEdit }: CreateActivityModalProps) {
  const [type, setType] = useState<'routine' | 'goal'>('routine');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [period, setPeriod] = useState('Manhã');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [repetitions, setRepetitions] = useState('1');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const resetForm = () => {
    if (activityToEdit) {
      setType(activityToEdit.type);
      setName(activityToEdit.name);
      setDescription(activityToEdit.description || '');
      const activityTime = activityToEdit.time || '';
      setTime(activityTime);
      setDuration(activityToEdit.duration_days?.toString() || '');
      setRepetitions(activityToEdit.reps_per_day?.toString() || '1');
      setSelectedDays(activityToEdit.selected_days || [0, 1, 2, 3, 4, 5, 6]);
      
      // Auto-calculate period from time if it's a routine
      if (activityToEdit.type === 'routine' && activityTime.length >= 2) {
        const hours = parseInt(activityTime.slice(0, 2));
        if (hours >= 0 && hours < 12) setPeriod('Manhã');
        else if (hours >= 12 && hours < 18) setPeriod('Tarde');
        else if (hours >= 18 && hours <= 23) setPeriod('Noite');
      } else {
        const reversePeriodMap: Record<string, string> = {
          'morning': 'Manhã',
          'afternoon': 'Tarde',
          'evening': 'Noite',
          'night': 'Noite'
        };
        setPeriod(reversePeriodMap[activityToEdit.period] || 'Manhã');
      }
    } else {
      setType('routine');
      setName('');
      setDescription('');
      setPeriod('Manhã');
      setTime('');
      setDuration('');
      setRepetitions('1');
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, activityToEdit]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    if (value.length >= 3) {
      const hours = value.slice(0, 2);
      const minutes = value.slice(2, 4);
      
      // Validação de 24h
      const validHours = Math.min(parseInt(hours, 10), 23).toString().padStart(2, '0');
      
      // Se já temos minutos, validamos também
      let validMinutes = minutes;
      if (minutes.length === 2) {
        validMinutes = Math.min(parseInt(minutes, 10), 59).toString().padStart(2, '0');
      }
      
      value = `${validHours}:${validMinutes}`;
    } else if (value.length > 0) {
      // Validação básica para as primeiras 2 horas
      const hours = parseInt(value, 10);
      if (hours > 23) value = '23';
    }

    const formattedTime = value.slice(0, 5);
    setTime(formattedTime);

    // Auto-select period
    if (formattedTime.length >= 2) {
      const hours = parseInt(formattedTime.slice(0, 2));
      if (hours >= 0 && hours < 12) {
        setPeriod('Manhã');
      } else if (hours >= 12 && hours < 18) {
        setPeriod('Tarde');
      } else if (hours >= 18 && hours <= 23) {
        setPeriod('Noite');
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('O nome da atividade é obrigatório');
      return;
    }

    if (type === 'routine') {
      if (!time) {
        toast.error('Selecione um horário para a atividade');
        return;
      }
      if (selectedDays.length === 0) {
        toast.error('Selecione pelo menos um dia da semana');
        return;
      }
    } else {
      if (!time || time.length !== 5) {
        toast.error('O horário é obrigatório');
        return;
      }
    }

    setIsLoading(true);
    try {
      // 1. Injeção Obrigatória do Usuário (user_id)
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Usuário não autenticado');

      const periodMap: Record<string, string> = {
        'Manhã': 'morning',
        'Tarde': 'afternoon',
        'Noite': 'evening'
      };

      const payload = {
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        type,
        period: periodMap[period] || 'anytime',
        scheduled_time: time.length === 5 ? time : null,
        duration_days: type === 'goal' && duration ? parseInt(duration) : null,
        reps_per_day: type === 'goal' && repetitions ? parseInt(repetitions) : 1,
        xp_reward: type === 'routine' ? 10 : 50,
        is_active: true,
        active_days: [true, true, true, true, true, true, true], // Ativo todos os dias por padrão
        selected_days: type === 'routine' ? selectedDays : [0, 1, 2, 3, 4, 5, 6],
        start_date: new Date().toISOString()
      };

      if (activityToEdit) {
        // 2. Tratamento de Erro Implacável
        const { data, error } = await supabase
          .from('activities')
          .update(payload)
          .eq('id', activityToEdit.id)
          .select();

        if (error) {
          console.error("ERRO SUPABASE:", error);
          toast.error("Erro ao salvar: " + error.message);
          return;
        }
        
        // 3. Atualização Instantânea da Tela
        await onSuccess?.();
        toast.success('Atividade atualizada com sucesso!');
      } else {
        // 2. Tratamento de Erro Implacável
        const { data, error } = await supabase
          .from('activities')
          .insert([payload])
          .select();

        if (error) {
          console.error("ERRO SUPABASE:", error);
          toast.error("Erro ao salvar: " + error.message);
          return;
        }
        
        // 3. Atualização Instantânea da Tela
        await onSuccess?.();
        toast.success('Atividade criada com sucesso!');
      }

      resetForm();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar atividade:', error);
      toast.error(error.message || 'Erro ao salvar atividade');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activityToEdit) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityToEdit.id);
      if (error) throw error;
      await onSuccess?.();
      toast.success('Atividade excluída com sucesso!');
      onClose();
    } catch (error: any) {
      toast.error('Erro ao excluir atividade');
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
    }
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overscroll-none h-[100dvh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white border border-gray-200 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90dvh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-[14px] leading-[22px] font-bold text-[#202020]">
              {activityToEdit 
                ? (type === 'routine' ? 'Editar Rotina' : 'Editar Meta') 
                : (type === 'routine' ? 'Nova Rotina' : 'Nova Meta')}
            </h2>
            <button onClick={onClose} className="text-[#808080] hover:text-[#202020] transition-colors ease-out duration-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 pt-4 space-y-4 overflow-y-auto max-h-[70vh] scrollbar-none">
            {/* Type Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1 gap-0.5 mb-3">
              <button
                className={`flex-1 h-8 rounded-md text-sm font-medium flex items-center justify-center gap-1.5 transition-all
                  ${type === 'routine'
                    ? 'bg-white text-violet-600 font-semibold shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
                onClick={() => setType('routine')}
              >
                <RefreshCw size={13} /> Rotina
              </button>
              <button
                className={`flex-1 h-8 rounded-md text-sm font-medium flex items-center justify-center gap-1.5 transition-all
                  ${type === 'goal'
                    ? 'bg-white text-violet-600 font-semibold shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
                onClick={() => setType('goal')}
              >
                <Target size={13} /> Meta
              </button>
            </div>

            {/* Name */}
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Meditação, Ler 20 páginas..."
                className="w-full h-11 border-[1.5px] border-gray-200 rounded-xl px-3.5 text-[15px] font-medium
                           placeholder:text-gray-300 placeholder:font-normal
                           focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/8"
              />
            </div>

            {/* Conditional Fields */}
            <div className="space-y-4">
              {type === 'routine' ? (
                <div className="space-y-4">
                  {/* Horário + Descrição */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Horário */}
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 block mb-1.5">
                        Horário
                      </label>
                      <div className="relative">
                        <Clock size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={time || ''}
                          onChange={handleTimeChange}
                          inputMode="numeric"
                          maxLength={5}
                          placeholder="00:00"
                          className="w-full h-[38px] border-[1.5px] border-gray-200 rounded-lg pl-8 pr-3
                                     text-sm font-semibold text-violet-600
                                     focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>

                    {/* Descrição */}
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 block mb-1.5">
                        Descrição <span className="normal-case font-normal tracking-normal text-gray-300">(opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Detalhes..."
                        className="w-full h-[38px] border-[1.5px] border-gray-200 rounded-lg px-3
                                   text-sm text-gray-600 placeholder:text-gray-300
                                   focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                  
                  {/* Weekdays Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        Dias da Semana
                      </label>
                      <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                        {selectedDays.length === 7 ? 'Todos os dias'
                          : selectedDays.length === 0 ? 'Nenhum dia'
                          : `${selectedDays.length} ${selectedDays.length === 1 ? 'dia' : 'dias'}`}
                      </span>
                    </div>

                    <div className="flex gap-1.5">
                      {[
                        { key: 0, abbr: 'Do', full: 'Domingo' },
                        { key: 1, abbr: 'Se', full: 'Segunda' },
                        { key: 2, abbr: 'Te', full: 'Terça'   },
                        { key: 3, abbr: 'Qa', full: 'Quarta'  },
                        { key: 4, abbr: 'Qi', full: 'Quinta'  },
                        { key: 5, abbr: 'Sx', full: 'Sexta'   },
                        { key: 6, abbr: 'Sa', full: 'Sábado'  },
                      ].map(day => (
                        <button
                          key={day.key}
                          type="button"
                          title={day.full}
                          onClick={() => {
                            if (selectedDays.includes(day.key)) {
                              setSelectedDays(selectedDays.filter(d => d !== day.key));
                            } else {
                              setSelectedDays([...selectedDays, day.key].sort());
                            }
                          }}
                          className={`flex-1 h-9 rounded-lg text-[11px] font-bold border-[1.5px] transition-all
                            ${selectedDays.includes(day.key)
                              ? 'bg-violet-50 border-violet-500 text-violet-600'
                              : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-violet-300 hover:text-violet-500'
                            }`}
                        >
                          {day.abbr}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Description for Goal */}
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-[#202020] ml-1">Descrição (Opcional)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detalhes sobre a atividade..."
                      rows={2}
                      className="w-full bg-gray-50/30 border border-gray-100 rounded-xl px-3 py-2.5 text-base md:text-[13px] text-[#202020] placeholder-[#808080] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 resize-none"
                    />
                  </div>

                  {/* Duration Setting */}
                  <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Duração (Dias)</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="Ex: 30"
                      className="w-24 bg-transparent text-right font-semibold text-blue-600 focus:ring-0 border-none p-0 text-base md:text-[14px]"
                    />
                  </div>

                  {/* Time Setting */}
                  <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>Horário</span>
                    </div>
                    <input
                      type="text"
                      value={time}
                      onChange={handleTimeChange}
                      placeholder="00:00"
                      inputMode="numeric"
                      maxLength={5}
                      className="w-24 bg-transparent text-right font-semibold text-blue-600 focus:ring-0 border-none p-0 text-base md:text-[14px]"
                    />
                  </div>

                  {/* Repetitions Setting */}
                  <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Repeat className="w-4 h-4 text-gray-400" />
                      <span>Repetições/Dia</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={repetitions}
                      onChange={(e) => setRepetitions(e.target.value)}
                      placeholder="Ex: 1"
                      className="w-24 bg-transparent text-right font-semibold text-blue-600 focus:ring-0 border-none p-0 text-base md:text-[14px]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 mt-3 bg-gray-50 rounded-b-xl">
            {activityToEdit ? (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={isLoading}
                className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors ease-out duration-200 disabled:opacity-50"
              >
                Excluir
              </button>
            ) : (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                ⚡ <span className="text-violet-500 font-semibold">+{type === 'routine' ? '10' : '50'} XP</span> por conclusão
              </span>
            )}
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} disabled={isLoading}
                className="px-4 h-9 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button type="button" onClick={handleSave} disabled={isLoading || !name.trim()}
                className="px-5 h-9 rounded-lg text-sm font-semibold bg-violet-600 text-white
                           hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isLoading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Rotina"
        description="Tem certeza que deseja excluir esta rotina? Esta ação não poderá ser desfeita."
        isLoading={isLoading}
      />
    </AnimatePresence>
  );
}
