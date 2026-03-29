import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Roadmap } from '@/src/types/roadmap';

export interface UseRoadmapsReturn {
  roadmaps: Roadmap[];
  activeRoadmap: Roadmap | null;
  loading: boolean;
  selectRoadmap: (id: string) => void;
  createRoadmap: (title: string, icon?: string, color?: string) => Promise<void>;
  updateRoadmap: (id: string, data: Partial<Roadmap>) => Promise<void>;
  deleteRoadmap: (id: string) => Promise<void>;
}

export function useRoadmaps(): UseRoadmapsReturn {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [activeRoadmap, setActiveRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoadmaps = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: true });
        
      setRoadmaps(data || []);
      if (data && data.length > 0) setActiveRoadmap(data[0]);
      setLoading(false);
    };
    fetchRoadmaps();
  }, []);

  const selectRoadmap = (id: string) => {
    const found = roadmaps.find(r => r.id === id);
    if (found) setActiveRoadmap(found);
  };

  const createRoadmap = async (title: string, icon?: string, color?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('roadmaps')
      .insert({ user_id: user.id, title, icon: icon || '🗺️', color: color || '#3B82F6' })
      .select()
      .single();
      
    if (error) {
      alert('Erro ao criar roadmap');
      return;
    }
    setRoadmaps(prev => [...prev, data]);
    setActiveRoadmap(data);
  };

  const updateRoadmap = async (id: string, data: Partial<Roadmap>) => {
    const { error } = await supabase.from('roadmaps').update(data).eq('id', id);
    if (error) {
      alert('Erro ao atualizar roadmap');
      return;
    }
    setRoadmaps(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    if (activeRoadmap?.id === id) {
      setActiveRoadmap(prev => prev ? { ...prev, ...data } : null);
    }
  };

  const deleteRoadmap = async (id: string) => {
    if (!window.confirm("Tem certeza? Todas as estações e itens serão removidos.")) return;
    
    await supabase.from('roadmaps').delete().eq('id', id);
    setRoadmaps(prev => {
      const filtered = prev.filter(r => r.id !== id);
      if (activeRoadmap?.id === id) {
        setActiveRoadmap(filtered[0] || null);
      }
      return filtered;
    });
  };

  return { roadmaps, activeRoadmap, loading, selectRoadmap, createRoadmap, updateRoadmap, deleteRoadmap };
}
