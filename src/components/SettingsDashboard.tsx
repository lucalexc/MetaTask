import React from 'react';
import { LogOut } from 'lucide-react';
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
            <a
              href="https://api.whatsapp.com/send?phone=5562993285980&text=Ol%C3%A1!%20Preciso%20de%20ajuda%20com%20o%20MetaTask."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 text-sm font-semibold py-2 px-4 rounded-lg transition-colors shrink-0"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                className="text-emerald-600"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              Falar com o Suporte
            </a>
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
