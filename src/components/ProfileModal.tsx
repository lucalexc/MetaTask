import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { toast } from 'sonner';

export const AVATARS = [
  { id: 'avatar_1', emoji: '👨', label: 'Padrão' },
  { id: 'avatar_2', emoji: '🧑‍💻', label: 'Dev' },
  { id: 'avatar_3', emoji: '🦸', label: 'Herói' }
];

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatDateToBR = (isoDate: string | null) => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

const formatDateToISO = (brDate: string) => {
  if (!brDate) return null;
  const [day, month, year] = brDate.split('/');
  return `${year}-${month}-${day}`;
};

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [avatarId, setAvatarId] = useState('avatar_1');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && profile) {
      setFullName(profile.name || '');
      setBirthDate(formatDateToBR(profile.birth_date));
      setGender(profile.gender || '');
      setAvatarId(profile.avatar_id || 'avatar_1');
    }
  }, [isOpen, profile]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2);
    }
    if (value.length > 5) {
      value = value.substring(0, 5) + '/' + value.substring(5, 9);
    }
    setBirthDate(value);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (birthDate && birthDate.length !== 10) {
      toast.error("Por favor, preencha a data de nascimento completa (DD/MM/AAAA).");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: fullName,
          birth_date: formatDateToISO(birthDate),
          gender: gender || null,
          avatar_id: avatarId,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Perfil atualizado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedAvatar = AVATARS.find(a => a.id === avatarId) || AVATARS[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Editar Perfil</h2>
              <button 
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <form id="profile-form" onSubmit={handleSave} className="space-y-6">
                
                {/* Avatar Selection */}
                <div className="flex flex-col items-center gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-5xl shadow-inner">
                    {selectedAvatar.emoji}
                  </div>
                  
                  <div className="flex gap-3">
                    {AVATARS.map((avatar) => (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setAvatarId(avatar.id)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${
                          avatarId === avatar.id 
                            ? 'bg-violet-100 ring-2 ring-violet-500 ring-offset-2' 
                            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                        }`}
                        title={avatar.label}
                      >
                        {avatar.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full px-3 py-2 text-base md:text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all bg-gray-50 focus:bg-white"
                      placeholder="Seu nome"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Nascimento
                      </label>
                      <input
                        type="text"
                        id="birthDate"
                        value={birthDate}
                        onChange={handleDateChange}
                        maxLength={10}
                        placeholder="DD/MM/AAAA"
                        className="block w-full px-3 py-2 text-base md:text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all bg-gray-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                        Gênero
                      </label>
                      <select
                        id="gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="block w-full px-3 py-2 text-base md:text-sm border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all bg-gray-50 focus:bg-white appearance-none"
                      >
                        <option value="" disabled>Selecione</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Prefiro não informar">Prefiro não informar</option>
                      </select>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="profile-form"
                disabled={isSaving}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
