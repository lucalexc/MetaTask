import React, { useState } from 'react';
import { useRoadmap, Milestone } from '@/src/hooks/useRoadmap';
import RoadmapTimeline from './RoadmapTimeline';
import MilestoneDetailDrawer from './MilestoneDetailDrawer';
import { Compass, Loader2 } from 'lucide-react';

export default function RoadmapDashboard() {
  const { roadmap, milestones, isLoading, addMilestone, updateMilestone } = useRoadmap();
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  const handleAddMilestone = async (orderIndex: number) => {
    const title = prompt('Nome do novo marco:');
    if (!title) return;
    
    await addMilestone({
      title,
      status: 'pending',
      order_index: orderIndex,
      icon: '🎯'
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FCFAF8]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#FCFAF8] h-full overflow-hidden">
      <header className="px-6 py-8 md:py-10 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
              {roadmap?.title || 'Seu Roadmap'}
            </h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base">
              Planeje e acompanhe as grandes conquistas da sua vida.
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden">
        <RoadmapTimeline
          milestones={milestones}
          onMilestoneClick={setSelectedMilestone}
          onAddMilestone={handleAddMilestone}
        />
      </div>

      <MilestoneDetailDrawer
        milestone={selectedMilestone}
        isOpen={!!selectedMilestone}
        onClose={() => setSelectedMilestone(null)}
        onUpdate={updateMilestone}
      />
    </div>
  );
}
