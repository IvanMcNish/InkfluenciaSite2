import { createClient } from '@supabase/supabase-js';

// IMPORTANTE: Reemplaza estos valores con los de tu proyecto en Supabase
const SUPABASE_URL = 'https://kdddhfajdhwldgutzqbq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkZGRoZmFqZGh3bGRndXR6cWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwODkzNDUsImV4cCI6MjA4MTY2NTM0NX0.bZh_FHxLmsJy46lQSWgmpu-wo1kUgBo34QXFVugnAn4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to upload Base64 images to Supabase Storage
export const uploadBase64Image = async (base64Data: string, folder: string): Promise<string | null> => {
  try {
    // 0. Check if it's already a URL (not base64)
    if (!base64Data.startsWith('data:')) {
        return base64Data;
    }

    // 1. Convert Base64 to Blob
    const base64Response = await fetch(base64Data);
    const blob = await base64Response.blob();
    
    // 2. Determine extension
    let extension = 'png'; // default
    if (blob.type) {
        const typeParts = blob.type.split('/');
        if (typeParts.length > 1) {
            extension = typeParts[1];
        }
    }
    
    // 3. Generate unique filename
    // Clean up the folder name to avoid double slashes
    const cleanFolder = folder.replace(/\/$/, '').replace(/^\//, '');
    const fileName = `${cleanFolder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
    
    console.log(`📤 Subiendo imagen a ${cleanFolder}...`);

    // 4. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('inkfluencia-images')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: blob.type || 'image/png'
      });

    if (error) {
      if (error.message.includes('row-level security')) {
        console.error("🚨 ERROR DE PERMISOS EN STORAGE: Debes ejecutar el SQL para crear las políticas en 'storage.objects'. Ve al Panel Admin > Configuración.");
      }
      throw error;
    }

    // 5. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('inkfluencia-images')
      .getPublicUrl(fileName);

    console.log('✅ Imagen subida exitosamente:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    // Return null to allow fallback to base64 storage (so the order isn't lost)
    return null;
  }
};