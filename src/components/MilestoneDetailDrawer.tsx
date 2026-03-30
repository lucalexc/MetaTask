import React, { useState } from 'react';
import { X, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Milestone, useMilestoneDesires } from '@/src/hooks/useRoadmap';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface MilestoneDetailDrawerProps {
  milestone: Milestone | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Milestone>) => void;
}

export default function MilestoneDetailDrawer({ milestone, isOpen, onClose, onUpdate }: MilestoneDetailDrawerProps) {
  const { desires, isLoading, addDesire, updateDesire, deleteDesire } = useMilestoneDesires(milestone?.id);
  const [newDesireName, setNewDesireName] = useState('');
  const [newDesireCost, setNewDesireCost] = useState('');

  if (!isOpen || !milestone) return null;

  const handleAddDesire = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesireName.trim()) return;
    addDesire({
      name: newDesireName,
      estimated_cost: newDesireCost ? parseFloat(newDesireCost) : undefined,
      is_completed: false
    });
    setNewDesireName('');
    setNewDesireCost('');
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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-screen w-full max-w-md bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
              <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <span className="text-2xl">{milestone.icon || '🎯'}</span>
                Detalhes do Marco
              </h2>
              <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Título</label>
                  <input
                    type="text"
                    value={milestone.title}
                    onChange={(e) => onUpdate(milestone.id, { title: e.target.value })}
                    className="w-full text-lg font-bold text-slate-800 border-0 border-b-2 border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-0 px-0 py-1 bg-transparent transition-colors"
                  />
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Status</label>
                    <select
                      value={milestone.status}
                      onChange={(e) => onUpdate(milestone.id, { status: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Pendente</option>
                      <option value="in_progress">Em Progresso</option>
                      <option value="completed">Concluído</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Data Alvo</label>
                    <input
                      type="date"
                      value={milestone.target_date || ''}
                      onChange={(e) => onUpdate(milestone.id, { target_date: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Desires List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Desejos & Requisitos</h3>
                  <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {desires.filter(d => d.is_completed).length} / {desires.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {isLoading ? (
                    <p className="text-sm text-slate-500 text-center py-4">Carregando...</p>
                  ) : desires.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">Nenhum desejo adicionado ainda.</p>
                  ) : (
                    desires.map(desire => (
                      <div key={desire.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl group hover:border-blue-300 transition-colors">
                        <button
                          onClick={() => updateDesire(desire.id, { is_completed: !desire.is_completed })}
                          className={cn("shrink-0 transition-colors", desire.is_completed ? "text-green-500" : "text-slate-300 hover:text-blue-500")}
                        >
                          {desire.is_completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-medium truncate transition-all", desire.is_completed ? "text-slate-400 line-through" : "text-slate-700")}>
                            {desire.name}
                          </p>
                          {desire.estimated_cost && (
                            <p className="text-xs text-slate-500">
                              R$ {desire.estimated_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteDesire(desire.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddDesire} className="flex gap-2 mt-4">
                  <input
                    type="text"
                    value={newDesireName}
                    onChange={(e) => setNewDesireName(e.target.value)}
                    placeholder="Novo desejo..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    value={newDesireCost}
                    onChange={(e) => setNewDesireCost(e.target.value)}
                    placeholder="R$ Custo"
                    className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newDesireName.trim()}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
