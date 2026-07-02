import { supabase, uploadBase64Image } from '../lib/supabaseClient';
import { CollectionItem, TShirtConfig } from '../types';

// Public: Only fetch approved items
export const getCollection = async (): Promise<CollectionItem[]> => {
  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .eq('approved', true) // FILTER: Only approved items
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    console.error('Error fetching gallery:', error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    name: item.name,
    config: item.config,
    createdAt: item.created_at,
    approved: item.approved
  }));
};

// Admin: Fetch ALL items (pending and approved)
export const getAdminCollection = async (): Promise<CollectionItem[]> => {
  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching admin gallery:', error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    name: item.name,
    config: item.config,
    createdAt: item.created_at,
    approved: item.approved
  }));
};

const processConfigImages = async (config: TShirtConfig): Promise<TShirtConfig> => {
  const processedConfig = { ...config };
  
  // Upload Snapshot
  if (processedConfig.snapshotUrl && processedConfig.snapshotUrl.startsWith('data:')) {
    const snapshotUrl = await uploadBase64Image(processedConfig.snapshotUrl, 'renders');
    if (snapshotUrl) processedConfig.snapshotUrl = snapshotUrl;
  }

  // Upload Layers
  const processedLayers = await Promise.all(processedConfig.layers.map(async (layer) => {
    let textureUrl = layer.textureUrl;
    let originalUrl = layer.originalUrl;

    if (textureUrl.startsWith('data:')) {
      const url = await uploadBase64Image(textureUrl, 'uploads');
      if (url) textureUrl = url;
    }

    if (originalUrl && originalUrl.startsWith('data:')) {
      const url = await uploadBase64Image(originalUrl, 'uploads');
      if (url) originalUrl = url;
    }

    return { ...layer, textureUrl, originalUrl };
  }));

  processedConfig.layers = processedLayers;
  return processedConfig;
};

export const saveDesignToCollection = async (name: string, config: TShirtConfig): Promise<CollectionItem | null> => {
  try {
    // 1. Prepare Config: Upload all base64 images to Supabase and replace with URLs
    const processedConfig = await processConfigImages(config);

    // 2. Insert into Database (approved defaults to false in DB or implicitly null which we treat as false)
    const { data, error } = await supabase
      .from('gallery')
      .insert([
        { name, config: processedConfig, approved: false }
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      config: data.config,
      createdAt: data.created_at,
      approved: data.approved
    };

  } catch (error) {
    console.error("Supabase Save Error:", error);
    throw error;
  }
};

export const approveDesign = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('gallery')
        .update({ approved: true })
        .eq('id', id);
    
    if (error) {
        console.error("Error approving design:", error);
        return false;
    }
    return true;
};

export const updateGalleryItem = async (id: string, name: string, approved: boolean, config: TShirtConfig): Promise<boolean> => {
    try {
        const processedConfig = await processConfigImages(config);
        const { error } = await supabase
            .from('gallery')
            .update({ name, approved, config: processedConfig })
            .eq('id', id);

        if (error) {
            console.error("Error updating gallery item:", error);
            return false;
        }
        return true;
    } catch(err) {
        console.error("Error updating gallery item:", err);
        return false;
    }
};

export const deleteDesignFromCollection = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase
      .from('gallery')
      .delete()
      .eq('id', id);

    if (error) {
        console.error("Failed to delete design:", error);
        return { success: false, error: error.message };
    }
    return { success: true };
};