import { useState, useEffect, useCallback } from 'react';
import {
  getCollection,
  getAdminCollection,
  approveDesign,
  updateGalleryItem,
  deleteDesignFromCollection,
} from '../services/galleryService';
import { CollectionItem, TShirtConfig } from '../types';

interface UseGalleryOptions {
  isAdmin?: boolean;
}

interface UseGalleryResult {
  items: CollectionItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  approve: (id: string) => Promise<boolean>;
  update: (id: string, name: string, approved: boolean, config: TShirtConfig) => Promise<boolean>;
  remove: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export const useGallery = ({ isAdmin = false }: UseGalleryOptions = {}): UseGalleryResult => {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = isAdmin ? await getAdminCollection() : await getCollection();
      setItems(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar la galería';
      setError(message);
      console.error('[useGallery]', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Aprueba un diseño y actualiza su estado localmente
  const approve = useCallback(async (id: string): Promise<boolean> => {
    const success = await approveDesign(id);
    if (success) {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, approved: true } : item)));
    }
    return success;
  }, []);

  // Actualiza nombre, estado y config de un item y refresca si tiene éxito
  const update = useCallback(
    async (id: string, name: string, approved: boolean, config: TShirtConfig): Promise<boolean> => {
      const success = await updateGalleryItem(id, name, approved, config);
      if (success) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, name, approved, config } : item))
        );
      }
      return success;
    },
    []
  );

  // Elimina un diseño y lo quita de la lista local
  const remove = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      const result = await deleteDesignFromCollection(id);
      if (result.success) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
      return result;
    },
    []
  );

  return { items, loading, error, refresh, approve, update, remove };
};
