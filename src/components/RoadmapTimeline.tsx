import React, { useMemo } from 'react';
import { Check, MapPin, Plus, Star } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Milestone } from '@/src/hooks/useRoadmap';

interface RoadmapTimelineProps {
  milestones: Milestone[];
  onMilestoneClick: (milestone: Milestone) => void;
  onAddMilestone: (orderIndex: number) => void;
  onTreasureClick: () => void;
}

export default function RoadmapTimeline({ milestones, onMilestoneClick, onAddMilestone, onTreasureClick }: RoadmapTimelineProps) {
  const NODE_SPACING = 300;
  const AMPLITUDE = 120;
  const CENTER_Y = 250;
  const START_X = 150;

  const points = useMemo(() => {
    const pts = [];
    // Start node (Hoje)
    pts.push({ x: START_X, y: CENTER_Y, type: 'start' });
    
    // Milestones
    milestones.forEach((m, i) => {
      const isOdd = i % 2 === 0; // 0 is first milestone -> odd visually
      pts.push({
        x: START_X + (i + 1) * NODE_SPACING,
        y: CENTER_Y + (isOdd ? -AMPLITUDE : AMPLITUDE),
        type: 'milestone',
        data: m
      });
    });

    // End node (Objetivo Final)
    pts.push({
      x: START_X + (milestones.length + 1) * NODE_SPACING,
      y: CENTER_Y,
      type: 'end'
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
    return d;
  }, [points]);

  const totalWidth = START_X + (milestones.length + 1) * NODE_SPACING + 200;

  return (
    <div className="w-full h-full overflow-x-auto overflow-y-hidden custom-scrollbar relative bg-[#FCFAF8]">
      <div className="relative h-[500px] min-h-full flex items-center" style={{ width: totalWidth }}>
        {/* SVG Path */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <path
            d={pathD}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="4"
            strokeDasharray="8 8"
            className="transition-all duration-500"
          />
        </svg>

        {/* Nodes */}
        {points.map((pt, i) => {
          if (pt.type === 'start') {
            return (
              <div
                key="start"
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: pt.x, top: pt.y }}
              >
                <div className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-lg z-10">
                  <MapPin className="w-6 h-6" />
                </div>
                <span className="mt-3 font-bold text-slate-800 text-sm">Hoje</span>
              </div>
            );
          }

          if (pt.type === 'end') {
            return (
              <div
                key="end"
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer hover:scale-105 transition-transform duration-300"
                style={{ left: pt.x, top: pt.y }}
                onClick={onTreasureClick}
              >
                <div className="w-16 h-16 rounded-full bg-amber-400 text-amber-900 flex items-center justify-center shadow-lg shadow-amber-400/40 z-10 border-4 border-white">
                  <Star className="w-8 h-8 fill-current" />
                </div>
                <span className="mt-3 font-bold text-amber-600 text-sm uppercase tracking-wider">O Tesouro</span>
              </div>
            );
          }

          const m = pt.data as Milestone;
          const isCompleted = m.status === 'completed';
          const isInProgress = m.status === 'in_progress';
          const isPending = m.status === 'pending';

          return (
            <React.Fragment key={m.id}>
              {/* Add button before this node */}
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 opacity-0 hover:opacity-100 transition-opacity"
                style={{
                  left: points[i - 1].x + (pt.x - points[i - 1].x) / 2,
                  top: points[i - 1].y + (pt.y - points[i - 1].y) / 2,
                }}
              >
                <button
                  onClick={() => onAddMilestone(m.order_index)}
                  className="w-8 h-8 rounded-full bg-white border border-blue-500 text-blue-600 flex items-center justify-center hover:bg-blue-50 hover:scale-110 transition-all shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Milestone Node */}
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group z-10"
                style={{ left: pt.x, top: pt.y }}
                onClick={() => onMilestoneClick(m)}
              >
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 border-4 border-white",
                  isCompleted ? "bg-green-500 text-white shadow-md shadow-green-500/30" :
                  isInProgress ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50 scale-110 ring-4 ring-blue-100" :
                  "bg-white text-slate-400 border-slate-200 border-2 border-dashed shadow-sm group-hover:border-solid group-hover:border-blue-300 group-hover:text-blue-500 opacity-80 group-hover:opacity-100"
                )}>
                  {isCompleted ? <Check className="w-6 h-6" /> : <span className="text-xl">{m.icon || '🎯'}</span>}
                </div>
                <div className="mt-3 flex flex-col items-center w-32 text-center">
                  <span className={cn(
                    "font-bold text-sm line-clamp-2 transition-colors",
                    isCompleted ? "text-green-700" :
                    isInProgress ? "text-blue-700" :
                    "text-slate-600 group-hover:text-blue-600"
                  )}>
                    {m.title}
                  </span>
                  {m.target_date && (
                    <span className="text-xs text-slate-400 mt-1 font-medium">
                      {new Date(m.target_date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* Add button after last milestone */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 opacity-0 hover:opacity-100 transition-opacity"
          style={{
            left: points[points.length - 2].x + (points[points.length - 1].x - points[points.length - 2].x) / 2,
            top: points[points.length - 2].y + (points[points.length - 1].y - points[points.length - 2].y) / 2,
          }}
        >
          <button
            onClick={() => onAddMilestone(milestones.length > 0 ? milestones[milestones.length - 1].order_index + 1 : 0)}
            className="w-8 h-8 rounded-full bg-white border border-blue-500 text-blue-600 flex items-center justify-center hover:bg-blue-50 hover:scale-110 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
}
