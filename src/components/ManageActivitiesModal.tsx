import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit2, Trash2, Target, Repeat, GripVertical, Info } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useActivities, Activity } from '@/src/hooks/useActivities';

export default function ManageActivitiesModal({ 
  isOpen, 
  onClose,
  onEdit
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onEdit?: (activity: Activity) => void;
}) {
  const { activities, deleteActivity } = useActivities();
  const [filter, setFilter] = useState<'all' | 'routine' | 'goal'>('all');

  if (!isOpen) return null;

  const filteredActivities = activities.filter(a => filter === 'all' || a.type === filter);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#202020]">Gerenciar Atividades</h2>
                  <p className="text-xs text-gray-500 font-medium">Edite ou exclua suas rotinas e metas</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 border-b border-gray-100 flex gap-2 shrink-0 bg-gray-50/30">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-xs font-bold transition-all",
                  filter === 'all' ? "bg-white text-blue-600 shadow-sm border border-gray-100" : "text-gray-500 hover:bg-gray-100"
                )}
              >
                Todas
              </button>
              <button
                onClick={() => setFilter('routine')}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-xs font-bold transition-all",
                  filter === 'routine' ? "bg-blue-50 text-blue-600 border border-blue-100" : "text-gray-500 hover:bg-gray-100"
                )}
              >
                Rotinas
              </button>
              <button
                onClick={() => setFilter('goal')}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-xs font-bold transition-all",
                  filter === 'goal' ? "bg-purple-50 text-purple-600 border border-purple-100" : "text-gray-500 hover:bg-gray-100"
                )}
              >
                Metas
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {filteredActivities.map(activity => (
                  <motion.div
                    key={activity.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-4 p-3 rounded-xl border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-all group"
                  >
                    <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[#202020] truncate text-sm">{activity.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] uppercase tracking-wider font-bold">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-md flex items-center gap-1",
                          activity.type === 'goal' ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {activity.type === 'goal' ? <Target className="w-2.5 h-2.5" /> : <Repeat className="w-2.5 h-2.5" />}
                          {activity.type === 'goal' ? 'Meta' : 'Rotina'}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">{activity.period}</span>
                        {activity.scheduled_time && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500">{activity.scheduled_time.substring(0, 5)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit?.(activity)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Tem certeza que deseja excluir esta atividade?')) {
                            deleteActivity(activity.id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {filteredActivities.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">Nenhuma atividade encontrada.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-lg transition-all shadow-sm"
              >
                Concluir
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
