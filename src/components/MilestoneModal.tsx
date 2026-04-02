import React, { useState, useEffect } from 'react';
import { X, Trash2, Image as ImageIcon, Target, Calendar, Info, Flag, Check } from 'lucide-react';
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

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const PREDEFINED_EMOJIS = ['📍', '🎯', '💼', '💰', '🏠', '🎓', '✈️', '💪', '🚗', '💎'];

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] overscroll-none h-[100dvh]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90dvh] flex flex-col bg-white rounded-2xl shadow-2xl z-[101] overflow-hidden border border-gray-100"
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center shrink-0 bg-white">
              <h3 className="font-bold text-[#202020] text-lg">
                {isEditing ? 'Editar Marco' : 'Novo Marco'}
              </h3>
              <button onClick={onClose} className="p-2 text-[#808080] hover:bg-gray-100 rounded-full transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <form id="milestone-form" onSubmit={handleSubmit} className="space-y-4">
                
                {/* Title Row */}
                <div className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-100 rounded-xl hover:bg-gray-100/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Target className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-sm font-medium text-gray-600">Título do Marco</span>
                  </div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Sair das Dívidas"
                    className="w-48 bg-transparent text-right text-sm font-semibold text-blue-600 placeholder-blue-300 focus:ring-0 border-none outline-none"
                    autoFocus
                  />
                </div>

                {/* Icon Row */}
                <div className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-100 rounded-xl hover:bg-gray-100/50 transition-colors group relative">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                      {icon || '📍'}
                    </div>
                    <span className="text-sm font-medium text-gray-600">Ícone</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {icon || '📍'}
                  </button>
                  
                  {showEmojiPicker && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                      <div className="absolute top-full right-0 mt-2 z-50 bg-white border border-gray-100 shadow-xl rounded-xl p-3 grid grid-cols-5 gap-2 w-max">
                        {PREDEFINED_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setIcon(emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="w-10 h-10 flex items-center justify-center text-xl hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Date Row */}
                <div className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-100 rounded-xl hover:bg-gray-100/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-sm font-medium text-gray-600">Data Alvo</span>
                  </div>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="bg-transparent text-right text-sm font-semibold text-blue-600 focus:ring-0 border-none outline-none cursor-pointer"
                  />
                </div>

                {/* Status Row */}
                <div className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-100 rounded-xl hover:bg-gray-100/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Flag className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-sm font-medium text-gray-600">Status</span>
                  </div>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="bg-transparent text-right text-sm font-semibold text-blue-600 focus:ring-0 border-none outline-none cursor-pointer appearance-none"
                  >
                    <option value="pending">Pendente</option>
                    <option value="in_progress">Em Progresso</option>
                    <option value="completed">Concluído</option>
                  </select>
                </div>

                {/* Image Section */}
                <div className="space-y-2 pt-2">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-[#808080] ml-1">Imagem de Destaque</label>
                  <div className="relative group rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 h-40 flex items-center justify-center transition-all hover:border-blue-100">
                    {imageUrl ? (
                      <>
                        <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white font-bold text-sm cursor-pointer transition-all backdrop-blur-[2px]">
                          <ImageIcon className="w-6 h-6 mb-2" />
                          Trocar foto
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                      </>
                    ) : (
                      <label className="w-full h-full flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-100/50 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                          <ImageIcon className="w-6 h-6 text-blue-500" />
                        </div>
                        <span className="text-sm font-bold text-gray-500">Adicionar foto inspiradora</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      </label>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 ml-1">
                    <Info className="w-3 h-3 text-gray-400" />
                    <label className="text-[11px] uppercase tracking-wider font-bold text-[#808080]">Descrição</label>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Quais são os detalhes deste marco?"
                    className="w-full bg-gray-50/30 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-[#202020] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all resize-none min-h-[100px]"
                  />
                </div>
              </form>

              {/* Desires Section (Only in Edit Mode) */}
              {isEditing && (
                <div className="mt-10 space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="font-bold text-[#202020] text-sm uppercase tracking-wider">Itens e Desejos</h3>
                    <button 
                      onClick={() => setIsAddingDesire(true)}
                      className="text-xs font-bold text-[#1f60c2] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all"
                    >
                      + Adicionar Item
                    </button>
                  </div>

                  <div className="space-y-2">
                    {desires.map(desire => (
                      <div key={desire.id} className="group flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-blue-100 transition-all">
                        <div 
                          onClick={() => onToggleDesireAchieved?.(desire.id)}
                          className={cn(
                            "w-5 h-5 rounded-full border flex items-center justify-center transition-all cursor-pointer",
                            desire.is_achieved ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-blue-400"
                          )}
                        >
                          {desire.is_achieved && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-bold truncate", desire.is_achieved ? "text-gray-400 line-through" : "text-gray-700")}>
                            {desire.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-lg font-bold uppercase tracking-tight">
                              {CATEGORY_EMOJIS[desire.category]} {CATEGORY_LABELS[desire.category]}
                            </span>
                            {desire.estimated_cost && (
                              <span className="text-[10px] text-blue-600 font-bold">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(desire.estimated_cost)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => onDeleteDesire?.(desire.id)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {isAddingDesire && (
                      <form onSubmit={handleAddDesireSubmit} className="p-4 bg-gray-50/50 border border-gray-200 rounded-2xl space-y-3 shadow-inner">
                        <input
                          type="text"
                          value={newDesireTitle}
                          onChange={(e) => setNewDesireTitle(e.target.value)}
                          placeholder="O que você deseja?"
                          className="w-full text-sm font-bold px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <select
                            value={newDesireCategory}
                            onChange={(e) => setNewDesireCategory(e.target.value)}
                            className="flex-1 text-xs font-bold px-3 py-2 border border-gray-200 rounded-xl focus:outline-none bg-white"
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
                            className="w-28 text-xs font-bold px-3 py-2 border border-gray-200 rounded-xl focus:outline-none bg-white"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button type="button" onClick={() => setIsAddingDesire(false)} className="text-xs font-bold px-4 py-2 text-gray-500 hover:bg-gray-200 rounded-xl transition-all">Cancelar</button>
                          <button type="submit" disabled={!newDesireTitle.trim()} className="text-xs font-bold px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-100">Salvar Item</button>
                        </div>
                      </form>
                    )}
                    
                    {desires.length === 0 && !isAddingDesire && (
                      <div className="text-center py-10 bg-gray-50/30 border-2 border-dashed border-gray-100 rounded-2xl">
                        <p className="text-xs text-gray-400 font-medium">Nenhum item ou desejo adicionado ainda.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-between items-center shrink-0 bg-gray-50/50">
              {isEditing ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              ) : (
                <div /> // Spacer
              )}
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="milestone-form"
                  disabled={!title.trim() || !icon.trim()}
                  className="px-8 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-blue-200"
                >
                  Salvar Marco
                </button>
              </div>
            </div>
          </motion.div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-gray-100"
              >
                <h3 className="text-lg font-bold text-[#202020] mb-2">Excluir Marco?</h3>
                <p className="text-sm text-gray-500 mb-6 font-medium">
                  Tem certeza? Todos os itens e desejos atrelados a este marco serão removidos permanentemente.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (milestone && onDelete) {
                        onDelete(milestone.id);
                        setShowDeleteConfirm(false);
                        onClose();
                      }
                    }}
                    className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-lg shadow-red-100"
                  >
                    Sim, excluir
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
