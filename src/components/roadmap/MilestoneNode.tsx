import React from 'react';
import { Check } from 'lucide-react';
import { Milestone } from '@/src/types/roadmap';
import { cn } from '@/src/lib/utils';

interface MilestoneNodeProps {
  milestone: Milestone;
  isSelected: boolean;
  onClick: () => void;
}

export default function MilestoneNode({ milestone, isSelected, onClick }: MilestoneNodeProps) {
  const isCompleted = milestone.status === 'completed';

  return (
    <div 
      className="flex flex-col items-center cursor-pointer group transition-transform duration-150 hover:scale-105"
      onClick={onClick}
    >
      <div 
        className={cn(
          "w-[52px] h-[52px] rounded-full flex items-center justify-center bg-white relative z-10 transition-all",
          isSelected ? "ring-2 ring-offset-2" : "shadow-sm"
        )}
        style={{ 
          borderColor: milestone.color || '#3B82F6',
          borderWidth: '2.5px',
          borderStyle: 'solid',
          ...(isSelected ? { '--tw-ring-color': milestone.color || '#3B82F6' } as React.CSSProperties : {})
        }}
      >
        <span className="text-2xl">{milestone.icon || '📍'}</span>
        
        {isCompleted && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
        )}
      </div>
      
      <div className="mt-2 flex flex-col items-center w-28 text-center">
        <span className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight">
          {milestone.title}
        </span>
        {milestone.target_date && (
          <span className="text-[10px] text-gray-500 mt-0.5">
            {new Date(milestone.target_date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('. de ', ' ')}
          </span>
        )}
      </div>
    </div>
  );
}
