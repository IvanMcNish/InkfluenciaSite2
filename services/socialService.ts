
import { supabase, uploadBase64Image } from '../lib/supabaseClient';
import { InstagramPost } from '../types';

// Fetch approved posts for the public page
export const getInstagramPosts = async (): Promise<InstagramPost[]> => {
  const { data, error } = await supabase
    .from('social_posts')
    .select('*')
    .eq('approved', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching social posts:', error);
    return [];
  }

  return mapDataToPosts(data);
};

// Fetch ALL posts for Admin (pending and approved)
export const getAdminSocialPosts = async (): Promise<InstagramPost[]> => {
    const { data, error } = await supabase
      .from('social_posts')
      .select('*')
      .order('created_at', { ascending: false });
  
    if (error) {
      console.error('Error fetching admin social posts:', error);
      return [];
    }
  
    return mapDataToPosts(data);
};

// Create a new post (User upload or Admin manual add)
export const createSocialPost = async (post: { username: string, imageUrl: string, caption: string, likes?: number, approved?: boolean }): Promise<boolean> => {
    try {
        let finalImageUrl = post.imageUrl;

        // If it's base64, upload it
        if (post.imageUrl.startsWith('data:')) {
            const uploaded = await uploadBase64Image(post.imageUrl, 'social');
            if (uploaded) finalImageUrl = uploaded;
        }

        const { error } = await supabase
            .from('social_posts')
            .insert([{
                username: post.username,
                image_url: finalImageUrl,
                caption: post.caption,
                likes: post.likes || 0,
                approved: post.approved || false // Default to false for users, true for admin usually
            }]);

        if (error) throw error;
        return true;
    } catch (e) {
        console.error("Error creating social post:", e);
        return false;
    }
};

export const updateSocialPostStatus = async (id: string, approved: boolean): Promise<boolean> => {
    const { error } = await supabase
        .from('social_posts')
        .update({ approved })
        .eq('id', id);

    if (error) {
        console.error("Error updating post status:", error);
        return false;
    }
    return true;
};

export const deleteSocialPost = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('social_posts')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("Error deleting post:", error);
        return false;
    }
    return true;
};

// Helper to map DB columns to TS Type
const mapDataToPosts = (data: any[]): InstagramPost[] => {
    return data.map((item) => ({
        id: item.id,
        username: item.username,
        userAvatar: item.user_avatar || `https://ui-avatars.com/api/?name=${item.username}&background=random`, // Fallback avatar
        imageUrl: item.image_url,
        likes: item.likes,
        caption: item.caption,
        timestamp: new Date(item.created_at).toLocaleDateString(),
        createdAt: item.created_at,
        approved: item.approved
    }));
};
