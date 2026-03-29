import { useState } from 'react';
import { supabase } from '@/src/lib/supabase';

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File, type: string): Promise<string | null> => {
    if (!file) return null;
    if (file.size > 5 * 1024 * 1024) { alert('Imagem deve ter no máximo 5MB'); return null; }
    if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) { alert('Formato inválido'); return null; }

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const ext = file.name.split('.').pop();
    const path = `${user!.id}/${type}_${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from('journey-images').upload(path, file);
    if (error) { setUploading(false); alert('Erro no upload'); return null; }

    const { data } = supabase.storage.from('journey-images').getPublicUrl(path);
    setUploading(false);
    return data.publicUrl;
  };

  return { upload, uploading };
}
