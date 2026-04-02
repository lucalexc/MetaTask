import React, { useState } from 'react';
import { Plus, X, Folder, Loader2 } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import ProjectDetails from './ProjectDetails';

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

export default function ProjectsDashboard({ 
  projectId,
  isCreateModalOpen,
  setIsCreateModalOpen
}: { 
  projectId?: string;
  isCreateModalOpen?: boolean;
  setIsCreateModalOpen?: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
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

      return (projectsData || []).map(p => ({
        ...p,
        task_count: projectStats[p.id]?.total || 0,
        completed_task_count: projectStats[p.id]?.completed || 0,
        total_elapsed_time: projectStats[p.id]?.elapsed || 0
      }));
    },
    enabled: !!user
  });

  const selectedProject = projectId ? projects.find(p => p.id === projectId) : null;

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
    try {
      const { error } = await supabase.from('projects').insert([{
        user_id: user.id,
        name,
        description,
        color
      }]);
      if (error) throw error;
      setIsCreateModalOpen?.(false);
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['insights'] });
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
          name,
          description,
          color
        })
        .eq('id', id);

      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['insights'] });
      toast.success('Projeto atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Erro ao atualizar projeto.');
      throw error;
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['insights'] });
      toast.success('Projeto excluído com sucesso!');
      navigate('/app/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Erro ao excluir projeto.');
      throw error;
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
      <ProjectDetails
        project={selectedProject}
        onClose={() => navigate('/app/projects')}
        onUpdate={handleUpdateProject}
        onDelete={(id) => handleDeleteProject(id)}
      />
    );
  }

  return (
    <div className="w-full flex flex-col bg-[#FCFAF8]">
      <header className="px-4 md:px-8 py-4 md:py-6 border-b border-gray-200 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-[26px] leading-[35px] font-bold text-[#202020] tracking-tight">Meus Projetos</h1>
          <span className="px-2.5 py-1 rounded-full bg-gray-100 text-[11px] font-bold text-[#808080] border border-gray-200 uppercase tracking-wider">
            Projetos: {projects.length} / 7
          </span>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto">
          {projects.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Folder className="w-8 h-8 text-[#808080]" />
              </div>
              <h3 className="text-[16px] font-bold text-[#202020] mb-1">Nenhum projeto ainda</h3>
              <p className="text-[13px] text-[#808080] mb-6">Crie seu primeiro projeto para organizar suas tarefas.</p>
              <button
                onClick={() => setIsCreateModalOpen?.(true)}
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
                    onClick={() => navigate(`/app/projects/${project.id}`)}
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
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <NewProjectModal
            onClose={() => setIsCreateModalOpen?.(false)}
            onSave={handleCreateProject}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function NewProjectModal({ onClose, onSave }: { onClose: () => void; onSave: (name: string, description: string, color: string) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[4]); // Default blue

  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overscroll-none h-[100dvh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 max-h-[90dvh] flex flex-col"
      >
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <h3 className="font-bold text-lg text-[#202020]">Novo Projeto</h3>
          <button onClick={onClose} className="text-[#808080] hover:text-[#202020] p-2 rounded-full hover:bg-gray-100 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
          {/* Project Name Row */}
          <div className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-100 rounded-xl hover:bg-gray-100/50 transition-colors group">
            <div className="flex items-center gap-3">
              <Folder className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
              <span className="text-sm font-medium text-gray-600">Nome</span>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Trabalho"
              className="w-32 bg-transparent text-right text-sm font-semibold text-blue-600 placeholder-blue-300 focus:ring-0 border-none outline-none"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-wider font-bold text-[#808080] ml-1">Descrição (Opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sobre o que é este projeto?"
              rows={3}
              className="w-full px-4 py-3 text-sm text-[#202020] placeholder-gray-400 bg-gray-50/30 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/30 resize-none transition-all"
            />
          </div>

          {/* Color Selection Row */}
          <div className="p-3 bg-gray-50/50 border border-gray-100 rounded-xl">
            <label className="block text-[11px] uppercase tracking-wider font-bold text-[#808080] mb-3 ml-1">Cor do Projeto</label>
            <div className="flex flex-wrap gap-2.5 justify-center">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-7 h-7 rounded-full transition-all ease-out duration-200 relative",
                    color === c ? "ring-2 ring-offset-2 ring-blue-400 scale-110 shadow-lg" : "hover:scale-110 opacity-80 hover:opacity-100"
                  )}
                  style={{ backgroundColor: c }}
                  type="button"
                >
                  {color === c && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(name, description, color)}
            disabled={!name.trim()}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
          >
            Criar Projeto
          </button>
        </div>
      </motion.div>
    </div>
  );
}
