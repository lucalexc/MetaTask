import React, { useState, useEffect } from 'react';
import { Plus, X, Folder, Loader2, Edit2, Check, Circle } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  task_count?: number;
  completed_task_count?: number;
  total_elapsed_time?: number;
}

const PRESET_COLORS = [
  '#f87171', // red-400
  '#fb923c', // orange-400
  '#fbbf24', // amber-400
  '#4ade80', // green-400
  '#60a5fa', // blue-400
  '#818cf8', // indigo-400
  '#a78bfa', // violet-400
  '#94a3b8', // slate-400
];

export default function ProjectsDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    if (user) {
      fetchProjects();

      // Subscribe to task changes to update project task counts in real-time
      const channel = supabase
        .channel('tasks_changes_for_projects')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks',
          },
          () => {
            fetchProjects();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: true });

      if (projectsError) throw projectsError;

      // Fetch task counts and metrics
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('project_id, status, elapsed_time');

      if (tasksError) throw tasksError;

      const projectStats = tasksData.reduce((acc: any, task: any) => {
        if (task.project_id) {
          if (!acc[task.project_id]) {
            acc[task.project_id] = { total: 0, completed: 0, elapsed: 0 };
          }
          acc[task.project_id].total += 1;
          if (task.status === 'completed') {
            acc[task.project_id].completed += 1;
          }
          acc[task.project_id].elapsed += (task.elapsed_time || 0);
        }
        return acc;
      }, {});

      const projectsWithCounts = (projectsData || []).map(p => ({
        ...p,
        task_count: projectStats[p.id]?.total || 0,
        completed_task_count: projectStats[p.id]?.completed || 0,
        total_elapsed_time: projectStats[p.id]?.elapsed || 0
      }));

      setProjects(projectsWithCounts);
      
      // Update selected project if it exists
      setSelectedProject(prev => {
        if (prev) {
          return projectsWithCounts.find(p => p.id === prev.id) || prev;
        }
        return prev;
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const validSeconds = Math.max(0, totalSeconds);
    const hours = Math.floor(validSeconds / 3600);
    const minutes = Math.floor((validSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleCreateProject = async (name: string, description: string, color: string) => {
    if (!user) return;
    
    if (projects.length >= 7) {
      toast.error('Limite máximo de 7 projetos atingido.');
      return;
    }

    try {
      const { error } = await supabase.from('projects').insert([{
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        color
      }]);
      if (error) throw error;
      setIsModalOpen(false);
      fetchProjects();
      toast.success('Projeto criado com sucesso!');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Erro ao criar projeto.');
    }
  };

  const handleUpdateProject = async (id: string, name: string, description: string, color: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          color
        })
        .eq('id', id);

      if (error) throw error;

      // Optimistic local update — no full re-fetch to prevent loops
      setProjects(prev => prev.map(p =>
        p.id === id ? { ...p, name: name.trim(), description: description.trim() || undefined, color } : p
      ));
      setSelectedProject(prev =>
        prev ? { ...prev, name: name.trim(), description: description.trim() || undefined, color } : prev
      );
      toast.success('Projeto atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Erro ao atualizar projeto.');
    }
  };

  const handleDeleteProject = async (id: string) => {
    const confirmed = window.confirm('Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.');
    if (!confirmed) return;
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      // Optimistic local update — remove from list and navigate back
      setProjects(prev => prev.filter(p => p.id !== id));
      setSelectedProject(null);
      toast.success('Projeto excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Erro ao excluir projeto.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FCFAF8]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1f60c2]" />
      </div>
    );
  }

  const canCreateMore = projects.length < 7;

  if (selectedProject) {
    return (
      <ProjectDetailView
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onUpdate={handleUpdateProject}
        onDelete={handleDeleteProject}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#FCFAF8] h-screen overflow-hidden">
      <header className="px-4 md:px-8 py-4 md:py-6 border-b border-gray-200 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-[26px] leading-[35px] font-bold text-[#202020] tracking-tight">Meus Projetos</h1>
          <span className="px-2.5 py-1 rounded-full bg-gray-100 text-[11px] font-bold text-[#808080] border border-gray-200 uppercase tracking-wider">
            Projetos: {projects.length} / 7
          </span>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!canCreateMore}
          className="flex items-center gap-2 px-4 py-2 bg-[#202020] text-white text-[13px] font-bold rounded-lg hover:bg-black transition-colors ease-out duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Novo Projeto
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto">
          {projects.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Folder className="w-8 h-8 text-[#808080]" />
              </div>
              <h3 className="text-[16px] font-bold text-[#202020] mb-1">Nenhum projeto ainda</h3>
              <p className="text-[13px] text-[#808080] mb-6">Crie seu primeiro projeto para organizar suas tarefas.</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#202020] text-white text-[13px] font-bold rounded-lg hover:bg-black transition-colors ease-out duration-200"
              >
                <Plus className="w-4 h-4" />
                Criar Projeto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {projects.map((project) => (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => setSelectedProject(project)}
                    className="group relative bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-md transition-all ease-out duration-200 cursor-pointer overflow-hidden"
                  >
                    {/* Colored sidebar */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1.5"
                      style={{ backgroundColor: project.color }}
                    />
                    
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm"
                          style={{ backgroundColor: project.color }}
                        >
                          <Folder className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-[14px] text-[#202020] leading-none">{project.name}</h3>
                          {project.description && (
                            <p className="text-[12px] text-[#808080] mt-1 line-clamp-1">{project.description}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-[#808080] hover:text-[#d1453b] hover:bg-red-50 rounded-md transition-all ease-out duration-200"
                        title="Excluir projeto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center text-[11px] font-bold text-[#808080] uppercase tracking-wider">
                        <span>{project.task_count} {project.task_count === 1 ? 'tarefa' : 'tarefas'}</span>
                      </div>
                      <div className="flex items-center text-[11px] font-bold text-[#808080]">
                        <span>⏱️ {formatTime(project.total_elapsed_time || 0)}</span>
                      </div>
                    </div>
                    {(project.task_count || 0) > 0 && (
                      <div className="mt-4">
                        <div className="flex justify-between text-[10px] font-bold text-[#808080] mb-1.5 uppercase tracking-wider">
                          <span>Progresso</span>
                          <span>{Math.round(((project.completed_task_count || 0) / (project.task_count || 1)) * 100)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{ 
                              width: `${((project.completed_task_count || 0) / (project.task_count || 1)) * 100}%`,
                              backgroundColor: project.color
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <NewProjectModal
            onClose={() => setIsModalOpen(false)}
            onSave={handleCreateProject}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function NewProjectModal({ onClose, onSave }: { onClose: () => void; onSave: (name: string, description: string, color: string) => Promise<void> }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[4]); // Default blue
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(name, description, color);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-200"
      >
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <h3 className="font-bold text-[16px] text-[#202020]">Novo Projeto</h3>
          <button onClick={onClose} className="text-[#808080] hover:text-[#202020] p-1 rounded-md hover:bg-gray-100 transition-colors ease-out duration-200">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-5 space-y-5">
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-bold text-[#808080] mb-1.5">Nome do Projeto</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Trabalho, Pessoal..."
              className="w-full px-3 py-2 text-[13px] leading-[18px] text-[#202020] placeholder-[#808080] border border-gray-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2] font-medium transition-all ease-out duration-200"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider font-bold text-[#808080] mb-1.5">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional..."
              rows={2}
              className="w-full px-3 py-2 text-[13px] leading-[18px] text-[#202020] placeholder-[#808080] border border-gray-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2] resize-none transition-all ease-out duration-200"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider font-bold text-[#808080] mb-2.5">Cor do Projeto</label>
            <div className="flex flex-wrap gap-2.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-6 h-6 rounded-full transition-all ease-out duration-200 relative group",
                    color === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-110"
                  )}
                  style={{ backgroundColor: c }}
                  type="button"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-[13px] font-bold text-[#808080] hover:bg-gray-200 rounded-md transition-colors ease-out duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            className="px-4 py-1.5 bg-[#202020] text-white text-[13px] font-bold rounded-md hover:bg-black transition-colors ease-out duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
          >
            {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
            Criar Projeto
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ProjectDetailView({
  project,
  onClose,
  onUpdate,
  onDelete
}: {
  project: Project;
  onClose: () => void;
  onUpdate: (id: string, name: string, description: string, color: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { user } = useAuth();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [color, setColor] = useState(project.color);
  const [isSaving, setIsSaving] = useState(false);

  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['projectTasks', project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status')
        .eq('project_id', project.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(project.id, name, description, color);
    setIsSaving(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FCFAF8] h-full overflow-hidden">
      <header className="px-4 md:px-8 py-4 md:py-6 border-b border-gray-200 flex items-center gap-4 shrink-0">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors ease-out duration-200 text-[#808080] text-[13px] font-bold"
        >
          ← Voltar para Projetos
        </button>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
          <h1 className="text-[26px] leading-[35px] font-bold text-[#202020] tracking-tight">{project.name}</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Tasks */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 flex flex-col h-[600px]">
            <h2 className="text-[11px] font-bold text-[#808080] uppercase tracking-wider mb-4 shrink-0">Tarefas Abertas</h2>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {isLoadingTasks ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 text-[#1f60c2] animate-spin" />
                </div>
              ) : tasks && tasks.length > 0 ? (
                tasks.map((task: any) => (
                  <div key={task.id} className="group flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white shadow-sm hover:border-gray-300 transition-colors ease-out duration-200">
                    <span className="flex-1 text-[13px] text-[#202020] font-medium leading-[18px]">
                      {task.title}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-[13px] text-[#808080] italic">Nenhuma tarefa aberta neste projeto.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Metadata */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm h-fit space-y-6">
            <h2 className="text-[11px] font-bold text-[#808080] uppercase tracking-wider mb-4">Detalhes do Projeto</h2>
            
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-bold text-[#808080] mb-1.5">Nome do Projeto</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Trabalho, Pessoal..."
                className="w-full px-3 py-2 text-[13px] leading-[18px] text-[#202020] placeholder-[#808080] border border-gray-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2] font-medium transition-all ease-out duration-200"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider font-bold text-[#808080] mb-1.5">Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opcional..."
                rows={3}
                className="w-full px-3 py-2 text-[13px] leading-[18px] text-[#202020] placeholder-[#808080] border border-gray-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2] resize-none transition-all ease-out duration-200"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider font-bold text-[#808080] mb-2.5">Cor do Projeto</label>
              <div className="flex flex-wrap gap-2.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all ease-out duration-200 relative group",
                      color === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-110"
                    )}
                    style={{ backgroundColor: c }}
                    type="button"
                  />
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-between items-center gap-3">
              {/* Destructive action — left side */}
              <button
                onClick={() => onDelete(project.id)}
                disabled={isSaving}
                className="px-4 py-2 text-[13px] font-bold text-[#d1453b] border border-red-200 rounded-lg hover:bg-red-50 transition-colors ease-out duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Excluir Projeto
              </button>
              {/* Primary action — right side */}
              <button
                onClick={handleSave}
                disabled={!name.trim() || isSaving}
                className="px-6 py-2 bg-[#202020] text-white text-[13px] font-bold rounded-lg hover:bg-black transition-colors ease-out duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
