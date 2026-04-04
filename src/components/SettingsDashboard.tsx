import React from 'react';
import { LogOut, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function SettingsDashboard() {
  const navigate = useNavigate();

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
