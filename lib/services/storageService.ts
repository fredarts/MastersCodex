import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const storageService = {
  /**
   * Uploads a file to the campaign-assets bucket in Supabase storage.
   * Throws an error if Supabase is not configured or if the upload fails.
   */
  async uploadAsset(file: File, folder: 'avatars' | 'scenes' | 'audio' = 'scenes'): Promise<string> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Upload requires a connected database.');
    }

    const fileExt = file.name.split('.').pop();
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const fileName = `${Date.now()}-${uniqueId}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('campaign-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from('campaign-assets')
      .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('Could not obtain public URL for uploaded asset.');
    }

    return publicUrlData.publicUrl;
  },
};
