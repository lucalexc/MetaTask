import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit2, Trash2, Target, Repeat, GripVertical } from 'lucide-react';
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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl max-h-[80vh] flex flex-col bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-[26px] leading-[35px] font-bold text-[#202020] tracking-tight">Gerenciar Atividades</h2>
            <p className="text-[13px] text-[#808080] mt-1">Edite ou exclua suas rotinas e metas</p>
          </div>
          <button onClick={onClose} className="text-[#808080] hover:text-[#202020] transition-colors ease-out duration-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 flex gap-2 shrink-0">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-4 py-2 rounded-lg text-[13px] font-bold transition-colors ease-out duration-200",
              filter === 'all' ? "bg-gray-100 text-[#202020]" : "text-[#808080] hover:text-[#202020] hover:bg-gray-50"
            )}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('routine')}
            className={cn(
              "px-4 py-2 rounded-lg text-[13px] font-bold transition-colors ease-out duration-200",
              filter === 'routine' ? "bg-blue-50 text-[#1f60c2]" : "text-[#808080] hover:text-[#202020] hover:bg-gray-50"
            )}
          >
            Rotinas
          </button>
          <button
            onClick={() => setFilter('goal')}
            className={cn(
              "px-4 py-2 rounded-lg text-[13px] font-bold transition-colors ease-out duration-200",
              filter === 'goal' ? "bg-purple-50 text-purple-600" : "text-[#808080] hover:text-[#202020] hover:bg-gray-50"
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
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors ease-out duration-200"
              >
                <div className="cursor-grab active:cursor-grabbing text-[#808080] hover:text-[#202020]">
                  <GripVertical className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[#202020] truncate text-[13px] leading-[18px]">{activity.name}</h4>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-[#808080]">
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
                    onClick={() => onEdit?.(activity)}
                    className="p-2 text-[#808080] hover:text-[#1f60c2] hover:bg-blue-50 rounded-lg transition-colors ease-out duration-200"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir esta atividade?')) {
                        deleteActivity(activity.id);
                      }
                    }}
                    className="p-2 text-[#808080] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors ease-out duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredActivities.length === 0 && (
            <div className="text-center py-12 text-[#808080] text-[13px]">
              Nenhuma atividade encontrada.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
