
import React, { useRef, useState, useEffect } from 'react';
import { Upload, Move, ZoomIn, ZoomOut, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, LayoutTemplate, RotateCcw, Trash2, Layers, Save, ShoppingBag, AlertTriangle, Loader2, Info, RefreshCw, Shirt, Ruler } from 'lucide-react';
import { TShirtConfig, CustomizerConstraints } from '../types';
import { Scene } from './Scene';
import { PRICES, formatCurrency } from '../constants';
import { getCustomizerConstraints, DEFAULT_CONSTRAINTS } from '../services/settingsService';

interface CustomizerProps {
  config: TShirtConfig;
  setConfig: React.Dispatch<React.SetStateAction<TShirtConfig>>;
  onCheckout?: () => void;
  onSaveToGallery?: (name: string, config: TShirtConfig) => void;
  isDesignerMode?: boolean;
}

export const Customizer: React.FC<CustomizerProps> = ({ config, setConfig, onCheckout, onSaveToGallery, isDesignerMode = false }) => {
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const captureRef = useRef<(() => string) | null>(null);
  
  const [activeLayerIndex, setActiveLayerIndex] = useState<number>(0);
  const [designName, setDesignName] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  
  const [constraints, setConstraints] = useState<CustomizerConstraints>(DEFAULT_CONSTRAINTS);
  const [constraintsLoaded, setConstraintsLoaded] = useState(false);

  useEffect(() => {
      const loadConstraints = async () => {
          const data = await getCustomizerConstraints();
          setConstraints(data);
          setConstraintsLoaded(true);
      };
      loadConstraints();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen es demasiado grande. Por favor usa una imagen menor a 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
           const canvas = document.createElement('canvas');
           const MAX_WIDTH = 600; 
           let width = img.width;
           let height = img.height;

           if (width > MAX_WIDTH) {
             height = Math.round((height * MAX_WIDTH) / width);
             width = MAX_WIDTH;
           }

           canvas.width = width;
           canvas.height = height;
           
           const ctx = canvas.getContext('2d');
           if (ctx) {
             ctx.clearRect(0, 0, width, height);
             ctx.drawImage(img, 0, 0, width, height);
             
             let url = canvas.toDataURL('image/webp', 0.8);
             
             if (url.indexOf('image/webp') === -1) {
                 url = canvas.toDataURL('image/png');
             }
             
             setConfig(prev => {
                const newLayers = [...prev.layers];
                const newLayer = {
                    id: `layer-${Date.now()}`,
                    textureUrl: url,
                    side: 'front' as const, 
                    position: { x: 0, y: 0.1, scale: 0.25 }
                };
                
                if (newLayers[slotIndex]) {
                    newLayers[slotIndex] = { ...newLayers[slotIndex], textureUrl: url };
                } else {
                    if (slotIndex === 1 && !newLayers[0]) return prev; 
                    newLayers[slotIndex] = newLayer;
                }
                
                return { ...prev, layers: newLayers };
             });
             setActiveLayerIndex(slotIndex);
           }
        }
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLayer = (index: number) => {
    setConfig(prev => {
        const newLayers = prev.layers.filter((_, i) => i !== index);
        return { ...prev, layers: newLayers };
    });
    setActiveLayerIndex(0);
  };

  const handleColorChange = (color: 'white' | 'black') => {
    setConfig(prev => ({ ...prev, color }));
  };

  const toggleLayerSide = () => {
      setConfig(prev => {
          const newLayers = [...prev.layers];
          if (!newLayers[activeLayerIndex]) return prev;

          const currentSide = newLayers[activeLayerIndex].side || 'front';
          newLayers[activeLayerIndex] = {
              ...newLayers[activeLayerIndex],
              side: currentSide === 'front' ? 'back' : 'front'
          };
          return { ...prev, layers: newLayers };
      });
  };

  const getDynamicBounds = (scale: number, axis: 'x' | 'y') => {
      const halfSize = scale / 2;
      const min = constraints[axis].min + halfSize;
      const max = constraints[axis].max - halfSize;
      if (min > max) return { min: 0, max: 0 };
      return { min, max };
  };

  const adjustPosition = (axis: 'x' | 'y', delta: number) => {
    setConfig(prev => {
        const newLayers = [...prev.layers];
        if (!newLayers[activeLayerIndex]) return prev;

        const currentLayer = newLayers[activeLayerIndex];
        let newValue = currentLayer.position[axis] + delta;
        const { min, max } = getDynamicBounds(currentLayer.position.scale, axis);
        newValue = Math.max(min, Math.min(newValue, max));

        newLayers[activeLayerIndex] = {
            ...currentLayer,
            position: {
                ...currentLayer.position,
                [axis]: newValue
            }
        };
        return { ...prev, layers: newLayers };
    });
  };

  const adjustScale = (delta: number) => {
    setConfig(prev => {
        const newLayers = [...prev.layers];
        if (!newLayers[activeLayerIndex]) return prev;

        const currentLayer = newLayers[activeLayerIndex];
        let newScale = currentLayer.position.scale + delta;
        newScale = Math.max(constraints.scale.min, Math.min(newScale, constraints.scale.max));

        const xBounds = getDynamicBounds(newScale, 'x');
        const yBounds = getDynamicBounds(newScale, 'y');

        const correctedX = Math.max(xBounds.min, Math.min(currentLayer.position.x, xBounds.max));
        const correctedY = Math.max(yBounds.min, Math.min(currentLayer.position.y, yBounds.max));

        newLayers[activeLayerIndex] = {
            ...currentLayer,
            position: {
                ...currentLayer.position,
                scale: newScale,
                x: correctedX,
                y: correctedY
            }
        };
        return { ...prev, layers: newLayers };
    });
  };

  const setScaleValue = (value: number) => {
    setConfig(prev => {
        const newLayers = [...prev.layers];
        if (!newLayers[activeLayerIndex]) return prev;

        const currentLayer = newLayers[activeLayerIndex];
        const newScale = Math.max(constraints.scale.min, Math.min(value, constraints.scale.max));

        const xBounds = getDynamicBounds(newScale, 'x');
        const yBounds = getDynamicBounds(newScale, 'y');

        const correctedX = Math.max(xBounds.min, Math.min(currentLayer.position.x, xBounds.max));
        const correctedY = Math.max(yBounds.min, Math.min(currentLayer.position.y, yBounds.max));

        newLayers[activeLayerIndex] = {
            ...currentLayer,
            position: {
                ...currentLayer.position,
                scale: newScale,
                x: correctedX,
                y: correctedY
            }
        };
        return { ...prev, layers: newLayers };
    });
  }

  const centerImage = () => {
    setConfig(prev => {
        const newLayers = [...prev.layers];
        if (!newLayers[activeLayerIndex]) return prev;

        newLayers[activeLayerIndex] = {
            ...newLayers[activeLayerIndex],
            position: { x: 0, y: 0.1, scale: 0.25 }
        };
        return { ...prev, layers: newLayers };
    });
  };

  const handleAction = async () => {
    setIsProcessing(true);
    setSaveError('');
    
    const wasShowingGuides = showGuides;
    if (wasShowingGuides) setShowGuides(false);
    
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        let snapshot = '';
        if (captureRef.current) {
            try {
                snapshot = captureRef.current();
            } catch (e) {
                console.error("Failed to capture snapshot:", e);
            }
        }
        
        if (wasShowingGuides) setShowGuides(true);

        const configWithSnapshot = { ...config, snapshotUrl: snapshot };
        setConfig(configWithSnapshot);
        
        if (isDesignerMode && onSaveToGallery) {
             if (!designName.trim()) {
                 setSaveError('Por favor, ingresa un nombre para tu diseño.');
                 setIsProcessing(false);
                 return;
             }
             try {
                onSaveToGallery(designName, configWithSnapshot);
             } catch (e: any) {
                 console.error("Gallery save error:", e);
                 if (e.name === 'QuotaExceededError' || e.message?.includes('exceeded the quota')) {
                     setSaveError('¡Espacio lleno! Por favor ve a la galería y elimina diseños antiguos para liberar espacio.');
                 } else {
                     setSaveError('No se pudo guardar el diseño. Intenta nuevamente.');
                 }
                 setIsProcessing(false);
                 return;
             }
        } else if (onCheckout) {
             onCheckout();
        }
    } catch (error) {
        console.error("Error processing action:", error);
        setSaveError("Ocurrió un error inesperado.");
        if (wasShowingGuides) setShowGuides(true);
    } finally {
        setIsProcessing(false);
    }
  };

  const activeLayer = config.layers[activeLayerIndex];

  return (
    <div className="flex flex-col sm:flex-row lg:grid lg:grid-cols-3 gap-4 lg:gap-8 p-4 lg:p-6 max-w-7xl mx-auto h-[calc(100vh-65px)] lg:h-[calc(100vh-80px)]">
      
      <div className="w-full sm:w-1/2 lg:w-auto lg:col-span-2 h-[35vh] sm:h-full lg:h-full min-h-[250px] border-2 lg:border-4 border-white dark:border-gray-800 rounded-2xl shadow-lg lg:shadow-2xl overflow-hidden relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 shrink-0 group">
        <Scene 
            config={config} 
            captureRef={captureRef} 
            activeLayerSide={activeLayer?.side || 'front'} 
            showMeasurements={showGuides}
        />
        
        <button
            onClick={() => setShowGuides(!showGuides)}
            className={`absolute top-4 right-4 p-2.5 rounded-full shadow-lg transition-all z-10 ${showGuides ? 'bg-pink-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-400 hover:text-pink-500'}`}
            title="Mostrar/Ocultar Medidas"
        >
            <Ruler className="w-5 h-5" />
        </button>
      </div>

      <div className="w-full sm:w-1/2 lg:w-auto bg-white dark:bg-gray-900 p-4 lg:p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col gap-4 lg:gap-6 overflow-y-auto flex-1">
        
        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="flex items-center gap-2">
                <div className={`h-6 lg:h-8 w-1 bg-gradient-to-b rounded-full ${isDesignerMode ? 'from-purple-500 to-indigo-500' : 'from-pink-500 to-orange-500'}`}></div>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-100">{isDesignerMode ? 'Diseñador' : 'Personalizar'}</h2>
            </div>
            
            <div className="flex gap-2">
                <button
                onClick={() => handleColorChange('white')}
                className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 transition-all ${config.color === 'white' ? 'border-pink-500 ring-2 ring-pink-200 scale-110' : 'border-gray-200'} bg-white shadow-sm`}
                title="Blanco"
                />
                <button
                onClick={() => handleColorChange('black')}
                className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 transition-all ${config.color === 'black' ? 'border-pink-500 ring-2 ring-pink-200 scale-110' : 'border-gray-600'} bg-black shadow-sm`}
                title="Negro"
                />
            </div>
        </div>

        <div className="space-y-2 lg:space-y-3">
            <div className="flex justify-between items-center">
                <label className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Capas (Máx 2)
                </label>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div 
                    className={`border-2 rounded-xl p-2 relative transition-all cursor-pointer ${activeLayerIndex === 0 && config.layers[0] ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                    onClick={() => config.layers[0] && setActiveLayerIndex(0)}
                >
                    <input type="file" ref={fileInputRef1} onChange={(e) => handleFileUpload(e, 0)} accept="image/*" className="hidden" />
                    {config.layers[0] ? (
                        <div className="flex flex-col items-center gap-1">
                            <img src={config.layers[0].textureUrl} className="w-12 h-12 lg:w-16 lg:h-16 object-contain bg-white rounded border border-gray-200" alt="Capa 1" />
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] lg:text-xs font-bold">Diseño 1</span>
                                <button onClick={(e) => { e.stopPropagation(); removeLayer(0); }} className="text-red-500 hover:text-red-700 p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm"><Trash2 className="w-3 h-3" /></button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => fileInputRef1.current?.click()} className="w-full h-20 lg:h-24 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-pink-500">
                            <Upload className="w-5 h-5 lg:w-6 lg:h-6" />
                            <span className="text-[10px] lg:text-xs font-bold">Subir #1</span>
                        </button>
                    )}
                </div>

                <div 
                    className={`border-2 rounded-xl p-2 relative transition-all cursor-pointer ${activeLayerIndex === 1 && config.layers[1] ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                    onClick={() => config.layers[1] && setActiveLayerIndex(1)}
                >
                    <input type="file" ref={fileInputRef2} onChange={(e) => handleFileUpload(e, 1)} accept="image/*" className="hidden" />
                    {config.layers[1] ? (
                        <div className="flex flex-col items-center gap-1">
                            <img src={config.layers[1].textureUrl} className="w-12 h-12 lg:w-16 lg:h-16 object-contain bg-white rounded border border-gray-200" alt="Capa 2" />
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] lg:text-xs font-bold">Diseño 2</span>
                                <button onClick={(e) => { e.stopPropagation(); removeLayer(1); }} className="text-red-500 hover:text-red-700 p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm"><Trash2 className="w-3 h-3" /></button>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={() => fileInputRef2.current?.click()} 
                            disabled={!config.layers[0]}
                            className={`w-full h-20 lg:h-24 flex flex-col items-center justify-center gap-2 ${!config.layers[0] ? 'opacity-50 cursor-not-allowed text-gray-300' : 'text-gray-400 hover:text-pink-500'}`}
                        >
                            <Upload className="w-5 h-5 lg:w-6 lg:h-6" />
                            <span className="text-[10px] lg:text-xs font-bold">Subir #2</span>
                        </button>
                    )}
                </div>
            </div>
            
            {activeLayer && (
                <div className="mt-2">
                     <button
                        onClick={toggleLayerSide}
                        className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-pink-500 dark:hover:border-pink-500 transition-colors group"
                     >
                        <div className="flex items-center gap-2">
                            <Shirt className="w-4 h-4 text-gray-500 group-hover:text-pink-500 transition-colors" />
                            <span className="text-xs font-bold uppercase text-gray-600 dark:text-gray-300">Ubicación:</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded transition-all ${activeLayer.side === 'front' || !activeLayer.side ? 'bg-pink-500 text-white' : 'text-gray-400'}`}>Frente</span>
                            <RefreshCw className="w-3 h-3 text-gray-400" />
                            <span className={`text-xs font-bold px-2 py-0.5 rounded transition-all ${activeLayer.side === 'back' ? 'bg-pink-500 text-white' : 'text-gray-400'}`}>Espalda</span>
                        </div>
                     </button>
                </div>
            )}
            
            {config.layers.length > 0 && !activeLayer && (
                <div className="text-xs text-center text-gray-400 italic">
                    Toca un diseño para editar
                </div>
            )}
        </div>

        {activeLayer && (
          <div className="space-y-4 lg:space-y-6 animate-fade-in border-t border-gray-100 dark:border-gray-800 pt-2 lg:pt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 uppercase tracking-wide">
                  <Move className="w-4 h-4" /> Mover (#{activeLayerIndex + 1})
                </label>
                <button 
                   onClick={centerImage}
                   className="text-[10px] lg:text-xs text-pink-500 hover:text-pink-600 font-bold flex items-center gap-1 bg-pink-50 dark:bg-pink-900/10 px-2 py-1 rounded"
                >
                  <RotateCcw className="w-3 h-3" /> CENTRAR
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-1 w-28 mx-auto">
                <div />
                <button 
                  onClick={() => adjustPosition('y', 0.05)}
                  className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/30 text-gray-600 dark:text-gray-300 hover:text-pink-600 active:scale-95 transition-transform"
                >
                  <ArrowUp className="w-4 h-4 mx-auto" />
                </button>
                <div />
                <button 
                  onClick={() => adjustPosition('x', -0.05)}
                  className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/30 text-gray-600 dark:text-gray-300 hover:text-pink-600 active:scale-95 transition-transform"
                >
                  <ArrowLeft className="w-4 h-4 mx-auto" />
                </button>
                <div className="flex items-center justify-center">
                    <LayoutTemplate className="w-4 h-4 text-gray-400" />
                </div>
                <button 
                  onClick={() => adjustPosition('x', 0.05)}
                  className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/30 text-gray-600 dark:text-gray-300 hover:text-pink-600 active:scale-95 transition-transform"
                >
                  <ArrowRight className="w-4 h-4 mx-auto" />
                </button>
                <div />
                <button 
                  onClick={() => adjustPosition('y', -0.05)}
                  className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/30 text-gray-600 dark:text-gray-300 hover:text-pink-600 active:scale-95 transition-transform"
                >
                  <ArrowDown className="w-4 h-4 mx-auto" />
                </button>
                <div />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 uppercase tracking-wide">
                <ZoomIn className="w-4 h-4" /> Tamaño {constraintsLoaded && <span className="text-[10px] normal-case text-gray-300">(Mín: {constraints.scale.min.toFixed(2)}, Máx: {constraints.scale.max.toFixed(2)})</span>}
              </label>
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                <button 
                  onClick={() => adjustScale(-0.05)}
                  className="p-1 text-gray-500 hover:text-pink-500 active:scale-95 transition-transform"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <input 
                  type="range" 
                  min={constraints.scale.min} 
                  max={constraints.scale.max} 
                  step="0.01" 
                  value={activeLayer.position.scale}
                  onChange={(e) => setScaleValue(parseFloat(e.target.value))}
                  className="w-full accent-pink-500 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <button 
                  onClick={() => adjustScale(0.05)}
                  className="p-1 text-gray-500 hover:text-pink-500 active:scale-95 transition-transform"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
          {isDesignerMode ? (
            <div className="space-y-3">
               <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 flex gap-2">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed text-justify">
                      Las imágenes que va a incluir en el diseño serán <strong>públicas</strong> para toda la comunidad. 
                      Evite compartir imágenes personales o sensibles. Su diseño será revisado por el admin y una vez aprobado estará disponible en la galería de la comunidad.
                  </p>
               </div>

               <div>
                  <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-300">Nombre del Diseño</label>
                  <input 
                    type="text" 
                    value={designName}
                    onChange={(e) => {
                        setDesignName(e.target.value);
                        setSaveError('');
                    }}
                    placeholder="Ej. Mi Obra Maestra"
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm"
                    disabled={isProcessing}
                  />
                  {saveError && (
                    <div className="flex items-start gap-2 mt-2 text-red-500 text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <p>{saveError}</p>
                    </div>
                  )}
               </div>

               <button 
                onClick={handleAction}
                disabled={config.layers.length === 0 || isProcessing}
                className={`w-full bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white py-3 lg:py-4 rounded-xl font-bold text-sm lg:text-lg shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all flex items-center justify-center gap-2 ${config.layers.length === 0 || isProcessing ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5" />}
                {isProcessing ? 'Guardando...' : 'GUARDAR EN GALERÍA'}
              </button>
            </div>
          ) : (
             <button 
                onClick={handleAction}
                disabled={config.layers.length === 0 || isProcessing}
                className={`w-full bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-500 hover:to-orange-400 text-white py-3 lg:py-4 rounded-xl font-bold text-sm lg:text-lg shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all flex items-center justify-center gap-2 ${config.layers.length === 0 || isProcessing ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin"/> : <ShoppingBag className="w-5 h-5" />}
                {isProcessing ? 'Procesando...' : 'COMPRAR AHORA'}
                {!isProcessing && <span className="bg-white/20 px-2 py-0.5 rounded text-xs backdrop-blur-sm hidden sm:inline">Desde {formatCurrency(PRICES['150g'])}</span>}
              </button>
          )}
        </div>
      </div>
    </div>
  );
};
