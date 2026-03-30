import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Roadmap } from '@/src/types/roadmap';

export interface UseRoadmapsReturn {
  activeRoadmap: Roadmap | null;
  loading: boolean;
  updateRoadmap: (id: string, data: Partial<Roadmap>) => Promise<void>;
}

export function useRoadmaps(): UseRoadmapsReturn {
  const [activeRoadmap, setActiveRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoadmaps = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
        
      if (data) {
        setActiveRoadmap(data);
      } else {
        // Auto-create if not exists
        const { data: newRoadmap, error: createError } = await supabase
          .from('roadmaps')
          .insert({ 
            user_id: user.id, 
            title: 'Meu Roadmap de Vida', 
            icon: '🗺️', 
            color: '#3B82F6' 
          })
          .select()
          .single();
          
        if (!createError && newRoadmap) {
          setActiveRoadmap(newRoadmap);
        }
      }
      setLoading(false);
    };
    fetchRoadmaps();
  }, []);

  const updateRoadmap = async (id: string, data: Partial<Roadmap>) => {
    const { error } = await supabase.from('roadmaps').update(data).eq('id', id);
    if (error) {
      alert('Erro ao atualizar roadmap');
      return;
    }
    if (activeRoadmap?.id === id) {
      setActiveRoadmap(prev => prev ? { ...prev, ...data } : null);
    }
  };

  return { activeRoadmap, loading, updateRoadmap };
}
