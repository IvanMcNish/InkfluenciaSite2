import React, { useRef, useState } from 'react';
import { Upload, Move, ZoomIn, ZoomOut, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, LayoutTemplate, RotateCcw, ImageIcon, Trash2, Layers } from 'lucide-react';
import { TShirtConfig } from '../types';
import { Scene } from './Scene';
import { PRICES, formatCurrency } from '../constants';

interface CustomizerProps {
  config: TShirtConfig;
  setConfig: React.Dispatch<React.SetStateAction<TShirtConfig>>;
  onCheckout: () => void;
}

export const Customizer: React.FC<CustomizerProps> = ({ config, setConfig, onCheckout }) => {
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const captureRef = useRef<(() => string) | null>(null);
  
  // Track which layer index is currently selected for editing (0 or 1)
  const [activeLayerIndex, setActiveLayerIndex] = useState<number>(0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
           const canvas = document.createElement('canvas');
           const MAX_WIDTH = 1024;
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
             ctx.drawImage(img, 0, 0, width, height);
             const url = canvas.toDataURL('image/jpeg', 0.8);
             
             setConfig(prev => {
                const newLayers = [...prev.layers];
                const newLayer = {
                    id: `layer-${Date.now()}`,
                    textureUrl: url,
                    position: { x: 0, y: 0.2, scale: 1.0 } // Default new image position
                };
                
                // If slot exists, replace it, otherwise add it
                if (newLayers[slotIndex]) {
                    newLayers[slotIndex] = { ...newLayers[slotIndex], textureUrl: url };
                } else {
                    // Ensure we don't have holes if filling slot 2 before 1 (though UI prevents this mostly)
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

  const adjustPosition = (axis: 'x' | 'y', delta: number) => {
    setConfig(prev => {
        const newLayers = [...prev.layers];
        if (!newLayers[activeLayerIndex]) return prev;

        newLayers[activeLayerIndex] = {
            ...newLayers[activeLayerIndex],
            position: {
                ...newLayers[activeLayerIndex].position,
                [axis]: newLayers[activeLayerIndex].position[axis] + delta
            }
        };
        return { ...prev, layers: newLayers };
    });
  };

  const adjustScale = (delta: number) => {
    setConfig(prev => {
        const newLayers = [...prev.layers];
        if (!newLayers[activeLayerIndex]) return prev;

        newLayers[activeLayerIndex] = {
            ...newLayers[activeLayerIndex],
            position: {
                ...newLayers[activeLayerIndex].position,
                scale: Math.max(0.2, newLayers[activeLayerIndex].position.scale + delta)
            }
        };
        return { ...prev, layers: newLayers };
    });
  };

  const setScaleValue = (value: number) => {
    setConfig(prev => {
        const newLayers = [...prev.layers];
        if (!newLayers[activeLayerIndex]) return prev;

        newLayers[activeLayerIndex] = {
            ...newLayers[activeLayerIndex],
            position: {
                ...newLayers[activeLayerIndex].position,
                scale: value
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
            position: { x: 0, y: 0.2, scale: 1.0 }
        };
        return { ...prev, layers: newLayers };
    });
  };

  const handleCheckout = () => {
    if (captureRef.current) {
        const snapshot = captureRef.current();
        setConfig(prev => ({ ...prev, snapshotUrl: snapshot }));
    }
    onCheckout();
  };

  const activeLayer = config.layers[activeLayerIndex];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 max-w-7xl mx-auto h-[calc(100vh-80px)]">
      {/* 3D Scene Area */}
      <div className="lg:col-span-2 h-[50vh] lg:h-auto border-4 border-white dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <Scene config={config} captureRef={captureRef} />
      </div>

      {/* Controls Panel */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col gap-6 overflow-y-auto">
        <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-1 bg-gradient-to-b from-pink-500 to-orange-500 rounded-full"></div>
            <h2 className="text-2xl font-bold">Personalización</h2>
        </div>
        
        {/* Color Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Color Base</label>
          <div className="flex gap-4">
            <button
              onClick={() => handleColorChange('white')}
              className={`w-14 h-14 rounded-full border-2 transition-all ${config.color === 'white' ? 'border-pink-500 ring-2 ring-pink-200 scale-110' : 'border-gray-200'} bg-white shadow-sm`}
              title="Blanco"
            />
            <button
              onClick={() => handleColorChange('black')}
              className={`w-14 h-14 rounded-full border-2 transition-all ${config.color === 'black' ? 'border-pink-500 ring-2 ring-pink-200 scale-110' : 'border-gray-600'} bg-black shadow-sm`}
              title="Negro"
            />
          </div>
        </div>

        {/* Upload Image Layers */}
        <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Capas de Diseño (Máx 2)
              </label>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                {/* Slot 1 */}
                <div 
                    className={`border-2 rounded-xl p-2 relative transition-all ${activeLayerIndex === 0 && config.layers[0] ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                    onClick={() => config.layers[0] && setActiveLayerIndex(0)}
                >
                    <input type="file" ref={fileInputRef1} onChange={(e) => handleFileUpload(e, 0)} accept="image/*" className="hidden" />
                    {config.layers[0] ? (
                        <div className="flex flex-col items-center gap-2 cursor-pointer">
                            <img src={config.layers[0].textureUrl} className="w-16 h-16 object-contain bg-white rounded border border-gray-200" alt="Capa 1" />
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold">Diseño 1</span>
                                <button onClick={(e) => { e.stopPropagation(); removeLayer(0); }} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-3 h-3" /></button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => fileInputRef1.current?.click()} className="w-full h-24 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-pink-500">
                            <Upload className="w-6 h-6" />
                            <span className="text-xs font-bold">Subir #1</span>
                        </button>
                    )}
                </div>

                {/* Slot 2 */}
                <div 
                    className={`border-2 rounded-xl p-2 relative transition-all ${activeLayerIndex === 1 && config.layers[1] ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                    onClick={() => config.layers[1] && setActiveLayerIndex(1)}
                >
                    <input type="file" ref={fileInputRef2} onChange={(e) => handleFileUpload(e, 1)} accept="image/*" className="hidden" />
                    {config.layers[1] ? (
                        <div className="flex flex-col items-center gap-2 cursor-pointer">
                            <img src={config.layers[1].textureUrl} className="w-16 h-16 object-contain bg-white rounded border border-gray-200" alt="Capa 2" />
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold">Diseño 2</span>
                                <button onClick={(e) => { e.stopPropagation(); removeLayer(1); }} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-3 h-3" /></button>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={() => fileInputRef2.current?.click()} 
                            disabled={!config.layers[0]}
                            className={`w-full h-24 flex flex-col items-center justify-center gap-2 ${!config.layers[0] ? 'opacity-50 cursor-not-allowed text-gray-300' : 'text-gray-400 hover:text-pink-500'}`}
                        >
                            <Upload className="w-6 h-6" />
                            <span className="text-xs font-bold">Subir #2</span>
                        </button>
                    )}
                </div>
            </div>
            
            {config.layers.length > 0 && (
                <div className="text-xs text-center text-gray-400 italic">
                    Selecciona una capa arriba para moverla
                </div>
            )}
        </div>

        {/* Adjustments (Shown if an active layer exists) */}
        {activeLayer && (
          <div className="space-y-6 animate-fade-in border-t border-gray-100 dark:border-gray-800 pt-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 uppercase tracking-wide">
                  <Move className="w-4 h-4" /> Posición (Diseño {activeLayerIndex + 1})
                </label>
                <button 
                   onClick={centerImage}
                   className="text-xs text-pink-500 hover:text-pink-600 font-bold flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> CENTRAR
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-2 w-32 mx-auto">
                <div />
                <button 
                  onClick={() => adjustPosition('y', 0.1)}
                  className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/30 text-gray-600 dark:text-gray-300 hover:text-pink-600 transition-colors"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
                <div />
                <button 
                  onClick={() => adjustPosition('x', -0.1)}
                  className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/30 text-gray-600 dark:text-gray-300 hover:text-pink-600 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center justify-center">
                    <LayoutTemplate className="w-5 h-5 text-gray-400" />
                </div>
                <button 
                  onClick={() => adjustPosition('x', 0.1)}
                  className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/30 text-gray-600 dark:text-gray-300 hover:text-pink-600 transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <div />
                <button 
                  onClick={() => adjustPosition('y', -0.1)}
                  className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/30 text-gray-600 dark:text-gray-300 hover:text-pink-600 transition-colors"
                >
                  <ArrowDown className="w-5 h-5" />
                </button>
                <div />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 uppercase tracking-wide">
                <ZoomIn className="w-4 h-4" /> Tamaño (Diseño {activeLayerIndex + 1})
              </label>
              <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                <button 
                  onClick={() => adjustScale(-0.1)}
                  className="p-2 text-gray-500 hover:text-pink-500 transition-colors"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <input 
                  type="range" 
                  min="0.2" 
                  max="2.5" 
                  step="0.1" 
                  value={activeLayer.position.scale}
                  onChange={(e) => setScaleValue(parseFloat(e.target.value))}
                  className="w-full accent-pink-500 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <button 
                  onClick={() => adjustScale(0.1)}
                  className="p-2 text-gray-500 hover:text-pink-500 transition-colors"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-800">
          <button 
            onClick={handleCheckout}
            disabled={config.layers.length === 0}
            className={`w-full bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-500 hover:to-orange-400 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 ${config.layers.length === 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
          >
            COMPRAR AHORA
            <span className="bg-white/20 px-2 py-0.5 rounded text-sm backdrop-blur-sm">Desde {formatCurrency(PRICES['150g'])}</span>
          </button>
        </div>
      </div>
    </div>
  );
};