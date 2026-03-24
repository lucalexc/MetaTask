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
import { AnimatePresence, motion } from 'framer-motion';

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
    <div className="flex h-screen bg-white font-sans text-slate-900 overflow-hidden relative">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 bg-slate-50/50 border-r border-slate-100 flex-col shrink-0">
        <div className="p-4 flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
            <Target className="w-3 h-3 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900">MetaTask</span>
        </div>

        <div className="px-3 mb-4">
          {activeTab !== 'missions' && activeTab !== 'identity' && activeTab !== 'settings' && (
            <button 
              onClick={handleFabClick}
              className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-red-600 hover:bg-slate-100 rounded-md transition-colors w-full"
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
              "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
              activeTab === 'tasks' ? "text-blue-700 bg-blue-50" : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <Inbox className={cn("w-4 h-4", activeTab === 'tasks' ? "text-blue-600" : "text-slate-500")} />
            Tarefas
          </button>
          <button 
            onClick={() => handleTabChange('projects')}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
              activeTab === 'projects' ? "text-blue-700 bg-blue-50" : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <Folder className={cn("w-4 h-4", activeTab === 'projects' ? "text-blue-600" : "text-slate-500")} />
            Projetos
          </button>
          <button 
            onClick={() => handleTabChange('my-routine')}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
              activeTab === 'my-routine' ? "text-blue-700 bg-blue-50" : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <RefreshCcw className={cn("w-4 h-4", activeTab === 'my-routine' ? "text-blue-600" : "text-slate-500")} />
            Minha Rotina
          </button>
          <button 
            onClick={() => handleTabChange('missions')}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
              activeTab === 'missions' ? "text-blue-700 bg-blue-50" : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <Sword className={cn("w-4 h-4", activeTab === 'missions' ? "text-blue-600" : "text-slate-500")} />
            Missões
          </button>
          <button 
            onClick={() => handleTabChange('identity')}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
              activeTab === 'identity' ? "text-blue-700 bg-blue-50" : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <Fingerprint className={cn("w-4 h-4", activeTab === 'identity' ? "text-blue-600" : "text-slate-500")} />
            Identidade
          </button>
          <button 
            onClick={() => handleTabChange('insights')}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
              activeTab === 'insights' ? "text-blue-700 bg-blue-50" : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <BarChart2 className={cn("w-4 h-4", activeTab === 'insights' ? "text-blue-600" : "text-slate-500")} />
            Estatísticas
          </button>
        </nav>

        <div className="p-3 mt-auto border-t border-slate-100">
          <button 
            onClick={() => handleTabChange('settings')}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
              activeTab === 'settings' ? "text-blue-700 bg-blue-50" : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <Settings className={cn("w-4 h-4", activeTab === 'settings' ? "text-blue-600" : "text-slate-500")} />
            Configurações
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <div className={cn("h-full flex flex-col overflow-hidden", activeTab !== 'identity' && "hidden")}>
          <IdentityDashboard />
        </div>
        <div className={cn("h-full flex flex-col overflow-hidden", activeTab !== 'missions' && "hidden")}>
          <MissionsMapDashboard />
        </div>
        <div className={cn("h-full flex flex-col overflow-hidden", activeTab !== 'tasks' && "hidden")}>
          <TasksDashboard isCreateModalOpen={isTaskModalOpen} setIsCreateModalOpen={setIsTaskModalOpen} />
        </div>
        <div className={cn("h-full flex flex-col overflow-hidden", activeTab !== 'projects' && "hidden")}>
          <ProjectsDashboard />
        </div>
        <div className={cn("h-full flex flex-col overflow-hidden", activeTab !== 'my-routine' && "hidden")}>
          <MyRoutinePage isCreateModalOpen={isRoutineModalOpen} setIsCreateModalOpen={setIsRoutineModalOpen} />
        </div>
        <div className={cn("h-full flex flex-col overflow-hidden", activeTab !== 'insights' && "hidden")}>
          <InsightsDashboard />
        </div>
        <div className={cn("h-full flex flex-col overflow-hidden", activeTab !== 'settings' && "hidden")}>
          <SettingsDashboard />
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
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[70] overflow-hidden pb-[env(safe-area-inset-bottom)]"
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
