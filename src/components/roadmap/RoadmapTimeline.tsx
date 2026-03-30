import React, { useMemo } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { Milestone } from '@/src/types/roadmap';
import MilestoneNode from './MilestoneNode';

interface RoadmapTimelineProps {
  milestones: Milestone[];
  selectedMilestoneId: string | null;
  onSelectMilestone: (m: Milestone) => void;
  onAddMilestone?: (data: { title: string; icon?: string }) => void; // Kept for compatibility if needed, but we'll use modal
  setIsCreateModalOpen?: (open: boolean) => void;
}

export default function RoadmapTimeline({ 
  milestones, 
  selectedMilestoneId, 
  onSelectMilestone, 
  setIsCreateModalOpen
}: RoadmapTimelineProps) {
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

  return (
    <div className="w-full flex-1 min-h-[500px] overflow-x-auto overflow-y-hidden custom-scrollbar relative bg-transparent">
      {milestones.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 z-0">
          <p className="mb-4">Nenhuma estação criada ainda.</p>
          <button 
            onClick={() => setIsCreateModalOpen?.(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar primeira estação
          </button>
        </div>
      ) : null}

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
                onClick={() => setIsCreateModalOpen?.(true)}
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
      </div>
    </div>
  );
}
