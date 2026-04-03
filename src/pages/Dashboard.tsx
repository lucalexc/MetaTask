import React, { useState, useEffect } from 'react';
import { Target, Plus, Inbox, Sword, RefreshCcw, Map, Fingerprint, Settings, Folder, Menu, X, BarChart2, Compass, CheckSquare, Calendar, Trophy, MapPin, Brain, LogOut, MessageCircle } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import TasksDashboard from '@/src/components/TasksDashboard';
import ProjectsDashboard from '@/src/components/ProjectsDashboard';
import MyRoutinePage from '@/src/components/MyRoutinePage';
import RoadmapPage from '@/src/pages/RoadmapPage';
import IdentityDashboard from '@/src/components/IdentityDashboard';
import SettingsDashboard from '@/src/components/SettingsDashboard';
import InsightsDashboard from '@/src/components/InsightsDashboard';
import GoalsDashboard from '@/src/components/GoalsDashboard';
import MissionsMapDashboard from '@/src/components/MissionsMapDashboard';
import { cn } from '@/src/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/src/lib/AuthContext';
import { supabase } from '@/src/lib/supabase';

type TabType = 'tasks' | 'projects' | 'my-routine' | 'roadmap' | 'identity' | 'insights' | 'settings' | 'goals' | 'missions';

export default function Dashboard() {
  const { tab, projectId } = useParams<{ tab?: string; projectId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Determine active tab from URL or default to 'tasks'
  const activeTab = (tab as TabType) || (projectId ? 'projects' : 'tasks');
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleFabClick = () => {
    if (activeTab === 'my-routine') setIsRoutineModalOpen(true);
    else if (activeTab === 'projects') setIsProjectModalOpen(true);
    else if (activeTab === 'roadmap') setIsMilestoneModalOpen(true);
    else if (activeTab === 'goals') setIsGoalModalOpen(true);
    else setIsTaskModalOpen(true); // Default to task
  };

  const handleTabChange = (newTab: TabType) => {
    navigate(`/app/${newTab}`);
    setIsMobileMenuOpen(false);
  };

  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'MT';

  const getModuleConfig = (tab: TabType) => {
    switch (tab) {
      case 'tasks': return { title: 'Tarefas', subtitle: 'Gerencie suas ações diárias', addLabel: 'Nova Tarefa' };
      case 'my-routine': return { title: 'Rotina', subtitle: 'Seus hábitos e XP diário', addLabel: 'Nova Atividade' };
      case 'projects': return { title: 'Projetos', subtitle: 'Organize suas grandes entregas', addLabel: 'Novo Projeto' };
      case 'goals': return { title: 'Metas', subtitle: 'Acompanhe seus objetivos', addLabel: 'Nova Meta' };
      case 'roadmap': return { title: 'Visão de Vida', subtitle: 'Seu mapa do tesouro pessoal', addLabel: 'Novo Marco' };
      case 'identity': return { title: 'Identidade', subtitle: 'Conheça o jogador', addLabel: 'Nova Reflexão' };
      case 'missions': return { title: 'Mapa de Missões', subtitle: 'Desbloqueie novos desafios', addLabel: 'Nova Missão' };
      case 'insights': return { title: 'Estatísticas', subtitle: 'Seus resultados não mentem', addLabel: 'Exportar' };
      case 'settings': return { title: 'Configurações', subtitle: 'Ajuste seu sistema', addLabel: 'Salvar' };
      default: return { title: 'MetaTask', subtitle: '', addLabel: 'Adicionar' };
    }
  };

  const currentModule = getModuleConfig(activeTab);

  const navItems = [
    { id: 'tasks', label: 'Tarefas', Icon: CheckSquare },
    { id: 'my-routine', label: 'Rotina', Icon: Calendar },
    { id: 'projects', label: 'Projetos', Icon: Folder },
    { id: 'identity', label: 'Identidade', Icon: Fingerprint },
    { id: 'missions', label: 'Missões', Icon: Trophy },
  ];

  return (
    <div className="flex h-screen bg-bg-base font-sans text-text-primary overflow-hidden relative">
      {/* Sidebar (Desktop) */}
      <aside className="
        w-64 min-h-screen bg-bg-sidebar border-r border-border
        flex-col py-6 px-4 gap-1 shrink-0
        hidden md:flex
      ">
        <div className="px-3 mb-6 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
            <Target size={20} />
          </div>
          <span className="font-bold text-lg text-text-primary tracking-tight">MetaTask</span>
        </div>

        <div className="
          mx-1 mb-4 p-3 rounded-xl bg-white border border-border
          flex items-center gap-3 cursor-pointer
          hover:border-primary/30 transition-colors
        ">
          <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold">
            {userInitials}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-text-primary truncate">{user?.user_metadata?.full_name || 'Usuário'}</p>
            <p className="text-xs text-text-muted truncate">{user?.email}</p>
          </div>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 -mx-2 px-2">
          <div className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-widest text-text-muted">
            Produtividade
          </div>
          <button 
            onClick={() => handleTabChange('tasks')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer mb-1",
              activeTab === 'tasks' ? "bg-white text-primary text-sm font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border" : "text-text-secondary text-sm font-medium hover:bg-white hover:text-text-primary hover:shadow-sm"
            )}
          >
            <CheckSquare size={18} />
            Tarefas
          </button>
          <button 
            onClick={() => handleTabChange('my-routine')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer mb-1",
              activeTab === 'my-routine' ? "bg-white text-primary text-sm font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border" : "text-text-secondary text-sm font-medium hover:bg-white hover:text-text-primary hover:shadow-sm"
            )}
          >
            <Calendar size={18} />
            Rotina
          </button>
          <button 
            onClick={() => handleTabChange('projects')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer mb-1",
              activeTab === 'projects' ? "bg-white text-primary text-sm font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border" : "text-text-secondary text-sm font-medium hover:bg-white hover:text-text-primary hover:shadow-sm"
            )}
          >
            <Folder size={18} />
            Projetos
          </button>
          <button 
            onClick={() => handleTabChange('goals')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer mb-1",
              activeTab === 'goals' ? "bg-white text-primary text-sm font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border" : "text-text-secondary text-sm font-medium hover:bg-white hover:text-text-primary hover:shadow-sm"
            )}
          >
            <Target size={18} />
            Metas
          </button>

          <div className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-widest text-text-muted">
            Crescimento Pessoal
          </div>
          <button 
            onClick={() => handleTabChange('roadmap')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer mb-1",
              activeTab === 'roadmap' ? "bg-white text-primary text-sm font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border" : "text-text-secondary text-sm font-medium hover:bg-white hover:text-text-primary hover:shadow-sm"
            )}
          >
            <Map size={18} />
            Visão de Vida
          </button>
          <button 
            onClick={() => handleTabChange('identity')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer mb-1",
              activeTab === 'identity' ? "bg-white text-primary text-sm font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border" : "text-text-secondary text-sm font-medium hover:bg-white hover:text-text-primary hover:shadow-sm"
            )}
          >
            <Fingerprint size={18} />
            Identidade
          </button>
          <button 
            onClick={() => handleTabChange('missions')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer mb-1",
              activeTab === 'missions' ? "bg-white text-primary text-sm font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border" : "text-text-secondary text-sm font-medium hover:bg-white hover:text-text-primary hover:shadow-sm"
            )}
          >
            <Trophy size={18} />
            Mapa de Missões
          </button>

          <div className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-widest text-text-muted">
            Análise
          </div>
          <button 
            onClick={() => handleTabChange('insights')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer mb-1",
              activeTab === 'insights' ? "bg-white text-primary text-sm font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border" : "text-text-secondary text-sm font-medium hover:bg-white hover:text-text-primary hover:shadow-sm"
            )}
          >
            <BarChart2 size={18} />
            Estatísticas
          </button>
        </div>

        <div className="mt-auto pt-4 border-t border-border">
          <button 
            onClick={() => handleTabChange('settings')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer",
              activeTab === 'settings' ? "bg-white text-primary text-sm font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border" : "text-text-secondary text-sm font-medium hover:bg-white hover:text-text-primary hover:shadow-sm"
            )}
          >
            <Settings size={18} />
            Configurações
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative pb-20 md:pb-0 bg-bg-base">
        
        {/* Topbar / Header */}
        <header className="
          sticky top-0 z-40
          bg-bg-base/90 backdrop-blur-sm
          border-b border-border
          px-4 md:px-6 py-3
          flex items-center justify-between
        ">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 rounded-lg hover:bg-bg-surface-alt">
              <Menu size={20} className="text-text-secondary" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-text-primary leading-tight">
                {currentModule.title}
              </h1>
              <p className="text-xs text-text-muted hidden sm:block">
                {currentModule.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {['tasks', 'my-routine', 'projects', 'goals', 'roadmap'].includes(activeTab) && (
              <button onClick={handleFabClick} className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5">
                <Plus size={16} />
                <span className="hidden sm:inline">{currentModule.addLabel}</span>
              </button>
            )}
            <button className="
              w-8 h-8 rounded-full bg-primary-light
              flex items-center justify-center
              text-primary text-xs font-bold
              border border-primary/20
              hover:ring-2 ring-primary/30 transition-all
              md:hidden
            ">
              {userInitials}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full flex flex-col"
            >
              <div className={cn("flex flex-col h-full", activeTab !== 'identity' && "hidden")}>
                <IdentityDashboard />
              </div>
              <div className={cn("flex-1 flex flex-col h-full", activeTab !== 'roadmap' && "hidden")}>
                <RoadmapPage isCreateModalOpen={isMilestoneModalOpen} setIsCreateModalOpen={setIsMilestoneModalOpen} />
              </div>
              <div className={cn("flex flex-col h-full", activeTab !== 'tasks' && "hidden")}>
                <TasksDashboard isCreateModalOpen={isTaskModalOpen} setIsCreateModalOpen={setIsTaskModalOpen} />
              </div>
              <div className={cn("flex flex-col h-full", activeTab !== 'projects' && "hidden")}>
                <ProjectsDashboard projectId={projectId} isCreateModalOpen={isProjectModalOpen} setIsCreateModalOpen={setIsProjectModalOpen} />
              </div>
              <div className={cn("flex flex-col h-full", activeTab !== 'my-routine' && "hidden")}>
                <MyRoutinePage isCreateModalOpen={isRoutineModalOpen} setIsCreateModalOpen={setIsRoutineModalOpen} />
              </div>
              <div className={cn("flex flex-col h-full", activeTab !== 'goals' && "hidden")}>
                <GoalsDashboard isCreateModalOpen={isGoalModalOpen} setIsCreateModalOpen={setIsGoalModalOpen} />
              </div>
              <div className={cn("flex flex-col h-full", activeTab !== 'missions' && "hidden")}>
                <MissionsMapDashboard />
              </div>
              <div className={cn("flex flex-col h-full", activeTab !== 'insights' && "hidden")}>
                <InsightsDashboard />
              </div>
              <div className={cn("flex flex-col h-full", activeTab !== 'settings' && "hidden")}>
                <SettingsDashboard />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="
        fixed bottom-0 left-0 right-0 z-50
        bg-white/95 backdrop-blur-md
        border-t border-border
        flex items-center justify-around
        px-2 py-2 pb-[env(safe-area-inset-bottom)]
        md:hidden
      ">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button 
              key={item.id} 
              onClick={() => handleTabChange(item.id as TabType)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors duration-150",
                isActive ? "text-primary bg-primary-light" : "text-text-muted hover:text-text-secondary"
              )}
            >
              <item.Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
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
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed top-0 bottom-0 left-0 w-64 bg-bg-sidebar z-[70] overflow-y-auto flex flex-col py-6 px-4"
            >
              <div className="flex justify-between items-center mb-6 px-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                    <Target size={20} />
                  </div>
                  <span className="font-bold text-lg text-text-primary tracking-tight">MetaTask</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-text-secondary hover:bg-bg-surface-alt rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="
                mx-1 mb-4 p-3 rounded-xl bg-white border border-border
                flex items-center gap-3
              ">
                <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold">
                  {userInitials}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-text-primary truncate">{user?.user_metadata?.full_name || 'Usuário'}</p>
                  <p className="text-xs text-text-muted truncate">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-1 flex-1">
                <div className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-widest text-text-muted">
                  Produtividade
                </div>
                <button onClick={() => handleTabChange('tasks')} className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-colors", activeTab === 'tasks' ? "bg-white text-primary shadow-sm border border-border" : "text-text-secondary hover:bg-white")}>
                  <CheckSquare size={18} /> <span className="font-medium text-sm">Tarefas</span>
                </button>
                <button onClick={() => handleTabChange('my-routine')} className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-colors", activeTab === 'my-routine' ? "bg-white text-primary shadow-sm border border-border" : "text-text-secondary hover:bg-white")}>
                  <Calendar size={18} /> <span className="font-medium text-sm">Rotina</span>
                </button>
                <button onClick={() => handleTabChange('projects')} className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-colors", activeTab === 'projects' ? "bg-white text-primary shadow-sm border border-border" : "text-text-secondary hover:bg-white")}>
                  <Folder size={18} /> <span className="font-medium text-sm">Projetos</span>
                </button>
                <button onClick={() => handleTabChange('goals')} className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-colors", activeTab === 'goals' ? "bg-white text-primary shadow-sm border border-border" : "text-text-secondary hover:bg-white")}>
                  <Target size={18} /> <span className="font-medium text-sm">Metas</span>
                </button>

                <div className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-widest text-text-muted">
                  Crescimento Pessoal
                </div>
                <button onClick={() => handleTabChange('roadmap')} className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-colors", activeTab === 'roadmap' ? "bg-white text-primary shadow-sm border border-border" : "text-text-secondary hover:bg-white")}>
                  <Map size={18} /> <span className="font-medium text-sm">Visão de Vida</span>
                </button>
                <button onClick={() => handleTabChange('identity')} className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-colors", activeTab === 'identity' ? "bg-white text-primary shadow-sm border border-border" : "text-text-secondary hover:bg-white")}>
                  <Fingerprint size={18} /> <span className="font-medium text-sm">Identidade</span>
                </button>
                <button onClick={() => handleTabChange('missions')} className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-colors", activeTab === 'missions' ? "bg-white text-primary shadow-sm border border-border" : "text-text-secondary hover:bg-white")}>
                  <Trophy size={18} /> <span className="font-medium text-sm">Mapa de Missões</span>
                </button>

                <div className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-widest text-text-muted">
                  Análise
                </div>
                <button onClick={() => handleTabChange('insights')} className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-colors", activeTab === 'insights' ? "bg-white text-primary shadow-sm border border-border" : "text-text-secondary hover:bg-white")}>
                  <BarChart2 size={18} /> <span className="font-medium text-sm">Estatísticas</span>
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <button onClick={() => handleTabChange('settings')} className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-colors", activeTab === 'settings' ? "bg-white text-primary shadow-sm border border-border" : "text-text-secondary hover:bg-white")}>
                  <Settings size={18} /> <span className="font-medium text-sm">Configurações</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}