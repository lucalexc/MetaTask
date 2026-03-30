import React from 'react';
import { useRoadmaps } from '@/src/hooks/useRoadmaps';
import { useMilestones } from '@/src/hooks/useMilestones';
import { useImageUpload } from '@/src/hooks/useImageUpload';
import RoadmapSidebar from '@/src/components/roadmap/RoadmapSidebar';
import RoadmapTimeline from '@/src/components/roadmap/RoadmapTimeline';
import MilestoneDetailPanel from '@/src/components/roadmap/MilestoneDetailPanel';
import { Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export default function RoadmapPage() {
  const { roadmaps, activeRoadmap, loading, selectRoadmap, createRoadmap, updateRoadmap, deleteRoadmap } = useRoadmaps();
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
    <div className="flex h-full bg-[#FCFAF8] overflow-hidden">
      {/* Coluna 1: Sidebar de roadmaps */}
      <RoadmapSidebar
        roadmaps={roadmaps}
        activeRoadmapId={activeRoadmap?.id || null}
        onSelect={selectRoadmap}
        onCreate={(title) => createRoadmap(title)}
        onDelete={deleteRoadmap}
      />

      {/* Coluna 2: Timeline */}
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
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Selecione ou crie um roadmap para começar
          </div>
        )}
      </div>

      {/* Coluna 3: Detail panel */}
      <AnimatePresence>
        {selectedMilestone && (
          <MilestoneDetailPanel
            milestone={selectedMilestone}
            desires={desires}
            onClose={() => selectMilestone(null)}
            onUpdateMilestone={updateMilestone}
            onDeleteMilestone={deleteMilestone}
            onAddDesire={addDesire}
            onDeleteDesire={deleteDesire}
            onToggleDesireAchieved={toggleDesireAchieved}
            onUploadImage={async (file) => {
              const url = await upload(file, 'milestone');
              if (url) await updateMilestone(selectedMilestone.id, { image_url: url });
              return url;
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
