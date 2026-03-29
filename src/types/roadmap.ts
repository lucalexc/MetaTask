export interface Roadmap {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  roadmap_id: string;
  user_id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  image_url: string | null;
  target_date: string | null;
  completed_at: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Desire {
  id: string;
  milestone_id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: 'material' | 'experience' | 'achievement' | 'financial' | 'personal' | 'general';
  image_url: string | null;
  estimated_cost: number | null;
  is_achieved: boolean;
  achieved_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}
