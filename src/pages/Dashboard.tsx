import React, { useState } from 'react';
import { Target, Plus, Inbox, Sword, RefreshCcw, Map, Fingerprint, Settings, Folder, Menu, X, BarChart2 } from 'lucide-react';
import TasksDashboard from '@/src/components/TasksDashboard';
import ProjectsDashboard from '@/src/components/ProjectsDashboard';
import MyRoutinePage from '@/src/components/MyRoutinePage';
import MissionsMapDashboard from '@/src/components/MissionsMapDashboard';
import IdentityDashboard from '@/src/components/IdentityDashboard';
import SettingsDashboard from '@/src/components/SettingsDashboard';
import InsightsDashboard from '@/src/components/InsightsDashboard';
import { cn } from '@/src/lib/utils';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'projects' | 'my-routine' | 'missions' | 'identity' | 'insights' | 'settings'>('tasks');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleFabClick = () => {
    if (activeTab === 'my-routine') setIsRoutineModalOpen(true);
    else setIsTaskModalOpen(true); // Default to task
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-white font-sans text-gray-900 overflow-hidden relative">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 bg-gray-50 border-r border-gray-200 flex-col shrink-0">
        <div className="p-4 flex items-center gap-2">
          <span className="font-bold text-base tracking-tight text-gray-900">MetaTask</span>
        </div>

        <div className="px-3 mb-4">
          {activeTab !== 'missions' && activeTab !== 'identity' && activeTab !== 'settings' && (
            <button 
              onClick={handleFabClick}
              className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold text-red-500 hover:bg-gray-100 rounded-md transition-colors w-full"
            >
              <Plus className="w-4 h-4" />
              Adicionar {activeTab === 'tasks' ? 'tarefa' : 'atividade'}
            </button>
          )}
        </div>

        <nav className="px-3 flex-1 space-y-1">
          <button 
            onClick={() => handleTabChange('tasks')}
            className={cn(
              "w-full flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors",
              activeTab === 'tasks' ? "font-semibold text-red-500 bg-red-50" : "font-medium text-gray-500 hover:bg-gray-100"
            )}
          >
            <Inbox className="w-4 h-4" />
            Tarefas
          </button>
          <button 
            onClick={() => handleTabChange('projects')}
            className={cn(
              "w-full flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors",
              activeTab === 'projects' ? "font-semibold text-red-500 bg-red-50" : "font-medium text-gray-500 hover:bg-gray-100"
            )}
          >
            <Folder className="w-4 h-4" />
            Projetos
          </button>
          <button 
            onClick={() => handleTabChange('my-routine')}
            className={cn(
              "w-full flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors",
              activeTab === 'my-routine' ? "font-semibold text-red-500 bg-red-50" : "font-medium text-gray-500 hover:bg-gray-100"
            )}
          >
            <RefreshCcw className="w-4 h-4" />
            Minha Rotina
          </button>
          <button 
            onClick={() => handleTabChange('missions')}
            className={cn(
              "w-full flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors",
              activeTab === 'missions' ? "font-semibold text-red-500 bg-red-50" : "font-medium text-gray-500 hover:bg-gray-100"
            )}
          >
            <Sword className="w-4 h-4" />
            Missões
          </button>
          <button 
            onClick={() => handleTabChange('identity')}
            className={cn(
              "w-full flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors",
              activeTab === 'identity' ? "font-semibold text-red-500 bg-red-50" : "font-medium text-gray-500 hover:bg-gray-100"
            )}
          >
            <Fingerprint className="w-4 h-4" />
            Identidade
          </button>
          <button 
            onClick={() => handleTabChange('insights')}
            className={cn(
              "w-full flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors",
              activeTab === 'insights' ? "font-semibold text-red-500 bg-red-50" : "font-medium text-gray-500 hover:bg-gray-100"
            )}
          >
            <BarChart2 className="w-4 h-4" />
            Estatísticas
          </button>
        </nav>

        <div className="p-3 mt-auto border-t border-gray-200">
          <button 
            onClick={() => handleTabChange('settings')}
            className={cn(
              "w-full flex items-center gap-2 px-4 py-1.5 text-sm transition-colors",
              activeTab === 'settings' ? "font-semibold text-gray-600" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Settings className="w-4 h-4" />
            Configurações
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-white pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <div className={cn("h-full flex flex-col overflow-y-auto px-10 py-8", activeTab !== 'identity' && "hidden")}>
          <div className="max-w-3xl mx-auto w-full">
            <IdentityDashboard />
          </div>
        </div>
        <div className={cn("h-full flex flex-col overflow-y-auto px-10 py-8", activeTab !== 'missions' && "hidden")}>
          <div className="max-w-3xl mx-auto w-full">
            <MissionsMapDashboard />
          </div>
        </div>
        <div className={cn("h-full flex flex-col overflow-y-auto px-10 py-8", activeTab !== 'tasks' && "hidden")}>
          <div className="max-w-3xl mx-auto w-full">
            <TasksDashboard isCreateModalOpen={isTaskModalOpen} setIsCreateModalOpen={setIsTaskModalOpen} />
          </div>
        </div>
        <div className={cn("h-full flex flex-col overflow-y-auto px-10 py-8", activeTab !== 'projects' && "hidden")}>
          <div className="max-w-3xl mx-auto w-full">
            <ProjectsDashboard />
          </div>
        </div>
        <div className={cn("h-full flex flex-col overflow-y-auto px-10 py-8", activeTab !== 'my-routine' && "hidden")}>
          <div className="max-w-3xl mx-auto w-full">
            <MyRoutinePage isCreateModalOpen={isRoutineModalOpen} setIsCreateModalOpen={setIsRoutineModalOpen} />
          </div>
        </div>
        <div className={cn("h-full flex flex-col overflow-y-auto px-10 py-8", activeTab !== 'insights' && "hidden")}>
          <div className="max-w-3xl mx-auto w-full">
            <InsightsDashboard />
          </div>
        </div>
        <div className={cn("h-full flex flex-col overflow-y-auto px-10 py-8", activeTab !== 'settings' && "hidden")}>
          <div className="max-w-3xl mx-auto w-full">
            <SettingsDashboard />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-between px-2 pb-[env(safe-area-inset-bottom)] z-50 h-[calc(4rem+env(safe-area-inset-bottom))]">
        <button onClick={() => handleTabChange('tasks')} className={cn("flex flex-col items-center justify-center w-16 h-16", activeTab === 'tasks' ? "text-blue-600" : "text-slate-500")}>
          <Inbox className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Tarefas</span>
        </button>
        <button onClick={() => handleTabChange('projects')} className={cn("flex flex-col items-center justify-center w-16 h-16", activeTab === 'projects' ? "text-blue-600" : "text-slate-500")}>
          <Folder className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Projetos</span>
        </button>
        
        {/* Centered FAB */}
        <div className="relative -top-5 flex justify-center w-16 h-16">
          <button 
            onClick={handleFabClick}
            className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        <button onClick={() => handleTabChange('my-routine')} className={cn("flex flex-col items-center justify-center w-16 h-16", activeTab === 'my-routine' ? "text-blue-600" : "text-slate-500")}>
          <RefreshCcw className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Rotina</span>
        </button>
        <button onClick={() => setIsMobileMenuOpen(true)} className={cn("flex flex-col items-center justify-center w-16 h-16", ['missions', 'identity', 'insights', 'settings'].includes(activeTab) ? "text-blue-600" : "text-slate-500")}>
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Mais</span>
        </button>
      </nav>

      {/* Mobile More Menu Modal */}
      {isMobileMenuOpen && (
        <>
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
          />
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[70] overflow-hidden pb-[env(safe-area-inset-bottom)] animate-in slide-in-from-bottom duration-300"
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Mais Opções</h3>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 space-y-1">
              <button 
                onClick={() => handleTabChange('missions')}
                className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-colors", activeTab === 'missions' ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50")}
              >
                <Sword className={cn("w-5 h-5", activeTab === 'missions' ? "text-blue-600" : "text-slate-400")} />
                <span className="font-medium">Missões</span>
              </button>
              <button 
                onClick={() => handleTabChange('identity')}
                className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-colors", activeTab === 'identity' ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50")}
              >
                <Fingerprint className={cn("w-5 h-5", activeTab === 'identity' ? "text-blue-600" : "text-slate-400")} />
                <span className="font-medium">Identidade</span>
              </button>
              <button 
                onClick={() => handleTabChange('insights')}
                className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-colors", activeTab === 'insights' ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50")}
              >
                <BarChart2 className={cn("w-5 h-5", activeTab === 'insights' ? "text-blue-600" : "text-slate-400")} />
                <span className="font-medium">Estatísticas</span>
              </button>
              <div className="h-px bg-slate-100 my-2 mx-3" />
              <button 
                onClick={() => handleTabChange('settings')}
                className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-colors", activeTab === 'settings' ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50")}
              >
                <Settings className={cn("w-5 h-5", activeTab === 'settings' ? "text-blue-600" : "text-slate-400")} />
                <span className="font-medium">Configurações</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
