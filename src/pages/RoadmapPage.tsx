import React from 'react';
import { useRoadmaps } from '@/src/hooks/useRoadmaps';
import { useMilestones } from '@/src/hooks/useMilestones';
import { useImageUpload } from '@/src/hooks/useImageUpload';
import RoadmapTimeline from '@/src/components/roadmap/RoadmapTimeline';
import MilestoneModal from '@/src/components/MilestoneModal';
import { Loader2 } from 'lucide-react';

export default function RoadmapPage({
  isCreateModalOpen,
  setIsCreateModalOpen
}: {
  isCreateModalOpen?: boolean;
  setIsCreateModalOpen?: (open: boolean) => void;
}) {
  const { activeRoadmap, loading, updateRoadmap } = useRoadmaps();
  const { 
    milestones, selectedMilestone, desires, 
    selectMilestone, addMilestone, updateMilestone, deleteMilestone, 
    addDesire, updateDesire, deleteDesire, toggleDesireAchieved 
  } = useMilestones(activeRoadmap?.id || null);
  const { upload, uploading } = useImageUpload();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#FCFAF8]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full w-full bg-[#FCFAF8] overflow-hidden">
      {/* Coluna Principal: Timeline */}
      <div className="flex-1 flex flex-col h-full bg-[#FCFAF8] overflow-hidden relative">
        {activeRoadmap ? (
          <>
            <div className="px-6 pt-6 pb-2 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{activeRoadmap.title}</h2>
            </div>
            <div className="flex-1 flex flex-col relative">
              <RoadmapTimeline
                milestones={milestones}
                selectedMilestoneId={selectedMilestone?.id || null}
                onSelectMilestone={selectMilestone}
                onAddMilestone={addMilestone}
                setIsCreateModalOpen={setIsCreateModalOpen}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Criando sua Visão de Vida...
          </div>
        )}
      </div>

      {/* Milestone Modal (Create & Edit) */}
      <MilestoneModal
        isOpen={!!isCreateModalOpen || !!selectedMilestone}
        onClose={() => {
          if (isCreateModalOpen) setIsCreateModalOpen?.(false);
          if (selectedMilestone) selectMilestone(null);
        }}
        milestone={selectedMilestone}
        desires={desires}
        onSave={async (data) => {
          if (selectedMilestone) {
            await updateMilestone(selectedMilestone.id, data);
          } else {
            await addMilestone(data);
          }
        }}
        onDelete={deleteMilestone}
        onAddDesire={addDesire}
        onDeleteDesire={deleteDesire}
        onToggleDesireAchieved={toggleDesireAchieved}
        onUploadImage={async (file) => {
          return await upload(file, 'milestone');
        }}
      />
    </div>
  );
}
