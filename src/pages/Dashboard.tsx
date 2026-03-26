import React, { useState, useEffect } from 'react';
import { Target, Plus, Inbox, Sword, RefreshCcw, Map, Fingerprint, Settings, Folder, Menu, X, BarChart2 } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import TasksDashboard from '@/src/components/TasksDashboard';
import ProjectsDashboard from '@/src/components/ProjectsDashboard';
import MyRoutinePage from '@/src/components/MyRoutinePage';
import MissionsMapDashboard from '@/src/components/MissionsMapDashboard';
import IdentityDashboard from '@/src/components/IdentityDashboard';
import SettingsDashboard from '@/src/components/SettingsDashboard';
import InsightsDashboard from '@/src/components/InsightsDashboard';
import { cn } from '@/src/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

type TabType = 'tasks' | 'projects' | 'my-routine' | 'missions' | 'identity' | 'insights' | 'settings';

export default function Dashboard() {
  const { tab, projectId } = useParams<{ tab?: string; projectId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active tab from URL or default to 'tasks'
  const activeTab = (tab as TabType) || (projectId ? 'projects' : 'tasks');
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleFabClick = () => {
    if (activeTab === 'my-routine') setIsRoutineModalOpen(true);
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
          <span className="font-bold text-[14px] tracking-tight text-[#202020]">MetaTask</span>
        </div>

        <div className="px-3 mb-4">
          {(activeTab === 'tasks' || activeTab === 'my-routine') && (
            <button 
              onClick={handleFabClick}
              className="flex items-center gap-2 px-2 py-1.5 text-[13px] font-medium text-[#d1453b] hover:bg-gray-100 rounded-md transition-colors ease-out duration-200 w-full"
            >
              <Plus className="w-4 h-4" />
              Adicionar {activeTab === 'tasks' ? 'Tarefa' : 'Rotina'}
            </button>
          )}
        </div>

        <nav className="px-3 flex-1 space-y-1">
          <button 
            onClick={() => handleTabChange('tasks')}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-[13px] font-medium rounded-md transition-colors ease-out duration-200",
              activeTab === 'tasks' ? "text-[#1f60c2] bg-[#dceaff]" : "text-[#202020] hover:bg-gray-100"
            )}
          >
            <Inbox className={cn("w-4 h-4", activeTab === 'tasks' ? "text-[#1f60c2]" : "text-[#808080]")} />
            Tarefas
          </button>
          <button 
            onClick={() => handleTabChange('projects')}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-[13px] font-medium rounded-md transition-colors ease-out duration-200",
              activeTab === 'projects' ? "text-[#1f60c2] bg-[#dceaff]" : "text-[#202020] hover:bg-gray-100"
            )}
          >
            <Folder className={cn("w-4 h-4", activeTab === 'projects' ? "text-[#1f60c2]" : "text-[#808080]")} />
            Projetos
          </button>
          <button 
            onClick={() => handleTabChange('my-routine')}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-[13px] font-medium rounded-md transition-colors ease-out duration-200",
              activeTab === 'my-routine' ? "text-[#1f60c2] bg-[#dceaff]" : "text-[#202020] hover:bg-gray-100"
            )}
          >
            <RefreshCcw className={cn("w-4 h-4", activeTab === 'my-routine' ? "text-[#1f60c2]" : "text-[#808080]")} />
            Minha Rotina
          </button>
          <button 
            onClick={() => handleTabChange('missions')}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-[13px] font-medium rounded-md transition-colors ease-out duration-200",
              activeTab === 'missions' ? "text-[#1f60c2] bg-[#dceaff]" : "text-[#202020] hover:bg-gray-100"
            )}
          >
            <Sword className={cn("w-4 h-4", activeTab === 'missions' ? "text-[#1f60c2]" : "text-[#808080]")} />
            Missões
          </button>
          <button 
            onClick={() => handleTabChange('identity')}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-[13px] font-medium rounded-md transition-colors ease-out duration-200",
              activeTab === 'identity' ? "text-[#1f60c2] bg-[#dceaff]" : "text-[#202020] hover:bg-gray-100"
            )}
          >
            <Fingerprint className={cn("w-4 h-4", activeTab === 'identity' ? "text-[#1f60c2]" : "text-[#808080]")} />
            Identidade
          </button>
          <button 
            onClick={() => handleTabChange('insights')}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-[13px] font-medium rounded-md transition-colors ease-out duration-200",
              activeTab === 'insights' ? "text-[#1f60c2] bg-[#dceaff]" : "text-[#202020] hover:bg-gray-100"
            )}
          >
            <BarChart2 className={cn("w-4 h-4", activeTab === 'insights' ? "text-[#1f60c2]" : "text-[#808080]")} />
            Estatísticas
          </button>
        </nav>

        <div className="p-3 mt-auto border-t border-gray-200">
          <button 
            onClick={() => handleTabChange('settings')}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-[13px] font-medium rounded-md transition-colors ease-out duration-200",
              activeTab === 'settings' ? "text-[#1f60c2] bg-[#dceaff]" : "text-[#202020] hover:bg-gray-100"
            )}
          >
            <Settings className={cn("w-4 h-4", activeTab === 'settings' ? "text-[#1f60c2]" : "text-[#808080]")} />
            Configurações
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto relative pb-32 md:pb-32">
        <div className={cn("flex flex-col", activeTab !== 'identity' && "hidden")}>
          <IdentityDashboard />
        </div>
        <div className={cn("flex flex-col", activeTab !== 'missions' && "hidden")}>
          <MissionsMapDashboard />
        </div>
        <div className={cn("flex flex-col", activeTab !== 'tasks' && "hidden")}>
          <TasksDashboard isCreateModalOpen={isTaskModalOpen} setIsCreateModalOpen={setIsTaskModalOpen} />
        </div>
        <div className={cn("flex flex-col", activeTab !== 'projects' && "hidden")}>
          <ProjectsDashboard projectId={projectId} />
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

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-between px-2 pb-[env(safe-area-inset-bottom)] z-50 h-[calc(4rem+env(safe-area-inset-bottom))]">
        <button onClick={() => handleTabChange('tasks')} className={cn("flex flex-col items-center justify-center w-16 h-16 transition-colors ease-out duration-200", activeTab === 'tasks' ? "text-[#1f60c2]" : "text-[#808080]")}>
          <Inbox className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Tarefas</span>
        </button>
        <button onClick={() => handleTabChange('projects')} className={cn("flex flex-col items-center justify-center w-16 h-16 transition-colors ease-out duration-200", activeTab === 'projects' ? "text-[#1f60c2]" : "text-[#808080]")}>
          <Folder className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Projetos</span>
        </button>
        
        {/* Centered FAB */}
        <div className="relative -top-5 flex justify-center w-16 h-16">
          <button 
            onClick={handleFabClick}
            className="w-12 h-12 bg-[#1f60c2] rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors ease-out duration-200"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        <button onClick={() => handleTabChange('my-routine')} className={cn("flex flex-col items-center justify-center w-16 h-16 transition-colors ease-out duration-200", activeTab === 'my-routine' ? "text-[#1f60c2]" : "text-[#808080]")}>
          <RefreshCcw className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Rotina</span>
        </button>
        <button onClick={() => setIsMobileMenuOpen(true)} className={cn("flex flex-col items-center justify-center w-16 h-16 transition-colors ease-out duration-200", ['missions', 'identity', 'insights', 'settings'].includes(activeTab) ? "text-[#1f60c2]" : "text-[#808080]")}>
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
                  onClick={() => handleTabChange('missions')}
                  className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-colors ease-out duration-200", activeTab === 'missions' ? "bg-[#dceaff] text-[#1f60c2]" : "text-[#202020] hover:bg-gray-50")}
                >
                  <Sword className={cn("w-5 h-5", activeTab === 'missions' ? "text-[#1f60c2]" : "text-[#808080]")} />
                  <span className="font-medium">Missões</span>
                </button>
                <button 
                  onClick={() => handleTabChange('identity')}
                  className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-colors ease-out duration-200", activeTab === 'identity' ? "bg-[#dceaff] text-[#1f60c2]" : "text-[#202020] hover:bg-gray-50")}
                >
                  <Fingerprint className={cn("w-5 h-5", activeTab === 'identity' ? "text-[#1f60c2]" : "text-[#808080]")} />
                  <span className="font-medium">Identidade</span>
                </button>
                <button 
                  onClick={() => handleTabChange('insights')}
                  className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-colors ease-out duration-200", activeTab === 'insights' ? "bg-[#dceaff] text-[#1f60c2]" : "text-[#202020] hover:bg-gray-50")}
                >
                  <BarChart2 className={cn("w-5 h-5", activeTab === 'insights' ? "text-[#1f60c2]" : "text-[#808080]")} />
                  <span className="font-medium">Estatísticas</span>
                </button>
                <div className="h-px bg-gray-100 my-2 mx-3" />
                <button 
                  onClick={() => handleTabChange('settings')}
                  className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-colors ease-out duration-200", activeTab === 'settings' ? "bg-[#dceaff] text-[#1f60c2]" : "text-[#202020] hover:bg-gray-50")}
                >
                  <Settings className={cn("w-5 h-5", activeTab === 'settings' ? "text-[#1f60c2]" : "text-[#808080]")} />
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
