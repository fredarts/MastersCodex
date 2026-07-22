import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { toast } from 'sonner';

export const storageService = {
  /**
   * Uploads a file to the campaign-assets bucket in Supabase storage.
   * Throws an error if Supabase is not configured or if the upload fails.
   */
  async uploadAsset(file: File, folder: 'avatars' | 'scenes' | 'audio' = 'scenes'): Promise<string> {
    if (!isSupabaseConfigured()) {
      const errMsg = 'Supabase não está configurado. O upload de arquivo requer uma conexão ativa.';
      toast.error(errMsg);
      throw new Error(errMsg);
    }

    const fileExt = file.name.split('.').pop();
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const fileName = `${Date.now()}-${uniqueId}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from('campaign-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      toast.error(`Falha no upload do arquivo: ${error.message}`);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from('campaign-assets')
      .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      const errMsg = 'Não foi possível obter a URL pública para o asset enviado.';
      toast.error(errMsg);
      throw new Error(errMsg);
    }

    toast.success('Arquivo enviado com sucesso!');
    return publicUrlData.publicUrl;
  },
};
