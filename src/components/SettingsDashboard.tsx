import React, { useState, useEffect } from 'react';
import { LogOut, MessageCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

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

export default function SettingsDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, birth_date, gender')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFullName(data.name || '');
        setBirthDate(formatDateToBR(data.birth_date));
        setGender(data.gender || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (birthDate && birthDate.length !== 10) {
      alert("Por favor, preencha a data de nascimento completa (DD/MM/AAAA).");
      return;
    }

    setSaveStatus('saving');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: fullName,
          birth_date: formatDateToISO(birthDate),
          gender: gender || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveStatus('idle');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="w-full bg-white">
      <div className="max-w-2xl mx-auto mt-6 md:mt-10 px-4 md:px-6 pb-20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Configurações</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie sua conta e preferências.</p>
        </div>

        {/* Section 1: Perfil do Usuário */}
        <section className="border-b border-gray-200 pb-8 mb-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Perfil</h2>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-sm">Carregando perfil...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile}>
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
                    className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#DC4C3E] focus:border-[#DC4C3E] transition-all bg-gray-50 focus:bg-white"
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
                      className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#DC4C3E] focus:border-[#DC4C3E] transition-all bg-gray-50 focus:bg-white"
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
                      className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#DC4C3E] focus:border-[#DC4C3E] transition-all bg-gray-50 focus:bg-white appearance-none"
                    >
                      <option value="" disabled>Selecione</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Prefiro não informar">Prefiro não informar</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                  className="bg-[#DC4C3E] hover:bg-[#C53727] text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#DC4C3E] focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saveStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'saved' ? 'Salvo!' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Section 2: Ajuda e Suporte */}
        <section className="border-b border-gray-200 pb-8 mb-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Suporte</h2>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              Precisa de ajuda ou encontrou algum problema? Nossa equipe está pronta para ajudar.
            </p>
            <button
              type="button"
              className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 text-sm font-semibold py-2 px-4 rounded-lg transition-colors shrink-0"
              onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
            >
              <MessageCircle className="w-4 h-4" />
              Falar com o Suporte
            </button>
          </div>
        </section>

        {/* Section 3: Conta (Logoff) */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Conta</h2>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 text-sm font-semibold py-2 px-4 rounded-lg transition-colors w-fit"
          >
            <LogOut className="w-4 h-4" />
            Sair do aplicativo
          </button>
        </section>
      </div>
    </div>
  );
}
