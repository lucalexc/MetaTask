import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Milestone, Desire } from '@/src/types/roadmap';

export interface UseMilestonesReturn {
  milestones: Milestone[];
  selectedMilestone: Milestone | null;
  desires: Desire[];
  loading: boolean;
  selectMilestone: (m: Milestone | null) => void;
  addMilestone: (data: Partial<Milestone>) => Promise<void>;
  updateMilestone: (id: string, data: Partial<Milestone>) => Promise<void>;
  deleteMilestone: (id: string) => Promise<void>;
  addDesire: (data: { title: string; category?: string; estimated_cost?: number }) => Promise<void>;
  updateDesire: (id: string, data: Partial<Desire>) => Promise<void>;
  deleteDesire: (id: string) => Promise<void>;
  toggleDesireAchieved: (id: string) => Promise<void>;
}

export function useMilestones(roadmapId: string | null): UseMilestonesReturn {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [desires, setDesires] = useState<Desire[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMilestones = async () => {
      if (!roadmapId) { 
        setMilestones([]); 
        setSelectedMilestone(null);
        setLoading(false);
        return; 
      }
      setLoading(true);
      const { data } = await supabase
        .from('milestones')
        .select('*')
        .eq('roadmap_id', roadmapId)
        .order('position', { ascending: true });
        
      setMilestones(data || []);
      setSelectedMilestone(null);
      setLoading(false);
    };
    fetchMilestones();
  }, [roadmapId]);

  const selectMilestone = async (milestone: Milestone | null) => {
    setSelectedMilestone(milestone);
    if (!milestone) { 
      setDesires([]); 
      return; 
    }
    const { data } = await supabase
      .from('desires')
      .select('*')
      .eq('milestone_id', milestone.id)
      .order('position', { ascending: true });
    setDesires(data || []);
  };

  const addMilestone = async (data: Partial<Milestone>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !roadmapId) return;
    
    const newPosition = milestones.length;
    const { data: created, error } = await supabase.from('milestones').insert({
      roadmap_id: roadmapId, 
      user_id: user.id,
      title: data.title, 
      icon: data.icon || '📍', 
      color: data.color || '#3B82F6',
      target_date: data.target_date || null, 
      status: data.status || 'pending',
      description: data.description || null,
      image_url: data.image_url || null,
      position: newPosition
    }).select().single();
    
    if (error) {
      alert('Erro ao adicionar estação');
      return;
    }
    setMilestones(prev => [...prev, created]);
  };

  const updateMilestone = async (id: string, data: Partial<Milestone>) => {
    const { error } = await supabase.from('milestones').update(data).eq('id', id);
    if (error) {
      alert('Erro ao atualizar estação');
      return;
    }
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
    if (selectedMilestone?.id === id) {
      setSelectedMilestone(prev => prev ? { ...prev, ...data } : null);
    }
  };

  const deleteMilestone = async (id: string) => {
    await supabase.from('milestones').delete().eq('id', id);
    let updated = milestones.filter(m => m.id !== id);
    
    if (selectedMilestone?.id === id) setSelectedMilestone(null);
    
    // Reajustar positions
    updated = updated.map((m, idx) => ({ ...m, position: idx }));
    for (const m of updated) { 
      await supabase.from('milestones').update({ position: m.position }).eq('id', m.id);
    }
    setMilestones(updated);
  };

  const addDesire = async (data: { title: string; category?: string; estimated_cost?: number }) => {
    if (!selectedMilestone) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data: created, error } = await supabase.from('desires').insert({
      milestone_id: selectedMilestone.id, 
      user_id: user.id,
      title: data.title, 
      category: data.category || 'general',
      estimated_cost: data.estimated_cost || null,
      position: desires.length
    }).select().single();
    
    if (error) {
      alert('Erro ao adicionar item');
      return;
    }
    setDesires(prev => [...prev, created]);
  };

  const updateDesire = async (id: string, data: Partial<Desire>) => {
    const { error } = await supabase.from('desires').update(data).eq('id', id);
    if (error) {
      alert('Erro ao atualizar item');
      return;
    }
    setDesires(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
  };

  const deleteDesire = async (id: string) => {
    const { error } = await supabase.from('desires').delete().eq('id', id);
    if (error) {
      alert('Erro ao deletar item');
      return;
    }
    setDesires(prev => prev.filter(d => d.id !== id));
  };

  const toggleDesireAchieved = async (id: string) => {
    const desire = desires.find(d => d.id === id);
    if (!desire) return;
    
    const newValue = !desire.is_achieved;
    const { error } = await supabase.from('desires').update({
      is_achieved: newValue,
      achieved_at: newValue ? new Date().toISOString() : null
    }).eq('id', id);
    
    if (error) {
      alert('Erro ao atualizar status do item');
      return;
    }
    setDesires(prev => prev.map(d => d.id === id ? { ...d, is_achieved: newValue } : d));
  };

  return { 
    milestones, selectedMilestone, desires, loading, 
    selectMilestone, addMilestone, updateMilestone, deleteMilestone, 
    addDesire, updateDesire, deleteDesire, toggleDesireAchieved 
  };
}
