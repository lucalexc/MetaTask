import React, { useState, useEffect } from 'react';
import { X, Trash2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Milestone, Desire } from '@/src/types/roadmap';
import { cn } from '@/src/lib/utils';

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone?: Milestone | null;
  desires?: Desire[];
  onSave: (data: Partial<Milestone>) => void;
  onDelete?: (id: string) => void;
  onAddDesire?: (data: { title: string; category?: string; estimated_cost?: number }) => void;
  onDeleteDesire?: (id: string) => void;
  onToggleDesireAchieved?: (id: string) => void;
  onUploadImage?: (file: File) => Promise<string | null>;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  material: '🛍️', experience: '✈️', achievement: '🏆', 
  financial: '💰', personal: '❤️', general: '📦'
};

const CATEGORY_LABELS: Record<string, string> = {
  material: 'Material', experience: 'Experiência', achievement: 'Conquista', 
  financial: 'Financeiro', personal: 'Pessoal', general: 'Geral'
};

export default function MilestoneModal({ 
  isOpen, onClose, milestone, desires = [], onSave, onDelete,
  onAddDesire, onDeleteDesire, onToggleDesireAchieved, onUploadImage
}: MilestoneModalProps) {
  const isEditing = !!milestone;
  
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('📍');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState('pending');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [isAddingDesire, setIsAddingDesire] = useState(false);
  const [newDesireTitle, setNewDesireTitle] = useState('');
  const [newDesireCategory, setNewDesireCategory] = useState('general');
  const [newDesireCost, setNewDesireCost] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (milestone) {
        setTitle(milestone.title);
        setIcon(milestone.icon || '📍');
        setTargetDate(milestone.target_date || '');
        setStatus(milestone.status || 'pending');
        setDescription(milestone.description || '');
        setImageUrl(milestone.image_url || null);
      } else {
        setTitle('');
        setIcon('📍');
        setTargetDate('');
        setStatus('pending');
        setDescription('');
        setImageUrl(null);
      }
      setIsAddingDesire(false);
      setNewDesireTitle('');
      setNewDesireCost('');
      setNewDesireCategory('general');
    }
  }, [isOpen, milestone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !icon.trim()) return;
    
    const data: Partial<Milestone> = {
      title: title.trim(),
      icon: icon.trim(),
      target_date: targetDate || undefined,
      status: status as any,
      description: description.trim() || undefined,
      image_url: imageUrl || undefined,
      ...(status === 'completed' && (!milestone || milestone.status !== 'completed') 
          ? { completed_at: new Date().toISOString() } 
          : {})
    };
    
    onSave(data);
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadImage) {
      const url = await onUploadImage(file);
      if (url) setImageUrl(url);
    }
  };

  const handleAddDesireSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesireTitle.trim() || !onAddDesire) return;
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl z-[70] overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-[#202020] text-lg">
                {isEditing ? 'Editar Marco' : 'Novo Marco'}
              </h3>
              <button onClick={onClose} className="p-2 text-[#808080] hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <form id="milestone-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Header / Title & Icon */}
                <div className="flex items-end gap-3">
                  <div className="space-y-2 w-20 shrink-0">
                    <label className="text-[13px] font-bold text-[#202020]">Ícone</label>
                    <input
                      type="text"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      maxLength={2}
                      className="w-full text-center text-xl bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2] transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <label className="text-[13px] font-bold text-[#202020]">Título do Marco</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Sair das Dívidas, Aprender Inglês"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] text-[#202020] placeholder-[#808080] focus:outline-none focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2] transition-all duration-200"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Image Section */}
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#202020]">Imagem de Destaque</label>
                  <div className="relative group rounded-lg overflow-hidden bg-gray-50 border border-gray-200 h-32 flex items-center justify-center">
                    {imageUrl ? (
                      <>
                        <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-medium cursor-pointer transition-opacity">
                          Trocar foto
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                      </>
                    ) : (
                      <label className="w-full h-full flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-100 transition-colors">
                        <ImageIcon className="w-6 h-6 mb-2" />
                        <span className="text-sm font-medium">Adicionar foto</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      </label>
                    )}
                  </div>
                </div>

                {/* Grid 2 Columns */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-[#202020]">Data Alvo</label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] text-[#202020] focus:outline-none focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2] transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-[#202020]">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] text-[#202020] focus:outline-none focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2] transition-all duration-200"
                    >
                      <option value="pending">Pendente</option>
                      <option value="in_progress">Em Progresso</option>
                      <option value="completed">Concluído</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#202020]">Descrição</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Adicione notas sobre esta etapa..."
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] text-[#202020] placeholder-[#808080] focus:outline-none focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2] transition-all duration-200 resize-none min-h-[80px]"
                  />
                </div>
              </form>

              {/* Desires Section (Only in Edit Mode) */}
              {isEditing && (
                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[#202020] text-sm">ITENS / DESEJOS</h3>
                    <button 
                      onClick={() => setIsAddingDesire(true)}
                      className="text-xs font-bold text-[#1f60c2] hover:bg-[#dceaff] px-2 py-1 rounded transition-colors"
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
                          onChange={() => onToggleDesireAchieved?.(desire.id)}
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
                          onClick={() => onDeleteDesire?.(desire.id)}
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
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-between items-center shrink-0 bg-gray-50">
              {isEditing ? (
                <button
                  type="button"
                  onClick={() => {
                    if (milestone && onDelete) {
                      onDelete(milestone.id);
                      onClose();
                    }
                  }}
                  className="px-4 py-2 text-[13px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir estação
                </button>
              ) : (
                <div /> // Spacer
              )}
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-[13px] font-bold text-[#808080] hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="milestone-form"
                  disabled={!title.trim() || !icon.trim()}
                  className="px-4 py-2 text-[13px] font-bold text-white bg-[#1f60c2] hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Salvar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
