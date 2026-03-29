import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/lib/AuthContext';

export interface Roadmap {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}

export interface Milestone {
  id: string;
  roadmap_id: string;
  title: string;
  description?: string;
  target_date?: string;
  status: 'pending' | 'in_progress' | 'completed';
  icon?: string;
  image_url?: string;
  order_index: number;
  created_at: string;
}

export interface Desire {
  id: string;
  milestone_id: string;
  name: string;
  category?: string;
  estimated_cost?: number;
  is_completed: boolean;
  created_at: string;
}

export function useRoadmap() {
  const { session } = useAuth();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.user.id) return;
    fetchRoadmap();
  }, [session?.user.id]);

  const fetchRoadmap = async () => {
    try {
      setIsLoading(true);
      // Fetch roadmap
      let { data: roadmaps, error } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('user_id', session!.user.id)
        .order('created_at', { ascending: true })
        .limit(1);

      if (error) throw error;

      let currentRoadmap = roadmaps?.[0];

      // If no roadmap, create default
      if (!currentRoadmap) {
        const { data: newRoadmap, error: insertError } = await supabase
          .from('roadmaps')
          .insert([{ user_id: session!.user.id, title: 'Meu Roadmap de Vida' }])
          .select()
          .single();
          
        if (insertError) throw insertError;
        currentRoadmap = newRoadmap;
      }

      setRoadmap(currentRoadmap);

      // Fetch milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .eq('roadmap_id', currentRoadmap.id)
        .order('order_index', { ascending: true });

      if (milestonesError) throw milestonesError;
      setMilestones(milestonesData || []);

    } catch (error) {
      console.error('Error fetching roadmap:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addMilestone = async (milestone: Partial<Milestone>) => {
    if (!roadmap) return;
    const { data, error } = await supabase
      .from('milestones')
      .insert([{ ...milestone, roadmap_id: roadmap.id }])
      .select()
      .single();
      
    if (error) {
      console.error('Error adding milestone:', error);
      return;
    }
    setMilestones([...milestones, data].sort((a, b) => a.order_index - b.order_index));
    return data;
  };

  const updateMilestone = async (id: string, updates: Partial<Milestone>) => {
    const { error } = await supabase
      .from('milestones')
      .update(updates)
      .eq('id', id);
      
    if (error) {
      console.error('Error updating milestone:', error);
      return;
    }
    setMilestones(milestones.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const updateRoadmap = async (updates: Partial<Roadmap>) => {
    if (!roadmap) return;
    const { error } = await supabase
      .from('roadmaps')
      .update(updates)
      .eq('id', roadmap.id);
      
    if (error) {
      console.error('Error updating roadmap:', error);
      return;
    }
    setRoadmap({ ...roadmap, ...updates });
  };

  return { roadmap, milestones, isLoading, addMilestone, updateMilestone, updateRoadmap, refresh: fetchRoadmap };
}

export function useMilestoneDesires(milestoneId: string | undefined) {
  const [desires, setDesires] = useState<Desire[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!milestoneId) {
      setDesires([]);
      return;
    }
    fetchDesires();
  }, [milestoneId]);

  const fetchDesires = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('desires')
      .select('*')
      .eq('milestone_id', milestoneId)
      .order('created_at', { ascending: true });
      
    if (!error && data) {
      setDesires(data);
    }
    setIsLoading(false);
  };

  const addDesire = async (desire: Partial<Desire>) => {
    const { data, error } = await supabase
      .from('desires')
      .insert([{ ...desire, milestone_id: milestoneId }])
      .select()
      .single();
    if (!error && data) {
      setDesires([...desires, data]);
    }
  };

  const updateDesire = async (id: string, updates: Partial<Desire>) => {
    const { error } = await supabase
      .from('desires')
      .update(updates)
      .eq('id', id);
    if (!error) {
      setDesires(desires.map(d => d.id === id ? { ...d, ...updates } : d));
    }
  };

  const deleteDesire = async (id: string) => {
    const { error } = await supabase.from('desires').delete().eq('id', id);
    if (!error) {
      setDesires(desires.filter(d => d.id !== id));
    }
  };

  return { desires, isLoading, addDesire, updateDesire, deleteDesire };
}
