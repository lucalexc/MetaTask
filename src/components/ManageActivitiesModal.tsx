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
  const { activities, updateActivity, deleteActivity, refresh } = useActivities(new Date(), true);
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
        className="relative w-full max-w-2xl max-h-[80vh] flex flex-col bg-white border border-[#E8E8E8] rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-[#E8E8E8] shrink-0">
          <div>
            <h2 className="text-xl font-bold text-[#1A1A1A]">Gerenciar Atividades</h2>
            <p className="text-sm text-gray-500 mt-1">Edite, pause ou exclua suas rotinas e metas</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b border-[#E8E8E8] flex gap-2 shrink-0">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-colors",
              filter === 'all' ? "bg-gray-100 text-[#1A1A1A]" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('routine')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-colors",
              filter === 'routine' ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            Rotinas
          </button>
          <button
            onClick={() => setFilter('goal')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-colors",
              filter === 'goal' ? "bg-purple-50 text-purple-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
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
                    ? "bg-white border-[#E8E8E8]" 
                    : "bg-gray-50 border-gray-100 opacity-60"
                )}
              >
                <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                  <GripVertical className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[#1A1A1A] truncate">{activity.name}</h4>
                    {!activity.is_active && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Pausada</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      {activity.type === 'goal' ? <Target className="w-3 h-3" /> : <Repeat className="w-3 h-3" />}
                      {activity.type === 'goal' ? 'Meta' : 'Rotina'}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{activity.period}</span>
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
                        ? "text-gray-400 hover:text-orange-600 hover:bg-orange-50" 
                        : "text-green-600 bg-green-50 hover:bg-green-100"
                    )}
                    title={activity.is_active ? "Pausar atividade" : "Retomar atividade"}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(activity)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      deleteActivity(activity.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredActivities.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              Nenhuma atividade encontrada.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
