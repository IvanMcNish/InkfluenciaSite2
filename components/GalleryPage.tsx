import React, { useEffect, useState } from 'react';
import { CollectionItem, TShirtConfig } from '../types';
import { getCollection } from '../services/galleryService';
import { Palette, Eye, Grid, X, ShoppingBag, Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { formatCurrency, PRICES } from '../constants';

interface GalleryPageProps {
  onUseDesign: (config: TShirtConfig) => void;
  onNavigateToCreator: () => void;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({ onUseDesign, onNavigateToCreator }) => {
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGallery = async () => {
      setIsLoading(true);
      const items = await getCollection();
      setCollection(items);
      setIsLoading(false);
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleBuy = () => {
    if (selectedItem) {
        onUseDesign(selectedItem.config);
    }
  };

  // Preview Modal
  const DesignModal = () => {
    if (!selectedItem) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            {/* Added max-h-[90vh] and overflow-y-auto for mobile scrolling. md:overflow-hidden keeps desktop clean. */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col md:flex-row relative border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto md:overflow-hidden">
                <button 
                    onClick={() => setSelectedItem(null)}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded-full transition-colors backdrop-blur-md"
                >
                    <X className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                </button>

                {/* Left: Image */}
                <div className="w-full md:w-1/2 bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-8 relative shrink-0 min-h-[300px]">
                    {selectedItem.config.snapshotUrl ? (
                        <img 
                            src={selectedItem.config.snapshotUrl} 
                            alt={selectedItem.name} 
                            className="w-full h-auto object-contain drop-shadow-2xl transform hover:scale-105 transition-transform duration-500 max-h-[40vh] md:max-h-full"
                        />
                    ) : (
                         <div className="flex flex-col items-center text-gray-400">
                            <Palette className="w-16 h-16 mb-2" />
                            <span>Sin vista previa</span>
                         </div>
                    )}
                    <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-black/90 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                        Vista Previa
                    </div>
                </div>

                {/* Right: Details - Added md:overflow-y-auto for desktop scrolling within the pane */}
                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col md:overflow-y-auto">
                    <div className="mb-6">
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-2 leading-tight">
                            {selectedItem.name}
                        </h2>
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <Calendar className="w-4 h-4" />
                            Creado el {new Date(selectedItem.createdAt).toLocaleDateString()}
                        </div>
                    </div>

                    <div className="space-y-4 mb-8 flex-1">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                            <h3 className="text-sm font-bold uppercase text-gray-400 mb-3">Especificaciones del Diseño</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-300">Color Base</span>
                                    <span className="font-medium capitalize px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-sm">
                                        {selectedItem.config.color === 'white' ? 'Blanca' : 'Negra'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-300">Capas de imagen</span>
                                    <span className="font-medium">{selectedItem.config.layers.length}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl text-sm text-blue-800 dark:text-blue-300">
                            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                            <p>Este diseño está listo para producción. Al comprarlo, podrás seleccionar tu talla y el tipo de tela en el siguiente paso.</p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 dark:border-gray-800 mt-auto bg-white dark:bg-gray-900 sticky bottom-0 md:static">
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-gray-500 font-medium">Precio desde</span>
                            <span className="text-3xl font-black text-pink-600">{formatCurrency(PRICES['150g'])}</span>
                        </div>
                        <button 
                            onClick={handleBuy}
                            className="w-full py-4 bg-gradient-to-r from-pink-600 to-orange-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-orange-500/25 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            COMPRAR AHORA
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen">
      {selectedItem && <DesignModal />}

      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
                <Grid className="w-6 h-6 text-purple-500" />
                <h1 className="text-3xl font-black text-gray-900 dark:text-white">Nuestra Colección</h1>
           </div>
           <p className="text-gray-500 dark:text-gray-400 max-w-xl">
             Explora los diseños exclusivos creados por la comunidad. Haz clic en un diseño para ver detalles y comprarlo.
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

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
        </div>
      ) : collection.length === 0 ? (
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
                onClick={() => setSelectedItem(item)}
             >
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                    {item.config.snapshotUrl ? (
                        <img 
                            src={item.config.snapshotUrl} 
                            alt={item.name} 
                            className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal transition-transform duration-700 group-hover:scale-110" 
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Palette className="w-12 h-12" />
                        </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <span className="bg-white text-black px-6 py-2 rounded-full font-bold flex items-center gap-2 transform scale-90 group-hover:scale-100 transition-transform shadow-lg">
                            <Eye className="w-4 h-4" /> Ver Diseño
                        </span>
                    </div>
                </div>
                
                <div className="p-4">
                    <h3 className="font-bold text-lg mb-1 truncate group-hover:text-pink-500 transition-colors">{item.name}</h3>
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