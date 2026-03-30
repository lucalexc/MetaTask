import { useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { toast } from 'sonner';

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File, type: string): Promise<string | null> => {
    if (!file) return null;
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 5MB'); return null; }
    if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) { toast.error('Formato inválido'); return null; }

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const ext = file.name.split('.').pop();
    const path = `${user!.id}/${type}_${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from('roadmap-images').upload(path, file);
    if (error) { setUploading(false); toast.error(error.message || 'Erro ao enviar a imagem'); return null; }

    const { data } = supabase.storage.from('roadmap-images').getPublicUrl(path);
    setUploading(false);
    return data.publicUrl;
  };

  return { upload, uploading };
}
