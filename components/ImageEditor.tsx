
import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Droplets, Sun, Contrast, Sliders, RotateCcw, Trash2, Scissors, Palette, Circle, Square, Heart, Star, Layers, Image as ImageIcon, Triangle as TriangleIcon, Hexagon, BoxSelect, RefreshCw } from 'lucide-react';
import { DesignLayer } from '../types';

interface ImageEditorProps {
  layer: DesignLayer;
  onSave: (updatedLayer: DesignLayer) => void;
  onClose: () => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ layer, onSave, onClose }) => {
  const [filters, setFilters] = useState(layer.filters || { brightness: 100, contrast: 100, saturation: 100, hueRotation: 0, tint: 'transparent' });
  const [chromaKey, setChromaKey] = useState(layer.chromaKey || { enabled: false, color: '#ffffff', tolerance: 0.1 });
  const [mask, setMask] = useState<'none' | 'circle' | 'square' | 'heart' | 'star' | 'hexagon' | 'triangle' | 'torn'>(layer.mask || 'none');
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

  const drawTornRect = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const segments = 80;
    const jitter = Math.min(w, h) * 0.04;
    
    ctx.beginPath();
    
    // Top side
    for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * w;
        const y = (Math.random() - 0.5) * jitter;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    
    // Right side
    for (let i = 0; i <= segments; i++) {
        const y = (i / segments) * h;
        const x = w + (Math.random() - 0.5) * jitter;
        ctx.lineTo(x, y);
    }
    
    // Bottom side
    for (let i = segments; i >= 0; i--) {
        const x = (i / segments) * w;
        const y = h + (Math.random() - 0.5) * jitter;
        ctx.lineTo(x, y);
    }
    
    // Left side
    for (let i = segments; i >= 0; i--) {
        const y = (i / segments) * h;
        const x = (Math.random() - 0.5) * jitter;
        ctx.lineTo(x, y);
    }
    
    ctx.closePath();
  };

  const drawMask = (ctx: CanvasRenderingContext2D, width: number, height: number, type: string) => {
    ctx.beginPath();
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2;

    if (type === 'circle') {
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    } else if (type === 'square') {
      const size = Math.min(width, height) * 0.9;
      ctx.rect(centerX - size/2, centerY - size/2, size, size);
    } else if (type === 'heart') {
      const x = centerX - radius;
      const y = centerY - radius;
      const w = radius * 2;
      const h = radius * 2;
      ctx.moveTo(centerX, y + h / 4);
      ctx.bezierCurveTo(centerX, y, x, y, x, y + h / 4);
      ctx.bezierCurveTo(x, y + h / 2, centerX, y + h * 3/4, centerX, y + h);
      ctx.bezierCurveTo(centerX, y + h * 3/4, x + w, y + h / 2, x + w, y + h / 4);
      ctx.bezierCurveTo(x + w, y, centerX, y, centerX, y + h / 4);
    } else if (type === 'star') {
      const spikes = 5;
      const outerRadius = radius;
      const innerRadius = radius / 2.5;
      let rot = (Math.PI / 2) * 3;
      let x = centerX;
      let y = centerY;
      const step = Math.PI / spikes;

      ctx.moveTo(centerX, centerY - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = centerX + Math.cos(rot) * outerRadius;
        y = centerY + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;
        x = centerX + Math.cos(rot) * innerRadius;
        y = centerY + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(centerX, centerY - outerRadius);
      ctx.closePath();
    } else if (type === 'hexagon') {
      const size = radius;
      ctx.moveTo(centerX + size * Math.cos(0), centerY + size * Math.sin(0));
      for (let i = 1; i <= 6; i++) {
        ctx.lineTo(centerX + size * Math.cos(i * 2 * Math.PI / 6), centerY + size * Math.sin(i * 2 * Math.PI / 6));
      }
      ctx.closePath();
    } else if (type === 'triangle') {
      const size = radius;
      ctx.moveTo(centerX, centerY - size);
      ctx.lineTo(centerX + size * Math.cos(Math.PI / 6), centerY + size * Math.sin(Math.PI / 6));
      ctx.lineTo(centerX - size * Math.cos(Math.PI / 6), centerY + size * Math.sin(Math.PI / 6));
      ctx.closePath();
    } else if (type === 'torn') {
       drawTornRect(ctx, width, height);
    }
  };

  const applyFilters = () => {
    const canvas = canvasRef.current;
    const img = sourceImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (mask !== 'none') {
      ctx.save();
      drawMask(ctx, canvas.width, canvas.height, mask);
      ctx.clip();
    }

    ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) hue-rotate(${filters.hueRotation || 0}deg)`;
    ctx.drawImage(img, 0, 0);

    if (filters.tint && filters.tint !== 'transparent') {
      ctx.save();
      if (mask !== 'none') {
        drawMask(ctx, canvas.width, canvas.height, mask);
        ctx.clip();
      }
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = filters.tint;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    }

    if (mask !== 'none') {
      ctx.restore();
    }

    if (chromaKey.enabled) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const r_target = parseInt(chromaKey.color.slice(1, 3), 16);
      const g_target = parseInt(chromaKey.color.slice(3, 5), 16);
      const b_target = parseInt(chromaKey.color.slice(5, 7), 16);
      const tolerance = chromaKey.tolerance * 255;

      for (let i = 0; i < data.length; i += 4) {
        if (data[i+3] === 0) continue;
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        const diff = Math.sqrt(Math.pow(r - r_target, 2) + Math.pow(g - g_target, 2) + Math.pow(b - b_target, 2));
        if (diff < tolerance) data[i + 3] = 0;
      }
      ctx.putImageData(imageData, 0, 0);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [filters, chromaKey, mask]);

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
      chromaKey,
      mask
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in shadow-inner">
      <div className="bg-white dark:bg-gray-900 w-full max-w-6xl h-[95vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-2xl text-pink-600">
              <Scissors className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Estudio de Edición</h2>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Personaliza tu diseño al máximo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all hover:rotate-90">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Main Area: Preview */}
          <div className="flex-1 bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 lg:p-12 relative overflow-hidden">
             <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
             
             <div className="relative w-full h-full flex items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center shadow-2xl rounded-2xl overflow-hidden bg-white/50 dark:bg-white/5 p-4 backdrop-blur-sm">
                    <canvas 
                       ref={canvasRef} 
                       onClick={pickColorFromCanvas}
                       className={`max-w-full max-h-full object-contain ${chromaKey.enabled ? 'cursor-crosshair animate-pulse' : ''} shadow-lg rounded-lg`}
                       style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%' }}
                    />
                </div>
             </div>

             {chromaKey.enabled && (
               <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-pink-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-2xl animate-bounce">
                 SELECCIONA EL COLOR A ELIMINAR EN LA IMAGEN
               </div>
             )}
          </div>

          {/* Sidebar: Controls */}
          <div className="w-full lg:w-96 border-l border-gray-100 dark:border-gray-800 overflow-y-auto p-8 space-y-10 bg-white dark:bg-gray-900 custom-scrollbar">
            {/* Color Section */}
            <section className="space-y-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-pink-500" /> Parámetros de Color
              </h3>
              
              <div className="space-y-6">
                {/* Brightness */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Sun className="w-4 h-4 opacity-50" /> Brillo
                    </label>
                    <span className="text-[10px] font-black text-pink-500 bg-pink-50 dark:bg-pink-900/20 px-2 py-0.5 rounded-full">{filters.brightness}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="200" value={filters.brightness} 
                    onChange={(e) => setFilters({...filters, brightness: parseInt(e.target.value)})}
                    className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                </div>

                {/* Contrast */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Contrast className="w-4 h-4 opacity-50" /> Contraste
                    </label>
                    <span className="text-[10px] font-black text-pink-500 bg-pink-50 dark:bg-pink-900/20 px-2 py-0.5 rounded-full">{filters.contrast}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="200" value={filters.contrast} 
                    onChange={(e) => setFilters({...filters, contrast: parseInt(e.target.value)})}
                    className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                </div>

                {/* Hue Rotation */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Palette className="w-4 h-4 opacity-50" /> Tono / Hue
                    </label>
                    <span className="text-[10px] font-black text-pink-500 bg-pink-50 dark:bg-pink-900/20 px-2 py-0.5 rounded-full">{filters.hueRotation}°</span>
                  </div>
                  <input 
                    type="range" min="0" max="360" value={filters.hueRotation || 0} 
                    onChange={(e) => setFilters({...filters, hueRotation: parseInt(e.target.value)})}
                    className="w-full h-1.5 bg-gradient-to-r from-red-500 via-green-500 via-blue-500 to-red-500 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                 {/* Tint */}
                 <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Droplets className="w-4 h-4 opacity-50" /> Tintado (Overlay)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['transparent', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff', '#000000'].map(color => (
                        <button
                          key={color}
                          onClick={() => setFilters({...filters, tint: color})}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${filters.tint === color ? 'border-pink-500 scale-110 shadow-lg' : 'border-gray-200 dark:border-gray-700 hover:scale-105'}`}
                          style={{ backgroundColor: color === 'transparent' ? 'white' : color, backgroundImage: color === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : 'none', backgroundPosition: '0 0, 5px 5px', backgroundSize: '10px 10px' }}
                        />
                    ))}
                    <input 
                      type="color" 
                      value={filters.tint && filters.tint.startsWith('#') ? filters.tint : '#ffffff'} 
                      onChange={(e) => setFilters({...filters, tint: e.target.value})}
                      className="w-7 h-7 rounded-full bg-transparent cursor-pointer border-2 border-gray-200 dark:border-gray-700"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Mask Section */}
            <section className="space-y-6 pt-10 border-t border-gray-50 dark:border-gray-800">
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] flex items-center gap-2">
                <Layers className="w-4 h-4 text-pink-500" /> Mascaras de Forma y Recorte
              </h3>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { id: 'none' as const, icon: <ImageIcon className="w-5 h-5" />, title: 'Original' },
                  { id: 'circle' as const, icon: <Circle className="w-5 h-5" />, title: 'Círculo' },
                  { id: 'square' as const, icon: <Square className="w-5 h-5" />, title: 'Cuadrado' },
                  { id: 'torn' as const, icon: <BoxSelect className="w-5 h-5" />, title: 'Rasgado' },
                  { id: 'hexagon' as const, icon: <Hexagon className="w-5 h-5" />, title: 'Hexágono' },
                  { id: 'triangle' as const, icon: <TriangleIcon className="w-5 h-5" />, title: 'Triángulo' },
                  { id: 'heart' as const, icon: <Heart className="w-5 h-5" />, title: 'Corazón' },
                  { id: 'star' as const, icon: <Star className="w-5 h-5" />, title: 'Estrella' },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMask(m.id)}
                    title={m.title}
                    className={`aspect-square flex items-center justify-center rounded-2xl transition-all border ${mask === m.id ? 'bg-pink-600 text-white border-pink-600 shadow-xl shadow-pink-500/20 scale-105' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 border-transparent hover:border-gray-300'}`}
                  >
                    {m.icon}
                  </button>
                ))}
              </div>
            </section>

            {/* Background Removal Section */}
            <section className="space-y-6 pt-10 border-t border-gray-50 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-pink-500" /> Quitar Fondo (Chroma)
                </h3>
                <button 
                  onClick={() => setChromaKey({...chromaKey, enabled: !chromaKey.enabled})}
                  className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${chromaKey.enabled ? 'bg-pink-600 shadow-lg shadow-pink-500/30' : 'bg-gray-200 dark:bg-gray-800'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ${chromaKey.enabled ? 'translate-x-6 shadow-sm' : 'translate-x-1'}`} />
                </button>
              </div>

              {chromaKey.enabled && (
                <div className="space-y-5 animate-slide-up bg-pink-50/50 dark:bg-pink-900/10 p-5 rounded-3xl border border-pink-100 dark:border-pink-900/30">
                  <div className="flex items-center gap-4">
                    <input 
                      type="color" value={chromaKey.color} 
                      onChange={(e) => setChromaKey({...chromaKey, color: e.target.value})}
                      className="w-12 h-12 rounded-xl bg-transparent cursor-pointer border-2 border-white dark:border-gray-700 shadow-md"
                    />
                    <div className="flex-1">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Color Seleccionado</p>
                      <p className="text-sm font-mono font-black text-gray-900 dark:text-white">{chromaKey.color.toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                         <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Tolerancia</label>
                         <span className="text-[10px] font-black text-pink-500">{Math.round(chromaKey.tolerance * 100)}%</span>
                    </div>
                    <input 
                      type="range" min="0.01" max="0.5" step="0.01" value={chromaKey.tolerance} 
                      onChange={(e) => setChromaKey({...chromaKey, tolerance: parseFloat(e.target.value)})}
                      className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Reset */}
            <div className="pt-4">
                <button 
                onClick={() => {
                    setFilters({ brightness: 100, contrast: 100, saturation: 100, hueRotation: 0, tint: 'transparent' });
                    setChromaKey({ enabled: false, color: '#ffffff', tolerance: 0.1 });
                    setMask('none');
                }}
                className="w-full py-4 flex items-center justify-center gap-3 text-xs font-black text-gray-500 hover:text-pink-600 bg-gray-50 dark:bg-gray-800 rounded-2xl transition-all border border-transparent hover:border-pink-100 dark:hover:border-pink-900/30 active:scale-95"
                >
                <RotateCcw className="w-4 h-4" /> REINICIAR IMAGEN
                </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-100 dark:border-gray-800 flex gap-4 bg-white dark:bg-gray-900 sticky bottom-0">
          <button 
            onClick={onClose}
            className="flex-1 py-5 text-xs font-black text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-[1.25rem] transition-all tracking-widest"
          >
            DESCARTAR
          </button>
          <button 
            onClick={handleSave}
            disabled={isProcessing}
            className="flex-[2] py-5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-black rounded-[1.25rem] shadow-2xl shadow-pink-500/20 flex items-center justify-center gap-3 transition-all disabled:opacity-50 active:scale-[0.98] tracking-[0.1em]"
          >
            {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            GUARDAR CAMBIOS
          </button>
        </div>
      </div>
    </div>
  );
};

