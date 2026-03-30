import React, { useState } from 'react';
import { Plus, MoreVertical, Trash2 } from 'lucide-react';
import { Roadmap } from '@/src/types/roadmap';
import { cn } from '@/src/lib/utils';

interface RoadmapSidebarProps {
  roadmaps: Roadmap[];
  activeRoadmapId: string | null;
  onSelect: (id: string) => void;
  onCreate: (title: string) => void;
  onDelete: (id: string) => void;
}

export default function RoadmapSidebar({ roadmaps, activeRoadmapId, onSelect, onCreate, onDelete }: RoadmapSidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onCreate(newTitle.trim());
    }
    setIsCreating(false);
    setNewTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsCreating(false);
      setNewTitle('');
    }
  };

  return (
    <aside className="w-60 md:w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
      <div className="p-4 flex items-center justify-between border-b border-gray-100">
        <h3 className="font-bold text-sm text-gray-800 tracking-wide">MEUS ROADMAPS</h3>
        <button 
          onClick={() => setIsCreating(true)}
          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {isCreating && (
          <form onSubmit={handleCreateSubmit} className="px-2 py-1.5 mb-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => { setIsCreating(false); setNewTitle(''); }}
              placeholder="Nome do roadmap..."
              className="w-full text-sm px-2 py-1.5 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
          </form>
        )}

        {roadmaps.length === 0 && !isCreating ? (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-gray-500 mb-3">Crie seu primeiro roadmap</p>
            <button 
              onClick={() => setIsCreating(true)}
              className="text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors"
            >
              Criar Roadmap
            </button>
          </div>
        ) : (
          roadmaps.map(roadmap => (
            <div 
              key={roadmap.id}
              className={cn(
                "group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors",
                activeRoadmapId === roadmap.id ? "bg-blue-50" : "hover:bg-gray-50"
              )}
              onClick={() => onSelect(roadmap.id)}
            >
              <div className="flex items-center gap-2 truncate">
                <div 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: roadmap.color || '#3B82F6' }}
                />
                <span className={cn(
                  "text-sm truncate",
                  activeRoadmapId === roadmap.id ? "font-medium text-blue-900" : "text-gray-700"
                )}>
                  {roadmap.title}
                </span>
              </div>
              
              <div className="relative shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === roadmap.id ? null : roadmap.id);
                  }}
                  className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-700 rounded transition-all"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                
                {menuOpenId === roadmap.id && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); }}
                    />
                    <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg border border-gray-100 z-20 py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(null);
                          onDelete(roadmap.id);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-3 h-3" />
                        Excluir
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-gray-100 text-xs text-gray-400 text-center">
        {roadmaps.length} {roadmaps.length === 1 ? 'roadmap' : 'roadmaps'}
      </div>
    </aside>
  );
}
