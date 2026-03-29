import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, icon: string, targetDate: string) => void;
}

export default function MilestoneModal({ isOpen, onClose, onSave }: MilestoneModalProps) {
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [targetDate, setTargetDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setIcon('🎯');
      setTargetDate('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !icon.trim() || !targetDate) return;
    onSave(title, icon, targetDate);
    onClose();
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-[70] overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-[#202020] text-lg">Novo Marco</h3>
              <button onClick={onClose} className="p-2 text-[#808080] hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
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
              <div className="flex gap-4">
                <div className="space-y-2 w-24">
                  <label className="text-[13px] font-bold text-[#202020]">Ícone/Emoji</label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    maxLength={2}
                    className="w-full text-center text-xl bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2] transition-all duration-200"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <label className="text-[13px] font-bold text-[#202020]">Data Alvo</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] text-[#202020] focus:outline-none focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2] transition-all duration-200"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-[13px] font-bold text-[#808080] hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || !icon.trim() || !targetDate}
                  className="px-4 py-2 text-[13px] font-bold text-white bg-[#1f60c2] hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Criar Marco
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
