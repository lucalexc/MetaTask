import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  onEdit: (activity: Activity) => void;
}) {
  const { activities, updateActivity, deleteActivity } = useActivities(new Date(), true);
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
        className="absolute inset-0 bg-black/40"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl max-h-[80vh] flex flex-col bg-white rounded-2xl shadow-xl p-6 text-gray-900 overflow-hidden"
      >
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900">Gerenciar Atividades</h2>
            <p className="text-sm font-medium text-gray-500 mt-1">Edite, pause ou exclua suas rotinas e metas</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex gap-2 mb-8 shrink-0 bg-gray-50 p-1.5 rounded-2xl">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              filter === 'all' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
            )}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('routine')}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              filter === 'routine' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
            )}
          >
            Rotinas
          </button>
          <button
            onClick={() => setFilter('goal')}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              filter === 'goal' ? "bg-white text-purple-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
            )}
          >
            Metas
          </button>
        </div>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          <div className="flex flex-col">
            <AnimatePresence mode="popLayout">
              {filteredActivities.map(activity => (
                <motion.div
                  key={activity.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "flex items-center gap-4 py-4 border-b border-gray-100 transition-all hover:bg-gray-50/50 group",
                    !activity.is_active && "opacity-50 grayscale"
                  )}
                >
                  <div className="cursor-grab active:cursor-grabbing text-gray-200 group-hover:text-gray-400 transition-colors">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900 truncate">{activity.name}</h4>
                      {!activity.is_active && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">Pausada</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
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

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateActivity(activity.id, { is_active: !activity.is_active })}
                      className={cn(
                        "p-2.5 rounded-xl transition-all",
                        activity.is_active 
                          ? "text-gray-400 hover:text-orange-600 hover:bg-orange-50" 
                          : "text-green-600 bg-green-50 hover:bg-green-100"
                      )}
                      title={activity.is_active ? "Pausar atividade" : "Retomar atividade"}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(activity)}
                      className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Tem certeza que deseja excluir esta atividade?')) {
                          deleteActivity(activity.id);
                        }
                      }}
                      className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {filteredActivities.length === 0 && (
            <div className="text-center py-24">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-gray-200" />
              </div>
              <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Nenhuma atividade encontrada</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
