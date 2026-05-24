
import React, { useEffect, useState } from 'react';
import { CollectionItem, TShirtConfig } from '../types';
import { getCollection } from '../services/galleryService';
import { Palette, Eye, Grid, X, ShoppingBag, Calendar, CheckCircle2, Loader2, Rotate3d, BookOpen, Download, ExternalLink, FileText } from 'lucide-react';
import { formatCurrency, PRICES } from '../constants';
import { Scene } from './Scene';
import { getAppearanceSettings } from '../services/settingsService';

interface GalleryPageProps {
  onUseDesign: (config: TShirtConfig) => void;
  onNavigateToCreator: () => void;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({ onUseDesign, onNavigateToCreator }) => {
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'community' | 'catalog'>('community');
  const [cardScale, setCardScale] = useState(85);

  const fetchGallery = async () => {
      setIsLoading(true);
      const items = await getCollection();
      setCollection(items);
      setIsLoading(false);
  };

  const loadCardScale = async () => {
      try {
          const settings = await getAppearanceSettings();
          if (settings && settings.galleryCardScale !== undefined) {
              setCardScale(settings.galleryCardScale);
          }
      } catch (err) {
          console.error('Error loading gallery card scale', err);
      }
  };

  useEffect(() => {
    fetchGallery();
    loadCardScale();
  }, []);

  const handleBuy = () => {
    if (selectedItem) {
        onUseDesign(selectedItem.config);
    }
  };

  // Preview Modal
  const DesignModal = () => {
    if (!selectedItem) return null;

    // Determine initial side based on first layer to orient camera correctly
    const initialSide = selectedItem.config.layers.length > 0 ? selectedItem.config.layers[0].side : 'front';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            {/* Added max-h-[90vh] and overflow-y-auto for mobile scrolling. md:overflow-hidden keeps desktop clean. */}
            <div className="liquid-glass-accent text-zinc-950 dark:text-white rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col md:flex-row relative max-h-[90vh] overflow-y-auto md:overflow-hidden">
                <button 
                    onClick={() => setSelectedItem(null)}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded-full transition-colors backdrop-blur-md"
                >
                    <X className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                </button>

                {/* Left: 3D Scene - Height increased for Mobile (45vh instead of fixed px) */}
                <div className="w-full md:w-1/2 bg-gray-100/50 dark:bg-zinc-950/40 relative shrink-0 h-[45vh] md:h-auto md:min-h-[400px] overflow-hidden border-b md:border-b-0 md:border-r border-gray-200/50 dark:border-gray-800/50">
                     <Scene 
                        config={selectedItem.config} 
                        activeLayerSide={initialSide || 'front'}
                        showMeasurements={true}
                     />
                    <div className="absolute top-4 left-4 z-10 bg-white/80 dark:bg-black/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <Rotate3d className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        Vista 3D Interactiva
                    </div>
                </div>

                {/* Right: Details - Added md:overflow-y-auto for desktop scrolling within the pane */}
                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col md:overflow-y-auto">
                    <div className="mb-6 text-left">
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-2 leading-tight">
                            {selectedItem.name}
                        </h2>
                        <div className="flex items-center gap-2 text-zinc-700 dark:text-gray-300 text-sm">
                            <Calendar className="w-4 h-4 text-purple-500" />
                            Creado el {new Date(selectedItem.createdAt).toLocaleDateString()}
                        </div>
                    </div>

                    <div className="space-y-4 mb-8 flex-1 text-left">
                        <div className="p-4 bg-white/20 dark:bg-black/20 rounded-xl border border-white/20 dark:border-white/5 shadow-inner">
                            <h3 className="text-xs font-black uppercase text-pink-600 dark:text-pink-400 mb-3 tracking-wider">Especificaciones del Diseño</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center bg-white/10 dark:bg-black/10 p-1.5 rounded-lg">
                                    <span className="text-gray-900 dark:text-gray-200 text-sm font-medium">Color Base</span>
                                    <span className="font-bold capitalize px-2.5 py-0.5 bg-pink-500 text-white rounded text-xs">
                                        {selectedItem.config.color === 'white' ? 'Blanca' : 'Negra'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center bg-white/10 dark:bg-black/10 p-1.5 rounded-lg">
                                    <span className="text-gray-900 dark:text-gray-200 text-sm font-medium">Capas de imagen</span>
                                    <span className="font-bold text-gray-900 dark:text-white text-sm">{selectedItem.config.layers.length}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl text-sm text-blue-900 dark:text-blue-200 border border-blue-200/55 dark:border-blue-900/30 backdrop-blur-sm">
                            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                            <p className="leading-relaxed">Este diseño está listo para producción. Al comprarlo, podrás seleccionar tu talla y el tipo de tela en el siguiente paso.</p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/25 dark:border-white/15 mt-auto bg-transparent sticky bottom-0 md:static">
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-zinc-650 dark:text-zinc-350 font-bold uppercase text-xs tracking-wider">Precio desde</span>
                            <span className="text-3xl font-black text-pink-600 dark:text-pink-400">{formatCurrency(PRICES['150g'])}</span>
                        </div>
                        <button 
                            onClick={handleBuy}
                            className="w-full py-4 bg-gradient-to-r from-pink-600 to-orange-500 text-white rounded-xl font-black text-md shadow-lg hover:shadow-orange-500/25 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
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

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
                <Grid className="w-6 h-6 text-purple-500" />
                <h1 className="text-3xl font-black text-gray-900 dark:text-white">Nuestra Colección</h1>
           </div>
           <div className="mt-2 text-left">
             <p className="text-gray-850 dark:text-gray-100 text-sm md:text-base leading-relaxed px-5 py-3 rounded-2xl bg-white/40 dark:bg-black/30 border border-white/20 dark:border-white/5 backdrop-blur-md shadow-lg inline-block max-w-xl">
               Explora los diseños exclusivos creados por la comunidad o consulta nuestro catálogo oficial. Haz clic en un diseño para comprarlo.
             </p>
           </div>
        </div>
        <button 
           onClick={onNavigateToCreator}
           className="bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/40 px-6 py-3 rounded-full font-bold transition-colors flex items-center gap-2 shrink-0 shadow-sm"
        >
            <Palette className="w-5 h-5" />
            Crear Nuevo Diseño
        </button>
      </div>

      {/* Navigation Tabs for Community Cards vs Catalog PDF */}
      <div className="flex justify-center mb-8">
        <div className="p-1.5 rounded-2xl flex gap-1.5 liquid-glass border border-white/20 dark:border-white/5 shadow-md">
          <button 
            onClick={() => setActiveTab('community')}
            className={`px-5 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all flex items-center gap-2 uppercase tracking-wider ${
              activeTab === 'community' 
                ? 'bg-gradient-to-r from-pink-600 to-orange-500 text-white shadow-lg' 
                : 'text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400'
            }`}
          >
            <Grid className="w-4 h-4" />
            Diseños Comunidad
          </button>
          <button 
            onClick={() => setActiveTab('catalog')}
            className={`px-5 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all flex items-center gap-2 uppercase tracking-wider ${
              activeTab === 'catalog' 
                ? 'bg-gradient-to-r from-pink-600 to-orange-500 text-white shadow-lg' 
                : 'text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Catálogo Oficial (PDF)
          </button>
        </div>
      </div>

      {activeTab === 'community' ? (
        isLoading ? (
          <div className="flex justify-center items-center h-64">
              <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
          </div>
        ) : collection.length === 0 ? (
          <div className="text-center py-20 bg-gray-50/50 dark:bg-gray-900/45 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 backdrop-blur-sm">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
             {collection.map((item) => (
               <div 
                  key={item.id} 
                  className="group relative flex flex-col justify-between aspect-[3/4] rounded-3xl border border-white/60 dark:border-white/10 bg-white/40 dark:bg-gray-950/40 backdrop-blur-xl shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 dark:hover:shadow-indigo-500/10 transition-all duration-500 hover:-translate-y-2 cursor-pointer overflow-hidden"
                  onClick={() => setSelectedItem(item)}
               >
                  <div className="flex-grow w-full h-[76%] flex items-center justify-center p-6 relative bg-transparent overflow-hidden">
                      {item.config.snapshotUrl ? (
                          <img 
                              src={item.config.snapshotUrl} 
                              alt={item.name} 
                              style={{ maxHeight: `${cardScale}%`, maxWidth: `${cardScale}%` }}
                              className="object-contain filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.15)] group-hover:scale-102 transition-all duration-700" 
                          />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Palette className="w-12 h-12" />
                          </div>
                      )}
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/10 dark:bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                          <span className="bg-white/85 dark:bg-gray-950/85 backdrop-blur border border-white/20 dark:border-gray-800 text-gray-900 dark:text-white px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 transform scale-90 group-hover:scale-100 transition-all duration-300 shadow-xl">
                              <Eye className="w-4 h-4" /> Ver Diseño
                          </span>
                      </div>
                  </div>
                  
                  <div className="absolute bottom-3 left-3 right-3 z-10 p-3 h-[4.5rem] rounded-2xl bg-white/75 dark:bg-gray-950/75 backdrop-blur-lg border border-white/20 dark:border-gray-800/50 shadow-lg flex justify-between items-center transition-all duration-300 group-hover:bg-white/95 group-hover:dark:bg-gray-950/95 text-left">
                      <div className="truncate pr-2 flex-grow min-w-0"><h3 className="font-extrabold text-gray-950 dark:text-white text-sm md:text-base leading-tight truncate">{item.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-700 dark:text-gray-300 font-medium">
                          <span className="shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: item.config.color === 'white' ? '#fff' : '#000', border: '1px solid currentColor' }} />
                          <span className="truncate text-xs">
                              {item.config.productType === 'totebag' ? 'Tote Bag Natural' : item.config.color === 'white' ? 'Camiseta Blanca' : 'Camiseta Negra'}
                          </span>
                      </div>
                      </div>
                      <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-pink-600 to-orange-500 text-white shadow-md shadow-orange-500/20 group-hover:scale-110 transition-transform duration-300">
                          <ShoppingBag className="w-3.5 h-3.5" />
                      </span>
                  </div>
               </div>
             ))}
          </div>
        )
      ) : (
        /* PDF Catalog Viewer Tab */
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-left">
          <div className="p-6 rounded-3xl backdrop-blur-xl liquid-glass border border-white/25 dark:border-white/5 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex gap-4 items-start">
              <div className="p-3.5 bg-pink-500/15 text-pink-500 rounded-2xl border border-pink-500/20 shrink-0">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">Catálogo Oficial Inkfluencia</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg">
                  Explora nuestra colección oficial de prendas, técnicas de impresión, portafolio de marca, tallas y condiciones. Haz clic para descargar el archivo completo o léelo directamente en pantalla.
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 shrink-0 w-full md:w-auto">
              <a 
                href="https://kdddhfajdhwldgutzqbq.supabase.co/storage/v1/object/public/inkfluencia-images/LOGO/CATALOGO%20INKFLUENCIA.pdf" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-full text-xs font-black text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30 border border-purple-500/25 shadow-sm hover:scale-105 transition-all text-center flex-1 md:flex-initial"
              >
                <ExternalLink className="w-4 h-4" />
                VISTA EXTERNAL
              </a>
              <a 
                href="https://kdddhfajdhwldgutzqbq.supabase.co/storage/v1/object/public/inkfluencia-images/LOGO/CATALOGO%20INKFLUENCIA.pdf" 
                download="CATALOGO_INKFLUENCIA.pdf"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-black text-white bg-gradient-to-r from-pink-600 to-orange-500 shadow-md hover:from-pink-700 hover:to-orange-600 hover:scale-[1.03] hover:shadow-orange-500/20 transition-all text-center flex-1 md:flex-initial"
              >
                <Download className="w-4 h-4" />
                DESCARGAR PDF
              </a>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/5 bg-gray-100/50 dark:bg-zinc-950/30 backdrop-blur-xl h-[700px] flex flex-col">
            <div className="bg-white/40 dark:bg-zinc-900/40 p-4 border-b border-white/20 dark:border-white/5 flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 px-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse"></div>
                <span>Previsualización de Documento Real</span>
              </div>
              <span className="font-mono text-[10px]">CATALOGO_INKFLUENCIA.pdf</span>
            </div>
            
            <div className="flex-1 w-full bg-transparent overflow-hidden">
              <iframe 
                src="https://kdddhfajdhwldgutzqbq.supabase.co/storage/v1/object/public/inkfluencia-images/LOGO/CATALOGO%20INKFLUENCIA.pdf#toolbar=1"
                className="w-full h-full bg-white dark:bg-transparent"
                title="Catálogo Oficial Inkfluencia PDF"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
