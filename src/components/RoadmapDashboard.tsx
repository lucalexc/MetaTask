import React, { useState } from 'react';
import { useRoadmap, Milestone } from '@/src/hooks/useRoadmap';
import RoadmapTimeline from './RoadmapTimeline';
import MilestoneDetailDrawer from './MilestoneDetailDrawer';
import TreasureModal from './TreasureModal';
import MilestoneModal from './MilestoneModal';
import { Compass, Loader2 } from 'lucide-react';

export default function RoadmapDashboard() {
  const { roadmap, milestones, isLoading, addMilestone, updateMilestone, updateRoadmap } = useRoadmap();
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [isTreasureModalOpen, setIsTreasureModalOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [newMilestoneOrderIndex, setNewMilestoneOrderIndex] = useState(0);

  const handleAddMilestoneClick = (orderIndex: number) => {
    setNewMilestoneOrderIndex(orderIndex);
    setIsMilestoneModalOpen(true);
  };

  const handleSaveMilestone = async (title: string, icon: string, targetDate: string) => {
    await addMilestone({
      title,
      status: 'pending',
      order_index: newMilestoneOrderIndex,
      icon,
      target_date: targetDate
    });
  };

  const handleSaveTreasure = async (title: string) => {
    await updateRoadmap({ title });
  };

  const handleMilestoneClick = (milestone: Milestone) => {
    console.log('Milestone clicked:', milestone);
    setSelectedMilestone(milestone);
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
          onMilestoneClick={handleMilestoneClick}
          onAddMilestone={handleAddMilestoneClick}
          onTreasureClick={() => setIsTreasureModalOpen(true)}
        />
      </div>

      <MilestoneDetailDrawer
        milestone={selectedMilestone}
        isOpen={!!selectedMilestone}
        onClose={() => setSelectedMilestone(null)}
        onUpdate={updateMilestone}
      />

      <TreasureModal
        isOpen={isTreasureModalOpen}
        onClose={() => setIsTreasureModalOpen(false)}
        currentTitle={roadmap?.title || 'Seu Roadmap'}
        onSave={handleSaveTreasure}
      />

      <MilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        onSave={handleSaveMilestone}
      />
    </div>
  );
}
