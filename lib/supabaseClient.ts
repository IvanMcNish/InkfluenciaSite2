import { createClient } from '@supabase/supabase-js';

// IMPORTANTE: Reemplaza estos valores con los de tu proyecto en Supabase
const SUPABASE_URL = 'https://kdddhfajdhwldgutzqbq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkZGRoZmFqZGh3bGRndXR6cWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwODkzNDUsImV4cCI6MjA4MTY2NTM0NX0.bZh_FHxLmsJy46lQSWgmpu-wo1kUgBo34QXFVugnAn4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to upload Base64 images to Supabase Storage
export const uploadBase64Image = async (base64Data: string, folder: string): Promise<string | null> => {
  try {
    // 1. Convert Base64 to Blob
    const base64Response = await fetch(base64Data);
    const blob = await base64Response.blob();
    
    // 2. Generate unique filename
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${blob.type.split('/')[1]}`;
    
    // 3. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('inkfluencia-images')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // 4. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('inkfluencia-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};