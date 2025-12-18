import React, { useRef } from 'react';
import { Upload, Move, ZoomIn, ZoomOut, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, LayoutTemplate, RotateCcw, ImageIcon } from 'lucide-react';
import { TShirtConfig } from '../types';
import { Scene } from './Scene';
import { PRICES, formatCurrency } from '../constants';

interface CustomizerProps {
  config: TShirtConfig;
  setConfig: React.Dispatch<React.SetStateAction<TShirtConfig>>;
  onCheckout: () => void;
}

export const Customizer: React.FC<CustomizerProps> = ({ config, setConfig, onCheckout }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<(() => string) | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Use FileReader to convert image to Base64 for persistence
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setConfig(prev => ({ ...prev, textureUrl: url }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = (color: 'white' | 'black') => {
    setConfig(prev => ({ ...prev, color }));
  };

  const adjustPosition = (axis: 'x' | 'y', delta: number) => {
    setConfig(prev => ({
      ...prev,
      position: {
        ...prev.position,
        [axis]: prev.position[axis] + delta
      }
    }));
  };

  const adjustScale = (delta: number) => {
    setConfig(prev => ({
      ...prev,
      position: {
        ...prev.position,
        scale: Math.max(0.2, prev.position.scale + delta)
      }
    }));
  };

  const centerImage = () => {
    setConfig(prev => ({
      ...prev,
      position: {
        x: 0,
        y: 0.2, 
        scale: 1.0
      }
    }));
  };

  const handleCheckout = () => {
    // Capture snapshot if function exists
    if (captureRef.current) {
        const snapshot = captureRef.current();
        setConfig(prev => ({ ...prev, snapshotUrl: snapshot }));
    }
    onCheckout();
  };

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

        {/* Upload Image */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tu Diseño</label>
          
          {config.textureUrl && (
            <div className="relative w-full aspect-video bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden mb-3 border border-gray-200 dark:border-gray-700 flex items-center justify-center group">
                <img src={config.textureUrl} alt="Preview" className="h-full object-contain p-2" />
                <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] uppercase font-bold px-2 py-1 rounded backdrop-blur-md">
                    Vista previa
                </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 px-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-pink-500 hover:text-pink-500 dark:hover:border-pink-500 dark:hover:text-pink-400 transition-all flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 font-medium group"
          >
            {config.textureUrl ? (
                <>
                    <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Cambiar Imagen
                </>
            ) : (
                <>
                    <ImageIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Subir Imagen
                </>
            )}
          </button>
        </div>

        {/* Adjustments */}
        {config.textureUrl && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 uppercase tracking-wide">
                  <Move className="w-4 h-4" /> Posición
                </label>
                <button 
                   onClick={centerImage}
                   className="text-xs text-pink-500 hover:text-pink-600 font-bold flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> RESTAURAR
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
                <ZoomIn className="w-4 h-4" /> Tamaño
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
                  value={config.position.scale}
                  onChange={(e) => setConfig(prev => ({ ...prev, position: { ...prev.position, scale: parseFloat(e.target.value) } }))}
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
            className="w-full bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-500 hover:to-orange-400 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
          >
            COMPRAR AHORA
            <span className="bg-white/20 px-2 py-0.5 rounded text-sm backdrop-blur-sm">Desde {formatCurrency(PRICES['150g'])}</span>
          </button>
        </div>
      </div>
    </div>
  );
};