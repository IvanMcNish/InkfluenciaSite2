import { useState, useEffect, useCallback } from 'react';
import {
  getInstagramPosts,
  getAdminSocialPosts,
  updateSocialPostStatus,
  deleteSocialPost,
} from '../services/socialService';
import { InstagramPost } from '../types';

interface UseSocialPostsOptions {
  isAdmin?: boolean;
}

interface UseSocialPostsResult {
  posts: InstagramPost[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  updateStatus: (id: string, approved: boolean) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
}

export const useSocialPosts = ({ isAdmin = false }: UseSocialPostsOptions = {}): UseSocialPostsResult => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = isAdmin ? await getAdminSocialPosts() : await getInstagramPosts();
      setPosts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar publicaciones';
      setError(message);
      console.error('[useSocialPosts]', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Actualiza el estado de aprobación de un post y sincroniza localmente
  const updateStatus = useCallback(async (id: string, approved: boolean): Promise<boolean> => {
    const success = await updateSocialPostStatus(id, approved);
    if (success) {
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, approved } : p)));
    }
    return success;
  }, []);

  // Elimina un post y lo quita de la lista local
  const remove = useCallback(async (id: string): Promise<boolean> => {
    const success = await deleteSocialPost(id);
    if (success) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    }
    return success;
  }, []);

  return { posts, loading, error, refresh, updateStatus, remove };
};
