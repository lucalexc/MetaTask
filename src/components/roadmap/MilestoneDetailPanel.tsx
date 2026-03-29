import React, { useState } from 'react';
import { X, Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import { Milestone, Desire } from '@/src/types/roadmap';
import { cn } from '@/src/lib/utils';
import { motion } from 'framer-motion';

interface MilestoneDetailPanelProps {
  milestone: Milestone;
  desires: Desire[];
  onClose: () => void;
  onUpdateMilestone: (id: string, data: Partial<Milestone>) => void;
  onDeleteMilestone: (id: string) => void;
  onAddDesire: (data: { title: string; category?: string; estimated_cost?: number }) => void;
  onDeleteDesire: (id: string) => void;
  onToggleDesireAchieved: (id: string) => void;
  onUploadImage: (file: File) => Promise<string | null>;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  material: '🛍️', experience: '✈️', achievement: '🏆', 
  financial: '💰', personal: '❤️', general: '📦'
};

const CATEGORY_LABELS: Record<string, string> = {
  material: 'Material', experience: 'Experiência', achievement: 'Conquista', 
  financial: 'Financeiro', personal: 'Pessoal', general: 'Geral'
};

export default function MilestoneDetailPanel({
  milestone, desires, onClose, onUpdateMilestone, onDeleteMilestone,
  onAddDesire, onDeleteDesire, onToggleDesireAchieved, onUploadImage
}: MilestoneDetailPanelProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(milestone.title);
  const [isAddingDesire, setIsAddingDesire] = useState(false);
  const [newDesireTitle, setNewDesireTitle] = useState('');
  const [newDesireCategory, setNewDesireCategory] = useState('general');
  const [newDesireCost, setNewDesireCost] = useState('');

  const handleTitleSave = () => {
    if (titleInput.trim() && titleInput !== milestone.title) {
      onUpdateMilestone(milestone.id, { title: titleInput.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleAddDesireSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesireTitle.trim()) return;
    onAddDesire({
      title: newDesireTitle.trim(),
      category: newDesireCategory,
      estimated_cost: newDesireCost ? parseFloat(newDesireCost) : undefined
    });
    setIsAddingDesire(false);
    setNewDesireTitle('');
    setNewDesireCost('');
    setNewDesireCategory('general');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUploadImage(file);
    }
  };

  return (
    <motion.div 
      initial={{ x: 360 }}
      animate={{ x: 0 }}
      exit={{ x: 360 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-[360px] bg-white border-l border-gray-200 flex flex-col h-full shrink-0 shadow-xl md:shadow-none absolute md:relative right-0 z-50"
    >
      <div className="p-4 border-b border-gray-100 flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-3xl shrink-0">{milestone.icon}</span>
          {isEditingTitle ? (
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              className="font-bold text-lg text-gray-900 w-full border-b border-blue-500 focus:outline-none bg-transparent"
              autoFocus
            />
          ) : (
            <h2 
              onClick={() => setIsEditingTitle(true)}
              className="font-bold text-lg text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
            >
              {milestone.title}
            </h2>
          )}
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full shrink-0 ml-2">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        {/* Image Section */}
        <div className="relative group rounded-xl overflow-hidden bg-gray-50 border border-gray-100 aspect-video flex items-center justify-center">
          {milestone.image_url ? (
            <>
              <img src={milestone.image_url} alt={milestone.title} className="w-full h-full object-cover" />
              <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-medium cursor-pointer transition-opacity">
                Trocar foto
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </>
          ) : (
            <label className="w-full h-full flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-100 transition-colors border-2 border-dashed border-gray-200 rounded-xl m-2">
              <ImageIcon className="w-6 h-6 mb-2" />
              <span className="text-sm font-medium">Adicionar foto</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          )}
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Data Alvo</label>
              <input
                type="date"
                value={milestone.target_date || ''}
                onChange={(e) => onUpdateMilestone(milestone.id, { target_date: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Status</label>
              <select
                value={milestone.status}
                onChange={(e) => {
                  const val = e.target.value as any;
                  onUpdateMilestone(milestone.id, { 
                    status: val,
                    ...(val === 'completed' ? { completed_at: new Date().toISOString() } : {})
                  });
                }}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                <option value="pending">Pendente</option>
                <option value="in_progress">Em Progresso</option>
                <option value="completed">Concluído</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Descrição</label>
            <textarea
              defaultValue={milestone.description || ''}
              onBlur={(e) => onUpdateMilestone(milestone.id, { description: e.target.value })}
              placeholder="Adicione notas sobre esta etapa..."
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none min-h-[80px]"
            />
          </div>
        </div>

        {/* Desires Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 text-sm">ITENS</h3>
            <button 
              onClick={() => setIsAddingDesire(true)}
              className="text-xs font-medium text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
            >
              + Item
            </button>
          </div>

          <div className="space-y-2">
            {desires.map(desire => (
              <div key={desire.id} className="group flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-blue-200 transition-colors">
                <input
                  type="checkbox"
                  checked={desire.is_achieved}
                  onChange={() => onToggleDesireAchieved(desire.id)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium truncate", desire.is_achieved ? "text-gray-400 line-through" : "text-gray-700")}>
                    {desire.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                      {CATEGORY_EMOJIS[desire.category]} {CATEGORY_LABELS[desire.category]}
                    </span>
                    {desire.estimated_cost && (
                      <span className="text-[10px] text-gray-500 font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(desire.estimated_cost)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onDeleteDesire(desire.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {isAddingDesire && (
              <form onSubmit={handleAddDesireSubmit} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                <input
                  type="text"
                  value={newDesireTitle}
                  onChange={(e) => setNewDesireTitle(e.target.value)}
                  placeholder="Nome do item..."
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  autoFocus
                />
                <div className="flex gap-2">
                  <select
                    value={newDesireCategory}
                    onChange={(e) => setNewDesireCategory(e.target.value)}
                    className="flex-1 text-xs px-2 py-2 border border-gray-200 rounded-lg focus:outline-none bg-white"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{CATEGORY_EMOJIS[key]} {label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={newDesireCost}
                    onChange={(e) => setNewDesireCost(e.target.value)}
                    placeholder="R$ Custo"
                    className="w-24 text-xs px-2 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setIsAddingDesire(false)} className="text-xs px-3 py-1.5 text-gray-500 hover:bg-gray-200 rounded">Cancelar</button>
                  <button type="submit" disabled={!newDesireTitle.trim()} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">Salvar</button>
                </div>
              </form>
            )}
            
            {desires.length === 0 && !isAddingDesire && (
              <p className="text-xs text-gray-400 text-center py-4">Nenhum item adicionado.</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => onDeleteMilestone(milestone.id)}
          className="w-full py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Excluir estação
        </button>
      </div>
    </motion.div>
  );
}
