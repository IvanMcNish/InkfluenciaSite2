import { CollectionItem, TShirtConfig } from '../types';

const GALLERY_KEY = 'inkfluencia_gallery';

export const getCollection = (): CollectionItem[] => {
  try {
    const stored = localStorage.getItem(GALLERY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

export const saveDesignToCollection = (name: string, config: TShirtConfig): CollectionItem => {
  const currentCollection = getCollection();
  
  const newItem: CollectionItem = {
    id: Math.random().toString(36).substr(2, 9),
    name,
    config,
    createdAt: new Date().toISOString()
  };

  const updatedCollection = [newItem, ...currentCollection];
  localStorage.setItem(GALLERY_KEY, JSON.stringify(updatedCollection));
  
  return newItem;
};

export const deleteDesignFromCollection = (id: string): CollectionItem[] => {
    const currentCollection = getCollection();
    const updatedCollection = currentCollection.filter(item => item.id !== id);
    localStorage.setItem(GALLERY_KEY, JSON.stringify(updatedCollection));
    return updatedCollection;
};