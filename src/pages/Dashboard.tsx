import React, { useState, useEffect } from 'react';
import { Target, Plus, Inbox, Sword, RefreshCcw, Map, Fingerprint, Settings, Folder, Menu, X, BarChart2, Compass, Hexagon } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import TasksDashboard from '@/src/components/TasksDashboard';
import ProjectsDashboard from '@/src/components/ProjectsDashboard';
import MyRoutinePage from '@/src/components/MyRoutinePage';
import RoadmapPage from '@/src/pages/RoadmapPage';
import IdentityDashboard from '@/src/components/IdentityDashboard';
import SettingsDashboard from '@/src/components/SettingsDashboard';
import InsightsDashboard from '@/src/components/InsightsDashboard';
import { cn } from '@/src/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

type TabType = 'tasks' | 'projects' | 'my-routine' | 'roadmap' | 'identity' | 'insights' | 'settings';

export default function Dashboard() {
  const { tab, projectId } = useParams<{ tab?: string; projectId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active tab from URL or default to 'tasks'
  const activeTab = (tab as TabType) || (projectId ? 'projects' : 'tasks');
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleFabClick = () => {
    if (activeTab === 'my-routine') setIsRoutineModalOpen(true);
    else if (activeTab === 'projects') setIsProjectModalOpen(true);
    else if (activeTab === 'roadmap') setIsMilestoneModalOpen(true);
    else setIsTaskModalOpen(true); // Default to task
  };

  // Sync state if needed, but mostly we use the URL
  const handleTabChange = (newTab: TabType) => {
    navigate(`/app/${newTab}`);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#FCFAF8] font-sans text-[#202020] overflow-hidden relative">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 bg-[#FCFAF8] border-r border-gray-200 flex-col shrink-0">
        <div className="p-4 flex items-center gap-2">
          <div className="w-6 h-6 bg-[#7C3AED] rounded-md flex items-center justify-center">
            <Hexagon className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-bold text-[16px] tracking-tight text-[#202020]">MetaTask</span>
        </div>

        <div className="px-4 mb-6">
          <div className="flex items-center gap-3 p-2 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-[#202020]">Usuário</span>
              <span className="text-[11px] text-[#808080]">Plano Pro</span>
            </div>
          </div>
        </div>

        <div className="px-3 mb-4">
          {['tasks', 'my-routine', 'projects', 'roadmap'].includes(activeTab) && (
            <button 
              onClick={handleFabClick}
              className="flex items-center gap-2 px-2 py-1.5 text-[13px] font-medium text-red-500 hover:bg-red-50 rounded-md transition-colors ease-out duration-200 w-full text-left"
            >
              <Plus className="w-4 h-4" />
              Adicionar {activeTab === 'tasks' ? 'Tarefa' : activeTab === 'my-routine' ? 'Rotina' : activeTab === 'projects' ? 'Projeto' : 'Marco'}
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          <div className="px-3">
            <div className="text-[10px] font-bold text-[#808080] tracking-wider mb-2 px-2">PRODUTIVIDADE</div>
            <button 
              onClick={() => handleTabChange('tasks')}
              className={cn(
                "w-full flex items-center gap-2 py-1.5 pr-2 text-[13px] font-medium rounded-r-md transition-all ease-out duration-150",
                activeTab === 'tasks' ? "text-[#7C3AED] bg-[#7C3AED]/10 border-l-[3px] border-[#7C3AED] pl-[5px]" : "text-[#202020] hover:bg-[rgba(124,58,237,0.06)] border-l-[3px] border-transparent pl-[5px]"
              )}
            >
              <Inbox className={cn("w-4 h-4", activeTab === 'tasks' ? "text-[#7C3AED]" : "text-[#808080]")} />
              Tarefas
            </button>
            <button 
              onClick={() => handleTabChange('my-routine')}
              className={cn(
                "w-full flex items-center gap-2 py-1.5 pr-2 text-[13px] font-medium rounded-r-md transition-all ease-out duration-150",
                activeTab === 'my-routine' ? "text-[#7C3AED] bg-[#7C3AED]/10 border-l-[3px] border-[#7C3AED] pl-[5px]" : "text-[#202020] hover:bg-[rgba(124,58,237,0.06)] border-l-[3px] border-transparent pl-[5px]"
              )}
            >
              <RefreshCcw className={cn("w-4 h-4", activeTab === 'my-routine' ? "text-[#7C3AED]" : "text-[#808080]")} />
              Rotina
            </button>
            <button 
              onClick={() => handleTabChange('projects')}
              className={cn(
                "w-full flex items-center gap-2 py-1.5 pr-2 text-[13px] font-medium rounded-r-md transition-all ease-out duration-150",
                activeTab === 'projects' ? "text-[#7C3AED] bg-[#7C3AED]/10 border-l-[3px] border-[#7C3AED] pl-[5px]" : "text-[#202020] hover:bg-[rgba(124,58,237,0.06)] border-l-[3px] border-transparent pl-[5px]"
              )}
            >
              <Folder className={cn("w-4 h-4", activeTab === 'projects' ? "text-[#7C3AED]" : "text-[#808080]")} />
              Projetos
            </button>
          </div>

          <div className="px-3">
            <div className="text-[10px] font-bold text-[#808080] tracking-wider mb-2 mt-[20px] pt-3 border-t border-[rgba(0,0,0,0.06)] px-2">CRESCIMENTO PESSOAL</div>
            <button 
              onClick={() => handleTabChange('roadmap')}
              className={cn(
                "w-full flex items-center gap-2 py-1.5 pr-2 text-[13px] font-medium rounded-r-md transition-all ease-out duration-150",
                activeTab === 'roadmap' ? "text-[#7C3AED] bg-[#7C3AED]/10 border-l-[3px] border-[#7C3AED] pl-[5px]" : "text-[#202020] hover:bg-[rgba(124,58,237,0.06)] border-l-[3px] border-transparent pl-[5px]"
              )}
            >
              <Compass className={cn("w-4 h-4", activeTab === 'roadmap' ? "text-[#7C3AED]" : "text-[#808080]")} />
              Visão de Vida
            </button>
            <button 
              onClick={() => handleTabChange('identity')}
              className={cn(
                "w-full flex items-center gap-2 py-1.5 pr-2 text-[13px] font-medium rounded-r-md transition-all ease-out duration-150",
                activeTab === 'identity' ? "text-[#7C3AED] bg-[#7C3AED]/10 border-l-[3px] border-[#7C3AED] pl-[5px]" : "text-[#202020] hover:bg-[rgba(124,58,237,0.06)] border-l-[3px] border-transparent pl-[5px]"
              )}
            >
              <Fingerprint className={cn("w-4 h-4", activeTab === 'identity' ? "text-[#7C3AED]" : "text-[#808080]")} />
              Identidade
            </button>
            <button 
              onClick={() => handleTabChange('insights')}
              className={cn(
                "w-full flex items-center gap-2 py-1.5 pr-2 text-[13px] font-medium rounded-r-md transition-all ease-out duration-150",
                activeTab === 'insights' ? "text-[#7C3AED] bg-[#7C3AED]/10 border-l-[3px] border-[#7C3AED] pl-[5px]" : "text-[#202020] hover:bg-[rgba(124,58,237,0.06)] border-l-[3px] border-transparent pl-[5px]"
              )}
            >
              <BarChart2 className={cn("w-4 h-4", activeTab === 'insights' ? "text-[#7C3AED]" : "text-[#808080]")} />
              Estatísticas
            </button>
          </div>
        </nav>

        <div className="p-3 mt-auto border-t border-gray-200">
          <button 
            onClick={() => handleTabChange('settings')}
            className={cn(
              "w-full flex items-center gap-2 py-1.5 pr-2 text-[13px] font-medium rounded-r-md transition-all ease-out duration-150",
              activeTab === 'settings' ? "text-[#7C3AED] bg-[#7C3AED]/10 border-l-[3px] border-[#7C3AED] pl-[5px]" : "text-[#202020] hover:bg-[rgba(124,58,237,0.06)] border-l-[3px] border-transparent pl-[5px]"
            )}
          >
            <Settings className={cn("w-4 h-4", activeTab === 'settings' ? "text-[#7C3AED]" : "text-[#808080]")} />
            Configurações
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto relative pb-32 md:pb-32">
        <div className={cn("flex flex-col", activeTab !== 'identity' && "hidden")}>
          <IdentityDashboard />
        </div>
        <div className={cn("flex-1 flex flex-col h-full", activeTab !== 'roadmap' && "hidden")}>
          <RoadmapPage isCreateModalOpen={isMilestoneModalOpen} setIsCreateModalOpen={setIsMilestoneModalOpen} />
        </div>
        <div className={cn("flex flex-col", activeTab !== 'tasks' && "hidden")}>
          <TasksDashboard isCreateModalOpen={isTaskModalOpen} setIsCreateModalOpen={setIsTaskModalOpen} />
        </div>
        <div className={cn("flex flex-col", activeTab !== 'projects' && "hidden")}>
          <ProjectsDashboard projectId={projectId} isCreateModalOpen={isProjectModalOpen} setIsCreateModalOpen={setIsProjectModalOpen} />
        </div>
        <div className={cn("flex flex-col", activeTab !== 'my-routine' && "hidden")}>
          <MyRoutinePage isCreateModalOpen={isRoutineModalOpen} setIsCreateModalOpen={setIsRoutineModalOpen} />
        </div>
        <div className={cn("flex flex-col", activeTab !== 'insights' && "hidden")}>
          <InsightsDashboard />
        </div>
        <div className={cn("flex flex-col", activeTab !== 'settings' && "hidden")}>
          <SettingsDashboard />
        </div>
      </main>

      {/* Global FAB (Mobile Only) */}
      {['tasks', 'my-routine', 'projects', 'roadmap'].includes(activeTab) && (
        <button
          onClick={handleFabClick}
          className="md:hidden fixed right-4 bottom-24 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#7C3AED] text-white shadow-lg hover:bg-[#6D28D9] transition-transform active:scale-95"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] z-40 h-[calc(4rem+env(safe-area-inset-bottom))]">
        <button onClick={() => handleTabChange('tasks')} className={cn("flex flex-col items-center justify-center w-16 h-16 transition-colors ease-out duration-200", activeTab === 'tasks' ? "text-[#7C3AED]" : "text-[#808080]")}>
          <Inbox className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Tarefas</span>
        </button>
        <button onClick={() => handleTabChange('my-routine')} className={cn("flex flex-col items-center justify-center w-16 h-16 transition-colors ease-out duration-200", activeTab === 'my-routine' ? "text-[#7C3AED]" : "text-[#808080]")}>
          <RefreshCcw className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Rotina</span>
        </button>
        <button onClick={() => handleTabChange('projects')} className={cn("flex flex-col items-center justify-center w-16 h-16 transition-colors ease-out duration-200", activeTab === 'projects' ? "text-[#7C3AED]" : "text-[#808080]")}>
          <Folder className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Projetos</span>
        </button>
        <button onClick={() => setIsMobileMenuOpen(true)} className={cn("flex flex-col items-center justify-center w-16 h-16 transition-colors ease-out duration-200", ['roadmap', 'identity', 'insights', 'settings'].includes(activeTab) ? "text-[#7C3AED]" : "text-[#808080]")}>
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
              className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[70] overflow-hidden pb-[env(safe-area-inset-bottom)]"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-[#202020]">Mais Opções</h3>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-[#808080] hover:bg-gray-100 rounded-full transition-colors ease-out duration-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-2 space-y-1">
                <button 
                  onClick={() => handleTabChange('roadmap')}
                  className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-colors ease-out duration-200", activeTab === 'roadmap' ? "bg-[#7C3AED]/10 text-[#7C3AED]" : "text-[#202020] hover:bg-gray-50")}
                >
                  <Compass className={cn("w-5 h-5", activeTab === 'roadmap' ? "text-[#7C3AED]" : "text-[#808080]")} />
                  <span className="font-medium">Visão de Vida</span>
                </button>
                <button 
                  onClick={() => handleTabChange('identity')}
                  className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-colors ease-out duration-200", activeTab === 'identity' ? "bg-[#7C3AED]/10 text-[#7C3AED]" : "text-[#202020] hover:bg-gray-50")}
                >
                  <Fingerprint className={cn("w-5 h-5", activeTab === 'identity' ? "text-[#7C3AED]" : "text-[#808080]")} />
                  <span className="font-medium">Identidade</span>
                </button>
                <button 
                  onClick={() => handleTabChange('insights')}
                  className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-colors ease-out duration-200", activeTab === 'insights' ? "bg-[#7C3AED]/10 text-[#7C3AED]" : "text-[#202020] hover:bg-gray-50")}
                >
                  <BarChart2 className={cn("w-5 h-5", activeTab === 'insights' ? "text-[#7C3AED]" : "text-[#808080]")} />
                  <span className="font-medium">Estatísticas</span>
                </button>
                <div className="h-px bg-gray-100 my-2 mx-3" />
                <button 
                  onClick={() => handleTabChange('settings')}
                  className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-colors ease-out duration-200", activeTab === 'settings' ? "bg-[#7C3AED]/10 text-[#7C3AED]" : "text-[#202020] hover:bg-gray-50")}
                >
                  <Settings className={cn("w-5 h-5", activeTab === 'settings' ? "text-[#7C3AED]" : "text-[#808080]")} />
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
