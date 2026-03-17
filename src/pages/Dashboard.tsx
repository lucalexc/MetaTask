import React, { useState } from 'react';
import { Target, Plus, Inbox, Sword, RefreshCcw, Map, Fingerprint, Settings, Folder } from 'lucide-react';
import TasksDashboard from '@/src/components/TasksDashboard';
import ProjectsDashboard from '@/src/components/ProjectsDashboard';
import GoalsDashboard from '@/src/components/GoalsDashboard';
import RoutinesDashboard from '@/src/components/RoutinesDashboard';
import MissionsMapDashboard from '@/src/components/MissionsMapDashboard';
import IdentityDashboard from '@/src/components/IdentityDashboard';
import SettingsDashboard from '@/src/components/SettingsDashboard';
import { cn } from '@/src/lib/utils';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'projects' | 'goals' | 'routines' | 'missions' | 'identity' | 'settings'>('tasks');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);

  return (
    <div className="flex h-screen bg-white font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-50/50 border-r border-slate-100 flex flex-col shrink-0">
        <div className="p-4 flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
            <Target className="w-3 h-3 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900">MetaTask</span>
        </div>

        <div className="px-3 mb-4">
          {activeTab !== 'missions' && activeTab !== 'identity' && activeTab !== 'settings' && (
            <button 
              onClick={() => {
                if (activeTab === 'tasks') setIsTaskModalOpen(true);
                else if (activeTab === 'goals') setIsGoalModalOpen(true);
                else setIsRoutineModalOpen(true);
              }}
              className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-red-600 hover:bg-slate-100 rounded-md transition-colors w-full"
            >
              <Plus className="w-4 h-4" />
              Adicionar {activeTab === 'tasks' ? 'tarefa' : activeTab === 'goals' ? 'meta' : 'rotina'}
            </button>
          )}
        </div>

        <nav className="px-3 flex-1 space-y-1">
          <button 
            onClick={() => setActiveTab('tasks')}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
              activeTab === 'tasks' ? "text-blue-700 bg-blue-50" : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <Inbox className={cn("w-4 h-4", activeTab === 'tasks' ? "text-blue-600" : "text-slate-500")} />
            Tarefas
          </button>
          <button 
            onClick={() => setActiveTab('projects')}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
              activeTab === 'projects' ? "text-blue-700 bg-blue-50" : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <Folder className={cn("w-4 h-4", activeTab === 'projects' ? "text-blue-600" : "text-slate-500")} />
            Projetos
          </button>
          <button 
            onClick={() => setActiveTab('routines')}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
              activeTab === 'routines' ? "text-blue-700 bg-blue-50" : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <RefreshCcw className={cn("w-4 h-4", activeTab === 'routines' ? "text-blue-600" : "text-slate-500")} />
            Rotinas
          </button>
          <button 
            onClick={() => setActiveTab('goals')}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
              activeTab === 'goals' ? "text-blue-700 bg-blue-50" : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <Map className={cn("w-4 h-4", activeTab === 'goals' ? "text-blue-600" : "text-slate-500")} />
            Metas
          </button>
          <button 
            onClick={() => setActiveTab('missions')}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
              activeTab === 'missions' ? "text-blue-700 bg-blue-50" : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <Sword className={cn("w-4 h-4", activeTab === 'missions' ? "text-blue-600" : "text-slate-500")} />
            Missões
          </button>
          <button 
            onClick={() => setActiveTab('identity')}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
              activeTab === 'identity' ? "text-blue-700 bg-blue-50" : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <Fingerprint className={cn("w-4 h-4", activeTab === 'identity' ? "text-blue-600" : "text-slate-500")} />
            Identidade
          </button>
        </nav>

        <div className="p-3 mt-auto border-t border-slate-100">
          <button 
            onClick={() => setActiveTab('settings')}
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
      <div className={cn("flex-1 flex flex-col overflow-hidden", activeTab !== 'identity' && "hidden")}>
        <IdentityDashboard />
      </div>
      <div className={cn("flex-1 flex flex-col overflow-hidden", activeTab !== 'missions' && "hidden")}>
        <MissionsMapDashboard />
      </div>
      <div className={cn("flex-1 flex flex-col overflow-hidden", activeTab !== 'tasks' && "hidden")}>
        <TasksDashboard isCreateModalOpen={isTaskModalOpen} setIsCreateModalOpen={setIsTaskModalOpen} />
      </div>
      <div className={cn("flex-1 flex flex-col overflow-hidden", activeTab !== 'projects' && "hidden")}>
        <ProjectsDashboard />
      </div>
      <div className={cn("flex-1 flex flex-col overflow-hidden", activeTab !== 'goals' && "hidden")}>
        <GoalsDashboard isCreateModalOpen={isGoalModalOpen} setIsCreateModalOpen={setIsGoalModalOpen} />
      </div>
      <div className={cn("flex-1 flex flex-col overflow-hidden", activeTab !== 'routines' && "hidden")}>
        <RoutinesDashboard isCreateModalOpen={isRoutineModalOpen} setIsCreateModalOpen={setIsRoutineModalOpen} />
      </div>
      <div className={cn("flex-1 flex flex-col overflow-hidden", activeTab !== 'settings' && "hidden")}>
        <SettingsDashboard />
      </div>
    </div>
  );
}
