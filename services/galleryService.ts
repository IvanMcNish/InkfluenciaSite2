import { supabase, uploadBase64Image } from '../lib/supabaseClient';
import { CollectionItem, TShirtConfig } from '../types';

export const getCollection = async (): Promise<CollectionItem[]> => {
  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching gallery:', error);
    return [];
  }

  // Map database fields to our TypeScript interface
  return data.map((item: any) => ({
    id: item.id,
    name: item.name,
    config: item.config,
    createdAt: item.created_at
  }));
};

export const saveDesignToCollection = async (name: string, config: TShirtConfig): Promise<CollectionItem | null> => {
  try {
    // 1. Prepare Config: Upload all base64 images to Supabase and replace with URLs
    const processedConfig = { ...config };
    
    // Upload Snapshot
    if (processedConfig.snapshotUrl && processedConfig.snapshotUrl.startsWith('data:')) {
      const snapshotUrl = await uploadBase64Image(processedConfig.snapshotUrl, 'snapshots');
      if (snapshotUrl) processedConfig.snapshotUrl = snapshotUrl;
    }

    // Upload Layers
    const processedLayers = await Promise.all(processedConfig.layers.map(async (layer) => {
      if (layer.textureUrl.startsWith('data:')) {
        const textureUrl = await uploadBase64Image(layer.textureUrl, 'layers');
        return { ...layer, textureUrl: textureUrl || layer.textureUrl };
      }
      return layer;
    }));
    processedConfig.layers = processedLayers;

    // 2. Insert into Database
    const { data, error } = await supabase
      .from('gallery')
      .insert([
        { name, config: processedConfig }
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      config: data.config,
      createdAt: data.created_at
    };

  } catch (error) {
    console.error("Supabase Save Error:", error);
    throw error;
  }
};

export const deleteDesignFromCollection = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('gallery')
      .delete()
      .eq('id', id);

    if (error) {
        console.error("Failed to delete design:", error);
        return false;
    }
    return true;
};