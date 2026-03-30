import React, { useMemo, useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { Milestone } from '@/src/types/roadmap';
import MilestoneNode from './MilestoneNode';
import { cn } from '@/src/lib/utils';

interface RoadmapTimelineProps {
  milestones: Milestone[];
  selectedMilestoneId: string | null;
  onSelectMilestone: (m: Milestone) => void;
  onAddMilestone: (data: { title: string; icon?: string }) => void;
}

const EMOJI_OPTIONS = ['📍', '🎯', '💼', '💰', '🏠', '🎓', '✈️', '💪', '🚗', '💎'];

export default function RoadmapTimeline({ milestones, selectedMilestoneId, onSelectMilestone, onAddMilestone }: RoadmapTimelineProps) {
  const [addingAtIndex, setAddingAtIndex] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newIcon, setNewIcon] = useState('📍');

  const NODE_SPACING = 180;
  const AMPLITUDE = 35;
  const CENTER_Y = 200;
  const START_X = 100;

  const points = useMemo(() => {
    const pts = [];
    pts.push({ x: START_X, y: CENTER_Y, type: 'start' });
    
    milestones.forEach((m, i) => {
      const isOdd = i % 2 === 0;
      pts.push({
        x: START_X + (i + 1) * NODE_SPACING,
        y: CENTER_Y + (isOdd ? -AMPLITUDE : AMPLITUDE),
        type: 'milestone',
        data: m
      });
    });
    return pts;
  }, [milestones]);

  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = curr.x - (curr.x - prev.x) / 2;
      const cp2y = curr.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }
    // Extend path a bit after last node
    const last = points[points.length - 1];
    d += ` L ${last.x + 100} ${last.y}`;
    return d;
  }, [points]);

  const totalWidth = Math.max((milestones.length + 2) * NODE_SPACING, 600);

  const handleSaveNew = () => {
    if (newTitle.trim()) {
      onAddMilestone({ title: newTitle.trim(), icon: newIcon });
    }
    setAddingAtIndex(null);
    setNewTitle('');
    setNewIcon('📍');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveNew();
    if (e.key === 'Escape') setAddingAtIndex(null);
  };

  return (
    <div className="w-full flex-1 min-h-[500px] overflow-x-auto overflow-y-hidden custom-scrollbar relative bg-transparent">
      {milestones.length === 0 && addingAtIndex === null ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 z-0">
          <p>Clique em + para adicionar sua primeira estação</p>
        </div>
      ) : null}

      <div className="absolute top-4 right-6 z-30">
        <button
          onClick={() => setAddingAtIndex(milestones.length)}
          className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors shadow-sm border border-blue-200"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="relative h-[400px] min-h-full flex items-center" style={{ width: totalWidth }}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <path
            d={pathD}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="3"
            strokeDasharray="6 6"
          />
        </svg>

        {/* Start Node */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
          style={{ left: START_X, top: CENTER_Y }}
        >
          <div className="w-[52px] h-[52px] rounded-full bg-slate-800 text-white flex items-center justify-center shadow-md border-2 border-slate-700">
            <MapPin className="w-6 h-6" />
          </div>
          <span className="mt-2 font-bold text-slate-800 text-xs">Hoje</span>
        </div>

        {/* Add buttons between nodes */}
        {points.map((pt, i) => {
          if (i === 0) return null;
          const prev = points[i - 1];
          const midX = prev.x + (pt.x - prev.x) / 2;
          const midY = prev.y + (pt.y - prev.y) / 2;

          return (
            <div
              key={`add-${i}`}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 opacity-0 hover:opacity-100 transition-opacity"
              style={{ left: midX, top: midY }}
            >
              <button
                onClick={() => setAddingAtIndex(i - 1)}
                className="w-8 h-8 rounded-full bg-white border border-blue-500 text-blue-600 flex items-center justify-center hover:bg-blue-50 hover:scale-110 transition-all shadow-sm"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          );
        })}

        {/* Milestone Nodes */}
        {points.filter(p => p.type === 'milestone').map((pt, i) => {
          const m = pt.data as Milestone;
          return (
            <div
              key={m.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: pt.x, top: pt.y }}
            >
              <MilestoneNode
                milestone={m}
                isSelected={selectedMilestoneId === m.id}
                onClick={() => onSelectMilestone(m)}
              />
            </div>
          );
        })}

        {/* Inline Add Form */}
        {addingAtIndex !== null && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-40 bg-white p-3 rounded-xl shadow-xl border border-gray-100 w-64"
            style={{ 
              left: START_X + (addingAtIndex + 1) * NODE_SPACING, 
              top: CENTER_Y 
            }}
          >
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Título da estação..."
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
            <div className="flex flex-wrap gap-1 mb-3">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setNewIcon(emoji)}
                  className={cn(
                    "w-8 h-8 rounded flex items-center justify-center text-lg hover:bg-gray-100 transition-colors",
                    newIcon === emoji ? "bg-blue-50 border border-blue-200" : ""
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setAddingAtIndex(null)} className="text-xs px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded">Cancelar</button>
              <button onClick={handleSaveNew} disabled={!newTitle.trim()} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">Salvar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
