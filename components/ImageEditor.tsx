
import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Droplets, Sun, Contrast, Sliders, RotateCcw, Trash2, Scissors } from 'lucide-react';
import { DesignLayer } from '../types';

interface ImageEditorProps {
  layer: DesignLayer;
  onSave: (updatedLayer: DesignLayer) => void;
  onClose: () => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ layer, onSave, onClose }) => {
  const [filters, setFilters] = useState(layer.filters || { brightness: 100, contrast: 100, saturation: 100 });
  const [chromaKey, setChromaKey] = useState(layer.chromaKey || { enabled: false, color: '#ffffff', tolerance: 0.1 });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = layer.originalUrl || layer.textureUrl;
    img.onload = () => {
      sourceImageRef.current = img;
      applyFilters();
    };
  }, [layer]);

  const applyFilters = () => {
    const canvas = canvasRef.current;
    const img = sourceImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;

    // Apply CSS filters first for basic adj
    ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
    ctx.drawImage(img, 0, 0);

    // Apply Chroma Key if enabled
    if (chromaKey.enabled) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Parse chroma color
      const r_target = parseInt(chromaKey.color.slice(1, 3), 16);
      const g_target = parseInt(chromaKey.color.slice(3, 5), 16);
      const b_target = parseInt(chromaKey.color.slice(5, 7), 16);
      
      const tolerance = chromaKey.tolerance * 255;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Euclidean distance for color matching
        const diff = Math.sqrt(
          Math.pow(r - r_target, 2) + 
          Math.pow(g - g_target, 2) + 
          Math.pow(b - b_target, 2)
        );

        if (diff < tolerance) {
          data[i + 3] = 0; // Alpha to 0
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [filters, chromaKey]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsProcessing(true);
    const updatedUrl = canvas.toDataURL('image/png');
    
    onSave({
      ...layer,
      textureUrl: updatedUrl,
      originalUrl: layer.originalUrl || layer.textureUrl,
      filters,
      chromaKey
    });
    setIsProcessing(false);
  };

  const pickColorFromCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!chromaKey.enabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = "#" + ("000000" + ((pixel[0] << 16) | (pixel[1] << 8) | pixel[2]).toString(16)).slice(-6);
    setChromaKey({ ...chromaKey, color: hex });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-5xl h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-xl text-pink-600">
              <Scissors className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Editor de Imagen</h2>
              <p className="text-xs text-gray-500 font-medium">Ajustes avanzados y remoción de fondo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Main Area: Preview */}
          <div className="flex-1 bg-gray-100 dark:bg-gray-950 flex items-center justify-center p-8 relative overflow-hidden">
             {/* Checkerboard background for transparency */}
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 10%, transparent 10%), radial-gradient(#000 10%, transparent 10%)', backgroundPosition: '0 0, 15px 15px', backgroundSize: '30px 30px' }}></div>
             
             <div className="relative max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden flex items-center justify-center">
                <canvas 
                   ref={canvasRef} 
                   onClick={pickColorFromCanvas}
                   className={`max-w-full max-h-full object-contain ${chromaKey.enabled ? 'cursor-crosshair' : ''}`}
                />
             </div>

             {chromaKey.enabled && (
               <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-pink-600 text-white text-xs font-bold rounded-full shadow-lg">
                 Haz clic en la imagen para elegir el color a eliminar
               </div>
             )}
          </div>

          {/* Sidebar: Controls */}
          <div className="w-full lg:w-80 border-l border-gray-100 dark:border-gray-800 overflow-y-auto p-6 space-y-8 bg-white dark:bg-gray-900">
            {/* Filter Section */}
            <section className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Sliders className="w-3 h-3" /> Ajustes de Color
              </h3>
              
              <div className="space-y-6">
                {/* Brightness */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Sun className="w-3 h-3" /> Brillo
                    </label>
                    <span className="text-xs font-mono text-pink-500">{filters.brightness}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="200" value={filters.brightness} 
                    onChange={(e) => setFilters({...filters, brightness: parseInt(e.target.value)})}
                    className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                </div>

                {/* Contrast */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Contrast className="w-3 h-3" /> Contraste
                    </label>
                    <span className="text-xs font-mono text-pink-500">{filters.contrast}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="200" value={filters.contrast} 
                    onChange={(e) => setFilters({...filters, contrast: parseInt(e.target.value)})}
                    className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                </div>

                {/* Saturation */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Droplets className="w-3 h-3" /> Saturación
                    </label>
                    <span className="text-xs font-mono text-pink-500">{filters.saturation}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="200" value={filters.saturation} 
                    onChange={(e) => setFilters({...filters, saturation: parseInt(e.target.value)})}
                    className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                </div>
              </div>
            </section>

            {/* Background Removal Section */}
            <section className="space-y-4 pt-6 border-t border-gray-50 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Trash2 className="w-3 h-3" /> Quitar Fondo
                </h3>
                <button 
                  onClick={() => setChromaKey({...chromaKey, enabled: !chromaKey.enabled})}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${chromaKey.enabled ? 'bg-pink-600' : 'bg-gray-200 dark:bg-gray-800'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${chromaKey.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>

              {chromaKey.enabled && (
                <div className="space-y-4 animate-slide-up">
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <input 
                      type="color" value={chromaKey.color} 
                      onChange={(e) => setChromaKey({...chromaKey, color: e.target.value})}
                      className="w-8 h-8 rounded-md bg-transparent cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Croma actual</p>
                      <p className="text-sm font-mono font-bold">{chromaKey.color.toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Tolerancia</label>
                    <input 
                      type="range" min="0.01" max="0.5" step="0.01" value={chromaKey.tolerance} 
                      onChange={(e) => setChromaKey({...chromaKey, tolerance: parseFloat(e.target.value)})}
                      className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Reset */}
            <button 
              onClick={() => {
                setFilters({ brightness: 100, contrast: 100, saturation: 100 });
                setChromaKey({ enabled: false, color: '#ffffff', tolerance: 0.1 });
              }}
              className="w-full py-3 flex items-center justify-center gap-2 text-xs font-bold text-gray-500 hover:text-pink-500 bg-gray-50 dark:bg-gray-800 rounded-xl transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Restaurar Imagen
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex gap-4 bg-white dark:bg-gray-900 sticky bottom-0">
          <button 
            onClick={onClose}
            className="flex-1 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={isProcessing}
            className="flex-1 py-4 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-2xl shadow-xl shadow-pink-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isProcessing ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Aplicar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
