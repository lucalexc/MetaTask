import React, { useState } from 'react';
import { X, Loader2, ArrowLeft, Trash2, Save } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from './ConfirmDialog';

interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
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

interface ProjectDetailsProps {
  project: Project;
  onClose: () => void;
  onUpdate: (id: string, name: string, description: string, color: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function ProjectDetails({
  project,
  onClose,
  onUpdate,
  onDelete
}: ProjectDetailsProps) {
  const navigate = useNavigate();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [color, setColor] = useState(project.color);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
    if (!name.trim()) {
      toast.error('O nome do projeto é obrigatório.');
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(project.id, name, description, color);
      // Local update is handled by the parent's fetchProjects which is called in onUpdate
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(project.id); // Confirmation already handled by ConfirmDialog
      onClose(); 
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FCFAF8] h-full overflow-hidden">
      <header className="px-4 md:px-8 py-4 md:py-6 border-b border-gray-200 flex justify-between items-center shrink-0 bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors ease-out duration-200 text-[#808080] flex items-center gap-2 text-[13px] font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar para Projetos</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: project.color }} />
            <h1 className="text-[20px] md:text-[26px] leading-tight font-bold text-[#202020] tracking-tight truncate max-w-[200px] md:max-w-md">
              {project.name}
            </h1>
          </div>
        </div>
        {/* Removed Delete button from header as requested */}
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Tasks (40%) */}
          <div className="lg:col-span-5 bg-gray-50 rounded-2xl p-6 border border-gray-200 flex flex-col h-[500px] lg:h-[600px]">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-[11px] font-bold text-[#808080] uppercase tracking-wider">Tarefas Abertas</h2>
              <span className="px-2 py-0.5 rounded-full bg-gray-200 text-[10px] font-bold text-[#606060]">
                {tasks?.length || 0}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {isLoadingTasks ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 text-[#1f60c2] animate-spin" />
                </div>
              ) : tasks && tasks.length > 0 ? (
                <div className="flex flex-col">
                  {tasks.map((task: any) => (
                    <div key={task.id} className="group flex items-center justify-between py-3 px-2 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 active:bg-gray-100 transition-colors duration-200 cursor-pointer">
                      <span className="flex-1 text-[13px] text-[#202020] font-medium leading-[18px] truncate">
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white/50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-[13px] text-[#808080] italic">Nenhuma tarefa aberta neste projeto.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Metadata (60%) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.06)] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-[11px] font-bold text-[#808080] uppercase tracking-wider">Detalhes do Projeto</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-bold text-[#808080] mb-1.5">Nome do Projeto</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Trabalho, Pessoal..."
                      className="w-full px-3 py-2.5 text-base md:text-[13px] leading-[18px] text-[#202020] placeholder-[#808080] border border-gray-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2] font-medium transition-all ease-out duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-bold text-[#808080] mb-1.5">Descrição</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Adicione uma descrição para este projeto..."
                      rows={4}
                      className="w-full px-3 py-2.5 text-base md:text-[13px] leading-[18px] text-[#202020] placeholder-[#808080] border border-gray-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2] resize-none transition-all ease-out duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-bold text-[#808080] mb-2.5">Cor do Projeto</label>
                    <div className="flex flex-wrap gap-3">
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
              </div>

              {/* Footer with buttons as requested */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  disabled={isDeleting || isSaving}
                  className="w-full sm:w-auto px-4 py-2 text-[13px] font-bold text-[#d1453b] hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all ease-out duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Excluir Projeto
                </button>

                <button
                  onClick={handleSave}
                  disabled={!name.trim() || isSaving || isDeleting}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#7C3AED] text-white text-[13px] font-semibold rounded-lg hover:bg-[#6D28D9] transition-all ease-out duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Alterações
                </button>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.06)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]">
              <h2 className="text-[11px] font-bold text-[#808080] uppercase tracking-wider mb-4">Resumo do Projeto</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-[10px] font-bold text-[#808080] uppercase tracking-wider mb-1">Status</div>
                  <div className="text-[14px] font-bold text-[#202020]">Ativo</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-[10px] font-bold text-[#808080] uppercase tracking-wider mb-1">Criado em</div>
                  <div className="text-[14px] font-bold text-[#202020]">Recentemente</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Projeto"
        description="Tem certeza que deseja excluir este projeto? Esta ação não poderá ser desfeita."
        isLoading={isDeleting}
      />
    </div>
  );
}
