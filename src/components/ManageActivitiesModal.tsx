import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit2, Trash2, Power, Target, Repeat, GripVertical } from 'lucide-react';
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
  const { activities, updateActivity, deleteActivity, refresh } = useActivities();
  const [filter, setFilter] = useState<'all' | 'routine' | 'goal'>('all');

  if (!isOpen) return null;

  const filteredActivities = activities.filter(a => filter === 'all' || a.type === filter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl max-h-[80vh] flex flex-col bg-[#0C1020] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Gerenciar Atividades</h2>
            <p className="text-sm text-slate-400 mt-1">Edite, pause ou exclua suas rotinas e metas</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b border-white/5 flex gap-2 shrink-0">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-colors",
              filter === 'all' ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('routine')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-colors",
              filter === 'routine' ? "bg-blue-500/20 text-blue-400" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            Rotinas
          </button>
          <button
            onClick={() => setFilter('goal')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-colors",
              filter === 'goal' ? "bg-purple-500/20 text-purple-400" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            Metas
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {filteredActivities.map(activity => (
              <motion.div
                key={activity.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                  activity.is_active 
                    ? "bg-[#111630] border-white/10" 
                    : "bg-[#111630]/50 border-white/5 opacity-60"
                )}
              >
                <div className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300">
                  <GripVertical className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white truncate">{activity.name}</h4>
                    {!activity.is_active && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white/5 px-2 py-0.5 rounded">Pausada</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      {activity.type === 'goal' ? <Target className="w-3 h-3" /> : <Repeat className="w-3 h-3" />}
                      {activity.type === 'goal' ? 'Meta' : 'Rotina'}
                    </span>
                    <span>•</span>
                    <span>{activity.period}</span>
                    {activity.scheduled_time && (
                      <>
                        <span>•</span>
                        <span>{activity.scheduled_time.substring(0, 5)}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateActivity(activity.id, { is_active: !activity.is_active })}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      activity.is_active 
                        ? "text-slate-400 hover:text-orange-400 hover:bg-orange-500/10" 
                        : "text-green-400 bg-green-500/10 hover:bg-green-500/20"
                    )}
                    title={activity.is_active ? "Pausar atividade" : "Retomar atividade"}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit?.(activity)}
                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir esta atividade?')) {
                        deleteActivity(activity.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredActivities.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              Nenhuma atividade encontrada.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
