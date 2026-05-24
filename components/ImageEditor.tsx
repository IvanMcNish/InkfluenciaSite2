import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Check,
  Droplets,
  Sun,
  Contrast,
  Sliders,
  RotateCcw,
  Trash2,
  Scissors,
  Palette,
  Circle,
  Square,
  Heart,
  Star,
  Layers,
  Image as ImageIcon,
  Triangle as TriangleIcon,
  Hexagon,
  BoxSelect,
  RefreshCw,
  ZoomIn,
  Sparkles,
  Flame,
  Focus,
  CloudRain,
  LayoutTemplate,
  ChevronDown
} from "lucide-react";
import { DesignLayer } from "../types";

interface ImageEditorProps {
  layer: DesignLayer;
  onSave: (updatedLayer: DesignLayer) => void;
  onClose: () => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({
  layer,
  onSave,
  onClose,
}) => {
  const [filters, setFilters] = useState(
    layer.filters || {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hueRotation: 0,
      tint: "transparent",
    },
  );
  const [chromaKey, setChromaKey] = useState(
    layer.chromaKey || { enabled: false, color: "#ffffff", tolerance: 0.1 },
  );
  const [mask, setMask] = useState<
    | "none"
    | "circle"
    | "square"
    | "heart"
    | "star"
    | "hexagon"
    | "triangle"
    | "torn"
  >(layer.mask || "none");
  const [maskScale, setMaskScale] = useState<number>(layer.maskScale ?? 100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPanelHidden, setIsPanelHidden] = useState(false);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string>("brightness");

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

  const drawTornRect = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
  ) => {
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

  const drawMask = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    type: string,
    scale: number = 100,
  ) => {
    ctx.save();
    const centerX = width / 2;
    const centerY = height / 2;
    const scaleFactor = scale / 100;

    if (scaleFactor !== 1) {
      ctx.translate(centerX, centerY);
      ctx.scale(scaleFactor, scaleFactor);
      ctx.translate(-centerX, -centerY);
    }

    ctx.beginPath();
    const radius = Math.min(width, height) / 2;

    if (type === "circle") {
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    } else if (type === "square") {
      const size = Math.min(width, height) * 0.9;
      ctx.rect(centerX - size / 2, centerY - size / 2, size, size);
    } else if (type === "heart") {
      const x = centerX - radius;
      const y = centerY - radius;
      const w = radius * 2;
      const h = radius * 2;
      ctx.moveTo(centerX, y + h / 4);
      ctx.bezierCurveTo(centerX, y, x, y, x, y + h / 4);
      ctx.bezierCurveTo(x, y + h / 2, centerX, y + (h * 3) / 4, centerX, y + h);
      ctx.bezierCurveTo(
        centerX,
        y + (h * 3) / 4,
        x + w,
        y + h / 2,
        x + w,
        y + h / 4,
      );
      ctx.bezierCurveTo(x + w, y, centerX, y, centerX, y + h / 4);
    } else if (type === "star") {
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
    } else if (type === "hexagon") {
      const size = radius;
      ctx.moveTo(centerX + size * Math.cos(0), centerY + size * Math.sin(0));
      for (let i = 1; i <= 6; i++) {
        ctx.lineTo(
          centerX + size * Math.cos((i * 2 * Math.PI) / 6),
          centerY + size * Math.sin((i * 2 * Math.PI) / 6),
        );
      }
      ctx.closePath();
    } else if (type === "triangle") {
      const size = radius;
      ctx.moveTo(centerX, centerY - size);
      ctx.lineTo(
        centerX + size * Math.cos(Math.PI / 6),
        centerY + size * Math.sin(Math.PI / 6),
      );
      ctx.lineTo(
        centerX - size * Math.cos(Math.PI / 6),
        centerY + size * Math.sin(Math.PI / 6),
      );
      ctx.closePath();
    } else if (type === "torn") {
      drawTornRect(ctx, width, height);
    }
    ctx.restore();
  };

  const applyFilters = () => {
    const canvas = canvasRef.current;
    const img = sourceImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (mask !== "none") {
      ctx.save();
      drawMask(ctx, canvas.width, canvas.height, mask, maskScale);
      ctx.clip();
    }

    ctx.filter = `brightness(${filters.brightness ?? 100}%) contrast(${filters.contrast ?? 100}%) saturate(${filters.saturation ?? 100}%) hue-rotate(${filters.hueRotation || 0}deg)`;
    ctx.drawImage(img, 0, 0);

    // Apply noise, grime, vignette, light leak here

    // Vignette
    if (filters.vignette && filters.vignette > 0) {
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) / 2,
      );
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, `rgba(0,0,0,${(filters.vignette / 100) * 0.8})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Light Leak (foto quemada)
    if (filters.lightLeak && filters.lightLeak > 0) {
      ctx.globalCompositeOperation = "screen";
      const leakGradient = ctx.createLinearGradient(
        0,
        0,
        canvas.width * 0.5,
        canvas.height * 0.5,
      );
      leakGradient.addColorStop(
        0,
        `rgba(255, 120, 50, ${(filters.lightLeak / 100) * 0.7})`,
      );
      leakGradient.addColorStop(
        0.5,
        `rgba(255, 50, 0, ${(filters.lightLeak / 100) * 0.3})`,
      );
      leakGradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = leakGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
    }

    // Noise (using getImageData)
    if (
      (filters.noise && filters.noise > 0) ||
      (filters.grime && filters.grime > 0)
    ) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const noiseLevel = (filters.noise || 0) * 1.5;
      const grimeLevel = (filters.grime || 0) * 0.8;

      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] === 0) continue; // skip transparent

        // Add Noise
        if (noiseLevel > 0) {
          const noiseFactor = (Math.random() - 0.5) * noiseLevel;
          data[i] = Math.min(255, Math.max(0, data[i] + noiseFactor));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noiseFactor));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noiseFactor));
        }

        // Add Grime (random black/brown scratches and dust)
        if (grimeLevel > 0 && Math.random() < (grimeLevel / 100) * 0.05) {
          const isScratch = Math.random() > 0.8;
          if (isScratch) {
            // We will add scratches later using path drawing, pixel-based is harder
            // just add some dust spots
            data[i] *= 0.5;
            data[i + 1] *= 0.4;
            data[i + 2] *= 0.3;
          } else {
            data[i] = Math.max(0, data[i] - 50);
            data[i + 1] = Math.max(0, data[i + 1] - 40);
            data[i + 2] = Math.max(0, data[i + 2] - 30);
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);

      // Add Grime scratches using canvas API
      if (filters.grime && filters.grime > 0) {
        ctx.save();
        const scratchCount = Math.floor((filters.grime / 100) * 50);
        ctx.strokeStyle = `rgba(0, 0, 0, ${0.1 + (filters.grime / 100) * 0.3})`;
        for (let s = 0; s < scratchCount; s++) {
          ctx.lineWidth = Math.random() * 2;
          ctx.beginPath();
          const startX = Math.random() * canvas.width;
          const startY = Math.random() * canvas.height;
          ctx.moveTo(startX, startY);
          ctx.lineTo(
            startX + (Math.random() - 0.5) * 50,
            startY + (Math.random() - 0.5) * 100,
          );
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    if (filters.tint && filters.tint !== "transparent") {
      ctx.save();
      if (mask !== "none") {
        drawMask(ctx, canvas.width, canvas.height, mask);
        ctx.clip();
      }
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = filters.tint;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
    }

    if (mask !== "none") {
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
        if (data[i + 3] === 0) continue;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const diff = Math.sqrt(
          Math.pow(r - r_target, 2) +
            Math.pow(g - g_target, 2) +
            Math.pow(b - b_target, 2),
        );
        if (diff < tolerance) data[i + 3] = 0;
      }
      ctx.putImageData(imageData, 0, 0);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [filters, chromaKey, mask, maskScale]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsProcessing(true);
    const updatedUrl = canvas.toDataURL("image/png");
    onSave({
      ...layer,
      textureUrl: updatedUrl,
      originalUrl: layer.originalUrl || layer.textureUrl,
      filters,
      chromaKey,
      mask,
      maskScale,
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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex =
      "#" +
      (
        "000000" + ((pixel[0] << 16) | (pixel[1] << 8) | pixel[2]).toString(16)
      ).slice(-6);
    setChromaKey({ ...chromaKey, color: hex });
  };

  const AccordionItem = ({ id, icon, title, children }: any) => {
    const isOpen = openAccordion === id;
    return (
      <div className="border border-white/40 dark:border-gray-800/60 rounded-2xl overflow-hidden mb-3 liquid-glass transition-all duration-300 shadow-sm">
        <button 
          onClick={() => setOpenAccordion(isOpen ? "" : id)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-white/40 dark:hover:bg-gray-900/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-colors ${isOpen ? 'bg-gradient-to-tr from-pink-500 to-orange-500 text-white shadow-md' : 'bg-gray-100/50 dark:bg-gray-800/50 text-pink-500/80'}`}>
              {icon}
            </div>
            <span className="font-extrabold text-gray-800 dark:text-gray-200 text-[10px] tracking-widest uppercase">{title}</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        <div 
          className={`transition-all duration-300 ease-in-out origin-top ${isOpen ? 'opacity-100 max-h-[1000px] pb-4' : 'opacity-0 max-h-0'}`}
        >
          <div className="px-4">
            {children}
          </div>
        </div>
      </div>
    );
  };

  const sections = [
    {
      id: "brightness",
      icon: <Sun className="w-5 h-5 flex-shrink-0" />,
      title: "Brillo y Contraste",
      content: (
        <div className="space-y-4 lg:space-y-5 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Sun className="w-3.5 h-3.5 opacity-50" /> Brillo
              </label>
              <span className="text-[9px] font-black text-pink-500 bg-pink-50 dark:bg-pink-900/20 px-1.5 py-0.5 rounded-full">
                {filters.brightness}%
              </span>
            </div>
            <input
              type="range" min="0" max="200" value={filters.brightness}
              onChange={(e) => setFilters({ ...filters, brightness: parseInt(e.target.value) })}
              className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Contrast className="w-3.5 h-3.5 opacity-50" /> Contraste
              </label>
              <span className="text-[9px] font-black text-pink-500 bg-pink-50 dark:bg-pink-900/20 px-1.5 py-0.5 rounded-full">
                {filters.contrast}%
              </span>
            </div>
            <input
              type="range" min="0" max="200" value={filters.contrast}
              onChange={(e) => setFilters({ ...filters, contrast: parseInt(e.target.value) })}
              className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
          </div>
        </div>
      )
    },
    {
      id: "hue",
      icon: <Palette className="w-5 h-5 flex-shrink-0" />,
      title: "Tono y Tintado",
      content: (
        <div className="space-y-4 lg:space-y-5 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 opacity-50" /> Tono
              </label>
              <span className="text-[9px] font-black text-pink-500 bg-pink-50 dark:bg-pink-900/20 px-1.5 py-0.5 rounded-full">
                {filters.hueRotation}°
              </span>
            </div>
            <input
              type="range" min="0" max="360" value={filters.hueRotation || 0}
              onChange={(e) => setFilters({ ...filters, hueRotation: parseInt(e.target.value) })}
              className="w-full h-1 bg-gradient-to-r from-red-500 via-green-500 via-blue-500 to-red-500 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Droplets className="w-3.5 h-3.5 opacity-50" /> Tintado
            </label>
            <div className="flex flex-wrap gap-1.5">
              {["transparent", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ffffff", "#000000"].map((color) => (
                <button
                  key={color} onClick={() => setFilters({ ...filters, tint: color })}
                  className={`w-6 h-6 rounded-full border transition-all ${filters.tint === color ? "border-pink-500 scale-110 shadow-md" : "border-gray-200 dark:border-gray-700"}`}
                  style={{
                    backgroundColor: color === "transparent" ? "white" : color,
                    backgroundImage: color === "transparent" ? "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)" : "none",
                    backgroundPosition: "0 0, 4px 4px", backgroundSize: "8px 8px",
                  }}
                />
              ))}
              <input
                type="color" value={filters.tint && filters.tint.startsWith("#") ? filters.tint : "#ffffff"}
                onChange={(e) => setFilters({ ...filters, tint: e.target.value })}
                className="w-6 h-6 rounded-full bg-transparent cursor-pointer border border-gray-200 dark:border-gray-700"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: "mask",
      icon: <Layers className="w-5 h-5 flex-shrink-0" />,
      title: "Máscara y Recorte",
      content: (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-4 gap-2">
            {[
              { id: "none" as const, icon: <ImageIcon className="w-4 h-4" />, title: "Original" },
              { id: "circle" as const, icon: <Circle className="w-4 h-4" />, title: "Círculo" },
              { id: "square" as const, icon: <Square className="w-4 h-4" />, title: "Cuadrado" },
              { id: "torn" as const, icon: <BoxSelect className="w-4 h-4" />, title: "Rasgado" },
              { id: "hexagon" as const, icon: <Hexagon className="w-4 h-4" />, title: "Hexágono" },
              { id: "triangle" as const, icon: <TriangleIcon className="w-4 h-4" />, title: "Triángulo" },
              { id: "heart" as const, icon: <Heart className="w-4 h-4" />, title: "Corazón" },
              { id: "star" as const, icon: <Star className="w-4 h-4" />, title: "Estrella" },
            ].map((m) => (
              <button
                key={m.id} onClick={() => setMask(m.id)} title={m.title}
                className={`aspect-square flex items-center justify-center rounded-xl transition-all border ${mask === m.id ? "bg-pink-600 text-white border-pink-600 shadow-lg shadow-pink-500/20 scale-105" : "bg-gray-50 dark:bg-gray-800 text-gray-400 border-transparent hover:border-gray-200"}`}
              >
                {m.icon}
              </button>
            ))}
          </div>
          {mask !== "none" && (
            <div className="space-y-2 pt-2 animate-fade-in">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <ZoomIn className="w-3.5 h-3.5 opacity-50" /> Tamaño Máscara
                </label>
                <span className="text-[9px] font-black text-pink-500 bg-pink-50 dark:bg-pink-900/20 px-1.5 py-0.5 rounded-full">
                  {maskScale}%
                </span>
              </div>
              <input type="range" min="10" max="200" value={maskScale} onChange={(e) => setMaskScale(parseInt(e.target.value))} className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-pink-500" />
            </div>
          )}
        </div>
      )
    },
    {
      id: "analog",
      icon: <Sparkles className="w-5 h-5 flex-shrink-0" />,
      title: "Viñeta y Ruido",
      content: (
        <div className="space-y-4 lg:space-y-5 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Focus className="w-3.5 h-3.5 opacity-50" /> Viñeta
              </label>
              <span className="text-[9px] font-black text-pink-500 bg-pink-50 dark:bg-pink-900/20 px-1.5 py-0.5 rounded-full">{filters.vignette || 0}%</span>
            </div>
            <input type="range" min="0" max="100" value={filters.vignette || 0} onChange={(e) => setFilters({ ...filters, vignette: parseInt(e.target.value) })} className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-pink-500" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 opacity-50" /> Ruido (Grain)
              </label>
              <span className="text-[9px] font-black text-pink-500 bg-pink-50 dark:bg-pink-900/20 px-1.5 py-0.5 rounded-full">{filters.noise || 0}%</span>
            </div>
            <input type="range" min="0" max="100" value={filters.noise || 0} onChange={(e) => setFilters({ ...filters, noise: parseInt(e.target.value) })} className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-pink-500" />
          </div>
        </div>
      )
    },
    {
      id: "burn",
      icon: <Flame className="w-5 h-5 flex-shrink-0" />,
      title: "Foto Quemada y Mugre",
      content: (
        <div className="space-y-4 lg:space-y-5 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 opacity-50" /> Foto Quemada
              </label>
              <span className="text-[9px] font-black text-pink-500 bg-pink-50 dark:bg-pink-900/20 px-1.5 py-0.5 rounded-full">{filters.lightLeak || 0}%</span>
            </div>
            <input type="range" min="0" max="100" value={filters.lightLeak || 0} onChange={(e) => setFilters({ ...filters, lightLeak: parseInt(e.target.value) })} className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-pink-500" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <CloudRain className="w-3.5 h-3.5 opacity-50" /> Mugre / Polvo
              </label>
              <span className="text-[9px] font-black text-pink-500 bg-pink-50 dark:bg-pink-900/20 px-1.5 py-0.5 rounded-full">{filters.grime || 0}%</span>
            </div>
            <input type="range" min="0" max="100" value={filters.grime || 0} onChange={(e) => setFilters({ ...filters, grime: parseInt(e.target.value) })} className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-pink-500" />
          </div>
        </div>
      )
    },
    {
      id: "bg-remove",
      icon: <Trash2 className="w-5 h-5 flex-shrink-0" />,
      title: "Quitar Fondo",
      content: (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[9px] lg:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              {chromaKey.enabled ? 'Habilitado' : 'Deshabilitado'}
            </h3>
            <button
              onClick={() => setChromaKey({ ...chromaKey, enabled: !chromaKey.enabled })}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${chromaKey.enabled ? "bg-pink-600 shadow-lg shadow-pink-500/30" : "bg-gray-200 dark:bg-gray-800"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${chromaKey.enabled ? "translate-x-5 shadow-sm" : "translate-x-1"}`} />
            </button>
          </div>
          {chromaKey.enabled && (
            <div className="space-y-3 animate-slide-up bg-pink-50/50 dark:bg-pink-900/10 p-4 rounded-2xl border border-pink-100 dark:border-pink-900/30">
              <div className="flex items-center gap-3">
                <input type="color" value={chromaKey.color} onChange={(e) => setChromaKey({ ...chromaKey, color: e.target.value })} className="w-10 h-10 rounded-lg bg-transparent cursor-pointer border border-white dark:border-gray-700 shadow-sm" />
                <div className="flex-1">
                  <p className="text-[8px] font-black text-gray-400 uppercase">Color</p>
                  <p className="text-xs font-mono font-black text-gray-900 dark:text-white">{chromaKey.color.toUpperCase()}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Tolerancia</label>
                  <span className="text-[10px] font-black text-pink-500">{Math.round(chromaKey.tolerance * 100)}%</span>
                </div>
                <input type="range" min="0.01" max="0.5" step="0.01" value={chromaKey.tolerance} onChange={(e) => setChromaKey({ ...chromaKey, tolerance: parseFloat(e.target.value) })} className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-pink-500" />
              </div>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex animate-fade-in overflow-hidden">
      {/* Deep Background */}
      <div className="absolute inset-0 bg-[url('/light.jpeg')] dark:bg-[url('/dark.jpeg')] bg-cover bg-center blur-md scale-110 opacity-50 z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-white/70 dark:bg-black/80 backdrop-blur-2xl z-0 pointer-events-none" />

      {/* Main Content Area */}
      <div className="relative w-full h-full flex flex-col lg:flex-row z-10 overflow-hidden lg:overflow-visible">
        
        {/* Top Header / Mobile & Desktop */}
        <div className="absolute top-4 left-4 right-4 z-[120] flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full pointer-events-auto shadow-lg liquid-glass">
            <div className="p-1.5 bg-pink-500 rounded-full text-white">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-gray-800 dark:text-gray-100 hidden sm:block">
                Estudio de Edición
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="lg:hidden p-3 rounded-full shadow-lg bg-pink-500 text-white hover:bg-pink-600 transition-all hover:scale-105 active:scale-95 flex items-center justify-center disabled:opacity-50"
              title="Guardar"
            >
              {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-3 rounded-full shadow-lg text-gray-600 dark:text-gray-300 hover:text-pink-600 transition-all hover:scale-105 bg-white/70 dark:bg-black/70 backdrop-blur-md"
              title="Descartar y Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 h-full w-full flex items-center justify-center p-4 lg:p-12 relative overflow-hidden pt-20 lg:pt-0">
          <div className="relative w-full h-full lg:h-full flex items-center justify-center">
             <canvas
                ref={canvasRef}
                onClick={pickColorFromCanvas}
                className={`max-w-full max-h-[70vh] lg:max-h-full object-contain ${chromaKey.enabled ? "cursor-crosshair animate-pulse" : ""} shadow-2xl rounded-2xl group`}
                style={{
                  width: "auto",
                  height: "auto",
                  maxWidth: "100%",
                }}
              />
          </div>

          {chromaKey.enabled && (
            <div className="absolute top-24 lg:bottom-8 left-1/2 -translate-x-1/2 px-4 lg:px-6 py-2 lg:py-3 bg-pink-600 text-white text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-2xl animate-bounce z-20">
              SELECCIONA EL COLOR EN LA IMAGEN
            </div>
          )}
          
          {/* Invoke Panel Button (Desktop) & Mobile Trigger */}
          {isPanelHidden && (
            <button 
              onClick={() => setIsPanelHidden(false)}
              className="hidden lg:flex absolute bottom-8 right-8 z-50 items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all font-bold animate-fade-in hover:scale-105 liquid-glass"
            >
              <LayoutTemplate className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wider">Parámetros</span>
            </button>
          )}

          {/* Trigger Rotatorio para Mobile */}
          <button
            onClick={() => {
                setIsMobilePanelOpen(!isMobilePanelOpen);
                if (isMobilePanelOpen) {
                    setOpenAccordion("");
                }
            }}
            className={`lg:hidden absolute z-[130] bottom-4 right-4 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center liquid-glass transition-all duration-500 hover:scale-105 active:scale-95 border ${
              isMobilePanelOpen ? 'bg-pink-600/90 text-white shadow-pink-500/50 border-transparent' : 'text-pink-600 bg-white/70 dark:bg-black/70 backdrop-blur-xl border-white/20 dark:border-white/10'
            }`}
          >
            <Sliders className={`w-6 h-6 transition-transform duration-500 ${isMobilePanelOpen ? 'rotate-180 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} style={{ position: 'absolute' }} />
            <X className={`w-6 h-6 transition-transform duration-500 ${isMobilePanelOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-180 scale-0 opacity-0'}`} style={{ position: 'absolute' }} />
          </button>

          {/* Mobile Toolbar */}
          <div 
            className={`lg:hidden absolute bottom-4 left-4 right-20 z-[120] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              isMobilePanelOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-[150%] opacity-0 pointer-events-none'
            }`}
          >
            <div className="flex items-center gap-2 overflow-x-auto py-2 px-3 bg-white/70 dark:bg-black/70 backdrop-blur-2xl rounded-full shadow-xl border border-white/20 hide-scrollbar liquid-glass">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => setOpenAccordion(openAccordion === s.id ? "" : s.id)}
                  className={`p-3 rounded-full flex-shrink-0 transition-colors ${openAccordion === s.id ? 'bg-gradient-to-tr from-pink-500 to-orange-500 text-white shadow-md' : 'bg-white/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:text-pink-500'}`}
                  title={s.title}
                >
                  {s.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Floating Mini Panel */}
          <div 
            className={`lg:hidden absolute bottom-24 left-4 right-4 z-[115] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              isMobilePanelOpen && openAccordion ? 'translate-y-0 opacity-100 pointer-events-auto scale-100 object-top' : 'translate-y-10 opacity-0 pointer-events-none scale-95 origin-bottom'
            }`}
          >
            <div className="bg-white/80 dark:bg-black/80 backdrop-blur-3xl rounded-3xl p-5 shadow-2xl border border-white/20 dark:border-white/10 liquid-glass max-h-[50vh] overflow-y-auto custom-scrollbar">
              {sections.find(s => s.id === openAccordion) && (
                <>
                  <div className="flex items-center gap-3 mb-4 border-b border-gray-200/50 dark:border-gray-800/50 pb-3">
                    <div className="text-pink-500">
                      {sections.find(s => s.id === openAccordion)?.icon}
                    </div>
                    <span className="font-black text-[11px] tracking-[0.2em] uppercase text-gray-800 dark:text-gray-200">
                      {sections.find(s => s.id === openAccordion)?.title}
                    </span>
                  </div>
                  {sections.find(s => s.id === openAccordion)?.content}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Floating Settings Panel (Desktop) */}
        <div className={`hidden lg:flex absolute right-0 w-[420px] h-full z-[105] flex-col p-4 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isPanelHidden ? 'translate-x-[120%] opacity-0' : 'translate-x-0 opacity-100'
        }`}>
          <div className="p-6 rounded-2xl shadow-2xl flex flex-col overflow-y-auto flex-1 pointer-events-auto custom-scrollbar max-h-full liquid-glass border border-white/40 dark:border-white/10 pb-6 relative leading-relaxed backdrop-saturate-[1.5]">
            
            <div className="flex items-center justify-between pb-4 border-b border-gray-100/50 dark:border-gray-800/50 mb-4 sticky top-0 bg-transparent backdrop-blur-md z-10 px-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-1 bg-gradient-to-b rounded-full from-pink-500 to-orange-500"></div>
                <h2 className="text-lg font-black tracking-tight text-gray-800 dark:text-gray-100">Parámetros</h2>
              </div>
              <button 
                onClick={() => setIsPanelHidden(true)}
                className="flex px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-200 text-[10px] font-black hover:bg-black/10 dark:hover:bg-white/10 transition-colors shadow-sm items-center gap-1 active:scale-95 uppercase tracking-wider"
                title="Minimizar Panel"
              >
                <X className="w-3.5 h-3.5" /> Cerrar
              </button>
            </div>

            <div className="flex-1 space-y-1">
              {sections.map(s => (
                <AccordionItem key={s.id} id={s.id} icon={s.icon} title={s.title}>
                  {s.content}
                </AccordionItem>
              ))}
            </div>

            {/* Reset */}
            <div className="mt-4 mb-2 px-2">
              <button
                onClick={() => {
                  setFilters({ brightness: 100, contrast: 100, saturation: 100, hueRotation: 0, tint: "transparent", vignette: 0, noise: 0, lightLeak: 0, grime: 0 });
                  setChromaKey({ enabled: false, color: "#ffffff", tolerance: 0.1 });
                  setMask("none"); setMaskScale(100);
                }}
                className="w-full py-3 flex items-center justify-center gap-2 text-[10px] font-black text-gray-500 hover:text-pink-600 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl transition-all border border-transparent hover:border-pink-200 active:scale-95 uppercase tracking-wider shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" /> REINICIAR
              </button>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-2 border-t border-gray-200/40 dark:border-white/10 flex gap-3 sticky bottom-0 z-10 pt-4 bg-transparent backdrop-blur-md rounded-b-3xl">
              <button
                onClick={onClose}
                className="flex-1 py-3 text-xs font-black text-gray-600 hover:bg-white/50 dark:text-gray-300 dark:hover:bg-gray-800 rounded-full transition-all tracking-widest uppercase border border-gray-200 dark:border-gray-700 shadow-sm bg-white/40 dark:bg-black/40 backdrop-blur-md"
              >
                DESCARTAR
              </button>
              <button
                onClick={handleSave}
                disabled={isProcessing}
                className="flex-[1.5] py-3 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white text-xs font-black rounded-full shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98] tracking-widest uppercase"
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                GUARDAR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
