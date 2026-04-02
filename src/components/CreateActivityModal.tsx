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
    
    if (value.length > 4) {
      value = value.slice(0, 4);
    }

    let formattedTime = value;
    if (value.length >= 3) {
      formattedTime = `${value.slice(0, 2)}:${value.slice(2)}`;
    }

    // Validate hours and minutes
    if (formattedTime.length >= 2) {
      const hours = parseInt(formattedTime.slice(0, 2));
      if (hours > 23) {
        formattedTime = `23${formattedTime.slice(2)}`;
      }
    }
    if (formattedTime.length === 5) {
      const minutes = parseInt(formattedTime.slice(3, 5));
      if (minutes > 59) {
        formattedTime = `${formattedTime.slice(0, 3)}59`;
      }
    }

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

    if (!time || time.length !== 5) {
      toast.error('O horário é obrigatório');
      return;
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
          <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] scrollbar-none">
            {/* Type Selector */}
            <div className="flex gap-3">
              <button
                onClick={() => setType('routine')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-[13px] font-medium transition-all ease-out duration-200",
                  type === 'routine'
                    ? "bg-[#dceaff] border-[#1f60c2] text-[#1f60c2]"
                    : "border-gray-200 text-[#808080] hover:bg-gray-50"
                )}
              >
                <RefreshCw className="w-4 h-4" /> Rotina
              </button>
              <button
                onClick={() => setType('goal')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-[13px] font-medium transition-all ease-out duration-200",
                  type === 'goal'
                    ? "bg-[#dceaff] border-[#1f60c2] text-[#1f60c2]"
                    : "border-gray-200 text-[#808080] hover:bg-gray-50"
                )}
              >
                <Target className="w-4 h-4" /> Meta
              </button>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-[#202020]">Nome da Atividade</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Ler 10 páginas, Meditar..."
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-base md:text-[13px] text-[#202020] placeholder-[#808080] focus:outline-none focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2] transition-all duration-200"
              />
            </div>

            {/* Description */}
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

            {/* Conditional Fields */}
            <div className="space-y-6">
              {type === 'routine' ? (
                <div className="space-y-4">
                  {/* Time Setting Section */}
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
                      maxLength={5}
                      className="w-24 bg-transparent text-right font-semibold text-blue-600 focus:ring-0 border-none p-0 text-base md:text-[14px]"
                    />
                  </div>
                  
                  {/* Weekdays Section */}
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-[#202020] block">Dias da Semana</label>
                    <div className="flex justify-between w-full mt-2">
                      {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => {
                        const isActive = selectedDays.includes(index);
                        return (
                          <button
                            key={index}
                            onClick={() => {
                              if (isActive) {
                                setSelectedDays(selectedDays.filter(d => d !== index));
                              } else {
                                setSelectedDays([...selectedDays, index].sort());
                              }
                            }}
                            className={cn(
                              "h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200",
                              isActive 
                                ? "bg-blue-600 text-white shadow-sm shadow-blue-200" 
                                : "bg-white border border-gray-100 text-slate-500 hover:bg-gray-50"
                            )}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
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
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between rounded-b-xl">
            <div>
              {activityToEdit && (
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  disabled={isLoading}
                  className="text-[13px] text-red-500 hover:text-red-600 font-medium transition-colors ease-out duration-200 disabled:opacity-50"
                >
                  {type === 'routine' ? 'Excluir Rotina' : 'Excluir Meta'}
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-[13px] text-[#808080] hover:text-[#202020] hover:bg-gray-200 transition-colors ease-out duration-200 font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading || !name.trim()}
                className="px-6 py-2 rounded-xl text-[13px] text-white font-bold bg-[#1f60c2] hover:bg-[#1a50a3] transition-all ease-out duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-100"
              >
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
