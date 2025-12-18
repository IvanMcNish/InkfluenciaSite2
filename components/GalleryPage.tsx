import React, { useEffect, useState } from 'react';
import { CollectionItem, TShirtConfig } from '../types';
import { getCollection, deleteDesignFromCollection } from '../services/galleryService';
import { Palette, Trash2, ArrowRight, Grid } from 'lucide-react';

interface GalleryPageProps {
  onUseDesign: (config: TShirtConfig) => void;
  onNavigateToCreator: () => void;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({ onUseDesign, onNavigateToCreator }) => {
  const [collection, setCollection] = useState<CollectionItem[]>([]);

  useEffect(() => {
    setCollection(getCollection());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Estás seguro de que deseas eliminar este diseño de la colección?')) {
        const updated = deleteDesignFromCollection(id);
        setCollection(updated);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
                <Grid className="w-6 h-6 text-purple-500" />
                <h1 className="text-3xl font-black text-gray-900 dark:text-white">Nuestra Colección</h1>
           </div>
           <p className="text-gray-500 dark:text-gray-400 max-w-xl">
             Explora los diseños exclusivos creados por la comunidad y el equipo de Inkfluencia. Elige tu favorito y hazlo realidad.
           </p>
        </div>
        <button 
           onClick={onNavigateToCreator}
           className="bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/40 px-6 py-3 rounded-full font-bold transition-colors flex items-center gap-2"
        >
            <Palette className="w-5 h-5" />
            Crear Nuevo Diseño
        </button>
      </div>

      {collection.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
           <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
           <h3 className="text-xl font-bold text-gray-600 dark:text-gray-400">Aún no hay diseños en la galería</h3>
           <p className="text-gray-400 mt-2 mb-8">Sé el primero en guardar una creación.</p>
           <button 
             onClick={onNavigateToCreator}
             className="bg-gradient-to-r from-purple-600 to-indigo-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-purple-500/25 transition-all"
           >
             Ir al Estudio de Diseño
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {collection.map((item) => (
             <div 
                key={item.id} 
                className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer relative"
                onClick={() => onUseDesign(item.config)}
             >
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                    {item.config.snapshotUrl ? (
                        <img 
                            src={item.config.snapshotUrl} 
                            alt={item.name} 
                            className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" 
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Palette className="w-12 h-12" />
                        </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <span className="bg-white text-black px-6 py-2 rounded-full font-bold flex items-center gap-2 transform scale-90 group-hover:scale-100 transition-transform">
                            Comprar Este <ArrowRight className="w-4 h-4" />
                        </span>
                    </div>

                    <button 
                        onClick={(e) => handleDelete(item.id, e)}
                        className="absolute top-2 right-2 p-2 bg-white/80 dark:bg-black/80 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-900/50"
                        title="Eliminar diseño"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="p-4">
                    <h3 className="font-bold text-lg mb-1 truncate">{item.name}</h3>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        <span className="capitalize px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-medium">
                            {item.config.color === 'white' ? 'Blanca' : 'Negra'}
                        </span>
                    </div>
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};