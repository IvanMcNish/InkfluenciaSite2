import React, { useState, useRef, useEffect } from 'react';
import { ImageIcon, Smartphone, Monitor, Layout, Upload, Loader2, Database, Copy, Check, Trash2, AlertTriangle, Layers, Ruler, Save, HardDrive, Palette, Instagram, Download, Grid } from 'lucide-react';
import { uploadAppLogo, APP_LOGO_URL, APP_DESKTOP_LOGO_URL, APP_LANDING_LOGO_URL } from '../../lib/supabaseClient';
import { getCustomizerConstraints, saveCustomizerConstraints, getToteCustomizerConstraints, saveToteCustomizerConstraints, getUploadLimits, saveUploadLimits, getAppearanceSettings, saveAppearanceSettings, DEFAULT_CONSTRAINTS, DEFAULT_TOTE_CONSTRAINTS, DEFAULT_UPLOAD_LIMITS, DEFAULT_APPEARANCE } from '../../services/settingsService';
import { CustomizerConstraints, UploadLimits, AppearanceSettings } from '../../types';
import { getCollection } from '../../services/galleryService';

export const AdminSettings: React.FC = () => {
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingDesktopLogo, setIsUploadingDesktopLogo] = useState(false);
  const [isUploadingLandingLogo, setIsUploadingLandingLogo] = useState(false);
  
  const [copiedStorage, setCopiedStorage] = useState(false);
  const [copiedGallery, setCopiedGallery] = useState(false);
  const [copiedInventory, setCopiedInventory] = useState(false);
  const [copiedOrders, setCopiedOrders] = useState(false);
  const [copiedSettings, setCopiedSettings] = useState(false);
  const [copiedCommunity, setCopiedCommunity] = useState(false);

  // Settings State
  const [constraints, setConstraints] = useState<CustomizerConstraints>(DEFAULT_CONSTRAINTS);
  const [toteConstraints, setToteConstraints] = useState<CustomizerConstraints>(DEFAULT_TOTE_CONSTRAINTS);
  const [uploadLimits, setUploadLimits] = useState<UploadLimits>(DEFAULT_UPLOAD_LIMITS);
  const [appearance, setAppearance] = useState<AppearanceSettings>(DEFAULT_APPEARANCE);
  
  const [isLoadingConstraints, setIsLoadingConstraints] = useState(true);
  const [isSavingConstraints, setIsSavingConstraints] = useState(false);
  const [isSavingToteConstraints, setIsSavingToteConstraints] = useState(false);
  const [isSavingLimits, setIsSavingLimits] = useState(false);
  const [isSavingAppearance, setIsSavingAppearance] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const desktopLogoInputRef = useRef<HTMLInputElement>(null);
  const landingLogoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadSettings = async () => {
        setIsLoadingConstraints(true);
        const [constraintsData, toteConstraintsData, limitsData, appearanceData] = await Promise.all([
            getCustomizerConstraints(),
            getToteCustomizerConstraints(),
            getUploadLimits(),
            getAppearanceSettings()
        ]);
        setConstraints(constraintsData);
        setToteConstraints(toteConstraintsData);
        setUploadLimits(limitsData);
        setAppearance(appearanceData);
        setIsLoadingConstraints(false);
    };
    loadSettings();
  }, []);

  const handleConstraintChange = (section: keyof CustomizerConstraints, key: 'min' | 'max', value: string) => {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return;
      
      setConstraints(prev => ({
          ...prev,
          [section]: {
              ...prev[section],
              [key]: numValue
          }
      }));
  };

  const handleToteConstraintChange = (section: keyof CustomizerConstraints, key: 'min' | 'max', value: string) => {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return;
      
      setToteConstraints(prev => ({
          ...prev,
          [section]: {
              ...prev[section],
              [key]: numValue
          }
      }));
  };

  const saveConstraints = async () => {
      setIsSavingConstraints(true);
      const success = await saveCustomizerConstraints(constraints);
      if (success) {
          alert('Configuración de área (Camisetas) guardada exitosamente');
      } else {
          alert('Error al guardar. Asegúrate de ejecutar el Script SQL de "Configuración General".');
      }
      setIsSavingConstraints(false);
  };

  const saveToteConstraints = async () => {
      setIsSavingToteConstraints(true);
      const success = await saveToteCustomizerConstraints(toteConstraints);
      if (success) {
          alert('Configuración de área (Tote Bags) guardada exitosamente');
      } else {
          alert('Error al guardar. Asegúrate de ejecutar el Script SQL de "Configuración General".');
      }
      setIsSavingToteConstraints(false);
  };

  const saveLimits = async () => {
      setIsSavingLimits(true);
      const success = await saveUploadLimits(uploadLimits);
      if (success) {
          alert('Límites de carga guardados exitosamente');
      } else {
          alert('Error al guardar límites.');
      }
      setIsSavingLimits(false);
  };

  const saveAppearance = async () => {
      setIsSavingAppearance(true);
      const success = await saveAppearanceSettings(appearance);
      if (success) {
          alert('Apariencia guardada exitosamente. Recarga la página para ver cambios en el 3D.');
      } else {
          alert('Error al guardar apariencia.');
      }
      setIsSavingAppearance(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
          alert('Por favor selecciona un archivo de imagen válido.');
          e.target.value = '';
          return;
      }

      e.target.value = '';
      setIsUploadingLogo(true);
      const newLogoUrl = await uploadAppLogo(file, 'mobile');
      setIsUploadingLogo(false);

      if (newLogoUrl) { alert('¡Logo móvil actualizado! Recarga para ver cambios.'); window.location.reload(); }
  };

  const handleDesktopLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
          alert('Por favor selecciona un archivo de imagen válido.');
          e.target.value = '';
          return;
      }

      e.target.value = '';
      setIsUploadingDesktopLogo(true);
      const newLogoUrl = await uploadAppLogo(file, 'desktop');
      setIsUploadingDesktopLogo(false);

      if (newLogoUrl) { alert('¡Logo desktop actualizado! Recarga para ver cambios.'); window.location.reload(); }
  };

  const handleLandingLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
          alert('Por favor selecciona un archivo de imagen válido.');
          e.target.value = '';
          return;
      }

      e.target.value = '';
      setIsUploadingLandingLogo(true);
      const newLogoUrl = await uploadAppLogo(file, 'landing');
      setIsUploadingLandingLogo(false);

      if (newLogoUrl) { alert('¡Logo Landing Page actualizado! Recarga para ver cambios.'); window.location.reload(); }
  };

  // Gallery compilation state & function
  const [isGeneratingCatalog, setIsGeneratingCatalog] = useState(false);
  const [catalogStatus, setCatalogStatus] = useState('');
  const [catalogTitle, setCatalogTitle] = useState('Galería de la Comunidad');
  const [catalogSub, setCatalogSub] = useState('Diseños Exclusivos - Inkfluencia');
  const [catalogBg, setCatalogBg] = useState<'dark' | 'light'>('dark');
  const [catalogCols, setCatalogCols] = useState<number>(4);
  const [catalogShowLabels, setCatalogShowLabels] = useState(true);
  const [catalogUseGaps, setCatalogUseGaps] = useState(true);

  const generateCatalogImage = async () => {
    setIsGeneratingCatalog(true);
    setCatalogStatus('Obteniendo diseños aprobados de la galería...');
    try {
      const items = await getCollection();
      const validItems = items.filter(item => item.config && item.config.snapshotUrl);
      
      if (validItems.length === 0) {
        alert('No hay ningún diseño aprobado publicado en la galería para descargar. Ve a la sección de Galería y aprueba diseños primero.');
        setIsGeneratingCatalog(false);
        return;
      }

      setCatalogStatus(`Descargando ${validItems.length} renders de prendas...`);
      
      const cols = catalogCols;
      const rows = Math.ceil(validItems.length / cols);
      const cellWidth = 500;
      const cellHeight = catalogShowLabels ? 400 : 500; 
      const padding = 60;
      const gap = catalogUseGaps ? (catalogShowLabels ? 30 : 15) : 0;
      
      const headerHeight = 220;
      const footerHeight = 100;
      
      const totalWidth = padding * 2 + cols * cellWidth + (cols - 1) * gap;
      const totalHeight = headerHeight + padding * 2 + rows * cellHeight + (rows - 1) * gap + footerHeight;
      
      const canvas = document.createElement('canvas');
      canvas.width = totalWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('No se pudo inicializar el renderizador de Canvas');
      }
      
      const isDark = catalogBg === 'dark';
      ctx.fillStyle = isDark ? '#0C0C0E' : '#FFFFFF';
      ctx.fillRect(0, 0, totalWidth, totalHeight);
      
      ctx.strokeStyle = isDark ? 'rgba(236, 72, 153, 0.2)' : 'rgba(236, 72, 153, 0.25)';
      ctx.lineWidth = 3;
      ctx.strokeRect(30, 30, totalWidth - 60, totalHeight - 60);
      
      ctx.fillStyle = '#D946EF'; 
      ctx.fillRect(totalWidth / 2 - 150, 60, 300, 6);
      
      ctx.textAlign = 'center';
      ctx.fillStyle = isDark ? '#FFFFFF' : '#0F0F12';
      ctx.font = 'bold 54px system-ui, -apple-system, sans-serif';
      ctx.fillText(catalogTitle.toUpperCase(), totalWidth / 2, 130);
      
      ctx.fillStyle = isDark ? '#A1A1AA' : '#4B5563';
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.fillText(catalogSub.toUpperCase(), totalWidth / 2, 172);
      
      const today = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
      ctx.fillStyle = '#D946EF';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`CANTIDAD: ${validItems.length} ARTÍCULOS • EMISIÓN: ${today.toUpperCase()}`, totalWidth / 2, 205);
      
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padding, 230);
      ctx.lineTo(totalWidth - padding, 230);
      ctx.stroke();
      
      const loadImg = (url: string) => {
        return new Promise<HTMLImageElement | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = (e) => {
            console.error('Error cargando miniatura:', url, e);
            resolve(null);
          };
          img.src = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
        });
      };
      
      const loadedImages = await Promise.all(
        validItems.map(item => loadImg(item.config.snapshotUrl!))
      );
      
      setCatalogStatus('Renderezando lienzo...');
      
      validItems.forEach((item, index) => {
        const img = loadedImages[index];
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        const startX = padding + col * (cellWidth + gap);
        const startY = headerHeight + padding + row * (cellHeight + gap);
        
        ctx.save();
        
        if (catalogShowLabels) {
          const r = 24;
          ctx.beginPath();
          ctx.moveTo(startX + r, startY);
          ctx.lineTo(startX + cellWidth - r, startY);
          ctx.quadraticCurveTo(startX + cellWidth, startY, startX + cellWidth, startY + r);
          ctx.lineTo(startX + cellWidth, startY + cellHeight - r);
          ctx.quadraticCurveTo(startX + cellWidth, startY + cellHeight, startX + cellWidth - r, startY + cellHeight);
          ctx.lineTo(startX + r, startY + cellHeight);
          ctx.quadraticCurveTo(startX, startY + cellHeight, startX, startY + cellHeight - r);
          ctx.lineTo(startX, startY + r);
          ctx.quadraticCurveTo(startX, startY, startX + r, startY);
          ctx.closePath();
          
          ctx.fillStyle = isDark ? '#141417' : '#FFFFFF';
          ctx.fill();
          
          ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          
          ctx.clip();
          
          const imgHeight = cellHeight - 75; 
          if (img) {
            const sWidth = img.width;
            const sHeight = img.height;
            const sAspect = sWidth / sHeight;
            const dAspect = cellWidth / imgHeight;
            
            let sw = sWidth;
            let sh = sHeight;
            let sx = 0;
            let sy = 0;
            
            if (sAspect > dAspect) {
              sw = sHeight * dAspect;
              sx = (sWidth - sw) / 2;
            } else {
              sh = sWidth / dAspect;
              sy = (sHeight - sh) / 2;
            }
            
            ctx.drawImage(img, sx, sy, sw, sh, startX, startY, cellWidth, imgHeight);
          } else {
            ctx.fillStyle = isDark ? '#1E1E22' : '#F3F4F6';
            ctx.fillRect(startX, startY, cellWidth, imgHeight);
            ctx.font = 'bold 16px sans-serif';
            ctx.fillStyle = isDark ? '#A1A1AA' : '#6B7280';
            ctx.textAlign = 'center';
            ctx.fillText('[Imagen No Cargada]', startX + cellWidth / 2, startY + imgHeight / 2);
          }
          
          ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(startX, startY + imgHeight);
          ctx.lineTo(startX + cellWidth, startY + imgHeight);
          ctx.stroke();
          
          ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)';
          ctx.fillRect(startX, startY + imgHeight, cellWidth, 75);
          
          ctx.textAlign = 'left';
          ctx.fillStyle = isDark ? '#FFFFFF' : '#111827';
          ctx.font = 'bold 18px Arial, sans-serif';
          let displayName = item.name || 'Diseño de la Galería';
          if (displayName.length > 24) {
            displayName = displayName.substring(0, 22) + '...';
          }
          ctx.fillText(displayName, startX + 24, startY + imgHeight + 43);
          
          ctx.textAlign = 'right';
          const isTote = item.config?.productType === 'totebag';
          ctx.fillStyle = isTote ? '#EC4899' : '#3B82F6';
          ctx.font = 'bold 12px monospace';
          ctx.fillText(isTote ? 'TOTE BAG' : 'CAMISETA', startX + cellWidth - 24, startY + imgHeight + 40);
        } else {
          // Fully continuous exposition mode
          ctx.beginPath();
          ctx.rect(startX, startY, cellWidth, cellHeight);
          ctx.closePath();
          ctx.clip();

          if (img) {
            const sWidth = img.width;
            const sHeight = img.height;
            const sAspect = sWidth / sHeight;
            const dAspect = cellWidth / cellHeight;
            
            let sw = sWidth;
            let sh = sHeight;
            let sx = 0;
            let sy = 0;
            
            if (sAspect > dAspect) {
              sw = sHeight * dAspect;
              sx = (sWidth - sw) / 2;
            } else {
              sh = sWidth / dAspect;
              sy = (sHeight - sh) / 2;
            }
            
            ctx.drawImage(img, sx, sy, sw, sh, startX, startY, cellWidth, cellHeight);
          } else {
            ctx.fillStyle = isDark ? '#141417' : '#F3F4F6';
            ctx.fillRect(startX, startY, cellWidth, cellHeight);
            
            ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
            ctx.lineWidth = 1;
            ctx.strokeRect(startX, startY, cellWidth, cellHeight);

            ctx.font = 'bold 16px sans-serif';
            ctx.fillStyle = isDark ? '#71717A' : '#9CA3AF';
            ctx.textAlign = 'center';
            ctx.fillText('[Imagen No Cargada]', startX + cellWidth / 2, startY + cellHeight / 2);
          }
        }
        
        ctx.restore();
      });
      
      ctx.textAlign = 'center';
      ctx.fillStyle = isDark ? '#52525B' : '#9CA3AF';
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
      ctx.fillText('DISEÑADO EN EL ESTUDIO INTERACTIVO INKFLUENCIA • TODOS LOS DERECHOS RESERVADOS', totalWidth / 2, totalHeight - 45);
      
      setCatalogStatus('Compilando imagen final de alta resolución...');
      
      canvas.toBlob((blob) => {
        if (!blob) {
          alert('Error al compilar el lienzo.');
          setIsGeneratingCatalog(false);
          setCatalogStatus('');
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Catalogo_Galería_Inkfluencia_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setIsGeneratingCatalog(false);
        setCatalogStatus('');
      }, 'image/png');
      
    } catch (err: any) {
      console.error('Error al generar catálogo:', err);
      alert('Error de compilación de catálogo: ' + (err.message || err));
      setIsGeneratingCatalog(false);
      setCatalogStatus('');
    }
  };

  const copyToClipboard = (text: string, type: 'storage' | 'gallery' | 'inventory' | 'orders' | 'settings' | 'community') => {
    navigator.clipboard.writeText(text);
    if (type === 'storage') { setCopiedStorage(true); setTimeout(() => setCopiedStorage(false), 2000); }
    else if (type === 'gallery') { setCopiedGallery(true); setTimeout(() => setCopiedGallery(false), 2000); }
    else if (type === 'inventory') { setCopiedInventory(true); setTimeout(() => setCopiedInventory(false), 2000); }
    else if (type === 'orders') { setCopiedOrders(true); setTimeout(() => setCopiedOrders(false), 2000); }
    else if (type === 'community') { setCopiedCommunity(true); setTimeout(() => setCopiedCommunity(false), 2000); }
    else { setCopiedSettings(true); setTimeout(() => setCopiedSettings(false), 2000); }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-8 pb-10 w-full min-w-0">
        
        {/* Logo Management Section */}
        <div className="rounded-xl shadow-sm p-6 liquid-glass">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg text-indigo-600"><ImageIcon className="w-6 h-6" /></div>
                <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Identidad de Marca (Logos)</h2><p className="text-gray-500 dark:text-gray-400 text-sm">Gestiona las imágenes oficiales de la marca.</p></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Mobile Logo */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-4 text-gray-600 dark:text-gray-300 font-bold uppercase text-xs tracking-wider"><Smartphone className="w-4 h-4" /> Logo Móvil (Icono)</div>
                    <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 p-4 mb-4"><img src={`${APP_LOGO_URL}?t=${Date.now()}`} alt="Mobile Logo" className="w-full h-full object-contain" /></div>
                    <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/png, image/jpeg, image/webp" className="hidden" />
                    <button onClick={() => logoInputRef.current?.click()} disabled={isUploadingLogo} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">{isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}{isUploadingLogo ? 'Subiendo...' : 'Actualizar Móvil'}</button>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">PNG Transparente (Cuadrado 512x512px)</p>
                </div>

                {/* Desktop Logo */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-4 text-gray-600 dark:text-gray-300 font-bold uppercase text-xs tracking-wider"><Monitor className="w-4 h-4" /> Logo Desktop (Completo)</div>
                    <div className="w-full h-32 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 p-4 mb-4"><img src={`${APP_DESKTOP_LOGO_URL}?t=${Date.now()}`} alt="Desktop Logo" className="h-full w-auto object-contain" /></div>
                    <input type="file" ref={desktopLogoInputRef} onChange={handleDesktopLogoUpload} accept="image/png, image/jpeg, image/webp" className="hidden" />
                    <button onClick={() => desktopLogoInputRef.current?.click()} disabled={isUploadingDesktopLogo} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">{isUploadingDesktopLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}{isUploadingDesktopLogo ? 'Subiendo...' : 'Actualizar Desktop'}</button>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">PNG Transparente (Horizontal)</p>
                </div>

                 {/* Landing Page Logo */}
                 <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-4 text-gray-600 dark:text-gray-300 font-bold uppercase text-xs tracking-wider"><Layout className="w-4 h-4" /> Logo Landing Page</div>
                    <div className="w-full h-32 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 p-4 mb-4"><img src={`${APP_LANDING_LOGO_URL}?t=${Date.now()}`} alt="Landing Logo" className="h-full w-auto object-contain" /></div>
                    <input type="file" ref={landingLogoInputRef} onChange={handleLandingLogoUpload} accept="image/png, image/jpeg, image/webp" className="hidden" />
                    <button onClick={() => landingLogoInputRef.current?.click()} disabled={isUploadingLandingLogo} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">{isUploadingLandingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}{isUploadingLandingLogo ? 'Subiendo...' : 'Actualizar Landing'}</button>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">PNG Transparente (Gran Formato)</p>
                </div>
            </div>
        </div>

        {/* Export Collage Section */}
        <div className="rounded-xl shadow-sm p-6 font-sans liquid-glass">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-pink-100 dark:bg-pink-900/20 rounded-lg text-pink-600">
                    <Grid className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Exportador de Catálogo de Galería</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Descarga un póster de alta definición con todas las camisetas y bolsos publicados en la galería.</p>
                </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-1">Título del Póster</label>
                        <input
                            type="text"
                            value={catalogTitle}
                            onChange={(e) => setCatalogTitle(e.target.value)}
                            placeholder="Ej. Galería de Diseños"
                            className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-pink-500 outline-none text-sm font-semibold text-gray-950 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-1">Subtítulo del Póster</label>
                        <input
                            type="text"
                            value={catalogSub}
                            onChange={(e) => setCatalogSub(e.target.value)}
                            placeholder="Ej. Colección Exclusiva"
                            className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-pink-500 outline-none text-sm text-gray-955 dark:text-white"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-200/50 dark:border-gray-800 pt-3">
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-1">Identificadores Visuales</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setCatalogShowLabels(true)}
                                className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg border transition-all ${catalogShowLabels ? 'bg-pink-600 text-white border-pink-500 shadow-sm dark:bg-pink-600 dark:border-pink-500' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'}`}
                            >
                                Tarjetas con Info (Nombre/Tipo)
                            </button>
                            <button
                                type="button"
                                onClick={() => setCatalogShowLabels(false)}
                                className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg border transition-all ${!catalogShowLabels ? 'bg-pink-600 text-white border-pink-500 shadow-sm dark:bg-pink-600 dark:border-pink-500' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'}`}
                            >
                                Solo Imágenes (Exposición)
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-1">Distribución de Imágenes</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setCatalogUseGaps(false)}
                                className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg border transition-all ${!catalogUseGaps ? 'bg-pink-600 text-white border-pink-500 shadow-sm dark:bg-pink-600 dark:border-pink-500' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'}`}
                            >
                                Una junto a otra (Continuas)
                            </button>
                            <button
                                type="button"
                                onClick={() => setCatalogUseGaps(true)}
                                className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg border transition-all ${catalogUseGaps ? 'bg-pink-600 text-white border-pink-500 shadow-sm dark:bg-pink-600 dark:border-pink-500' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'}`}
                            >
                                Con Separación (Gaps)
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t border-gray-200/50 dark:border-gray-800 pt-3">
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-1">Fondo del Lienzo</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setCatalogBg('dark')}
                                className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg border transition-all ${catalogBg === 'dark' ? 'bg-gray-900 text-white border-pink-500 shadow-sm dark:bg-black dark:border-pink-500' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'}`}
                            >
                                Tema Negro
                            </button>
                            <button
                                type="button"
                                onClick={() => setCatalogBg('light')}
                                className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg border transition-all ${catalogBg === 'light' ? 'bg-white text-gray-900 border-pink-500 shadow-sm' : 'bg-gray-55 text-gray-400 border-gray-200 hover:bg-white dark:bg-gray-800 dark:border-gray-700'}`}
                            >
                                Tema Blanco
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-1">Columnas de la Cuadrícula</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="2"
                                max="6"
                                value={catalogCols}
                                onChange={(e) => setCatalogCols(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                            />
                            <span className="font-mono text-sm font-bold shrink-0 text-pink-500 w-12 text-right">{catalogCols} cols</span>
                        </div>
                    </div>

                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={generateCatalogImage}
                            disabled={isGeneratingCatalog}
                            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-2.5 px-4 rounded-lg shadow-lg hover:shadow-pink-500/20 transition-all flex items-center justify-center gap-2 text-sm z-10"
                        >
                            {isGeneratingCatalog ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Generando...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    <span>Descargar Catálogo PNG</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {catalogStatus && (
                    <div className="text-xs font-semibold text-center py-2 bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-lg animate-pulse font-mono">
                        {catalogStatus}
                    </div>
                )}
            </div>
        </div>

        {/* 3D Appearance Settings Section */}
        <div className="rounded-xl shadow-sm p-6 liquid-glass">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-cyan-100 dark:bg-cyan-900/20 rounded-lg text-cyan-600"><Palette className="w-6 h-6" /></div>
                <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Apariencia 3D</h2><p className="text-gray-500 dark:text-gray-400 text-sm">Personaliza los colores base de los modelos 3D.</p></div>
            </div>

            {isLoadingConstraints ? (
                <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>
            ) : (
                <div className="space-y-6">
                     <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 text-sm uppercase"><Palette className="w-4 h-4"/> Color Base Camiseta Negra</h3>
                        <div className="flex items-center gap-4 w-full">
                            <div className="h-12 w-12 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer shrink-0">
                                <input 
                                    type="color" 
                                    value={appearance.blackShirtHex} 
                                    onChange={(e) => setAppearance({...appearance, blackShirtHex: e.target.value})} 
                                    className="w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 p-0 border-0 cursor-pointer" 
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <label className="text-xs text-gray-500 block mb-1 truncate">Código Hexadecimal</label>
                                <input 
                                    type="text" 
                                    value={appearance.blackShirtHex} 
                                    onChange={(e) => setAppearance({...appearance, blackShirtHex: e.target.value})} 
                                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-cyan-500 outline-none text-sm font-mono uppercase" 
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">
                            Define qué tan oscura se ve la camiseta negra. <br/>
                            <span className="font-bold text-cyan-600">Recomendado:</span> #050505 (Negro Profundo) o #1a1a1a (Gris Oscuro/Lavado).
                        </p>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 text-sm uppercase"><Layers className="w-4 h-4"/> Transparencia de Diseños</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Opacidad</label>
                                <span className="text-sm font-mono font-bold text-cyan-600">{Math.round((appearance.designOpacity || 1) * 100)}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="0.1" 
                                max="1" 
                                step="0.01" 
                                value={appearance.designOpacity || 1} 
                                onChange={(e) => setAppearance({...appearance, designOpacity: parseFloat(e.target.value)})}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                            />
                            <div className="flex justify-between text-[10px] text-gray-400">
                                <span>10% (Muy Transparente)</span>
                                <span>100% (Sólido)</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-4">
                            Afecta a todas las imágenes agregadas sobre los productos. <br/>
                            <span className="font-bold text-cyan-600 underline">Nota:</span> Ayuda a que los diseños se integren mejor con las sombras y arrugas de la tela.
                        </p>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 text-sm uppercase"><Grid className="w-4 h-4"/> Tamaño de Renders en Tarjetas de Galería</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Escala del Render (Card)</label>
                                <span className="text-sm font-mono font-bold text-cyan-600">{appearance.galleryCardScale || 85}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="50" 
                                max="115" 
                                step="1" 
                                value={appearance.galleryCardScale || 85} 
                                onChange={(e) => setAppearance({...appearance, galleryCardScale: parseInt(e.target.value)})}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                            />
                            <div className="flex justify-between text-[10px] text-gray-400">
                                <span>50% (Pequeño)</span>
                                <span>85% (Por Defecto)</span>
                                <span>115% (Grande)</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-4">
                            Afecta a todas las previsualizaciones de prendas de la galería pública. <br/>
                            <span className="font-bold text-cyan-600">Recomendado:</span> Alrededor de 85% para un aspecto equilibrado, o menor si deseas reducir la cercanía visual.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <button onClick={saveAppearance} disabled={isSavingAppearance} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-colors">
                            {isSavingAppearance ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSavingAppearance ? 'Guardando...' : 'Guardar Apariencia'}
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Upload Limits Section */}
        <div className="rounded-xl shadow-sm p-6 liquid-glass">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg text-purple-600"><HardDrive className="w-6 h-6" /></div>
                <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Límites de Carga</h2><p className="text-gray-500 dark:text-gray-400 text-sm">Controla el tamaño máximo de los archivos que los usuarios pueden subir.</p></div>
            </div>

            {isLoadingConstraints ? (
                <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
            ) : (
                <div className="space-y-6">
                     <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 text-sm uppercase"><Upload className="w-4 h-4"/> Peso Máximo de Imagen</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 block mb-1">Tamaño en Megabytes (MB)</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    max="50"
                                    value={uploadLimits.maxFileSizeMB} 
                                    onChange={(e) => setUploadLimits({...uploadLimits, maxFileSizeMB: parseInt(e.target.value) || 5})} 
                                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none text-sm" 
                                />
                            </div>
                            <div className="text-sm text-gray-500 pt-5">
                                MB
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">Valor actual: {uploadLimits.maxFileSizeMB}MB. Recomendado: 5MB a 15MB para evitar sobrecarga.</p>
                    </div>

                    <div className="flex justify-end">
                        <button onClick={saveLimits} disabled={isSavingLimits} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-colors">
                            {isSavingLimits ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSavingLimits ? 'Guardando...' : 'Guardar Límites'}
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Customizer Constraints Section */}
        <div className="rounded-xl shadow-sm p-6 liquid-glass">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-pink-100 dark:bg-pink-900/20 rounded-lg text-pink-600"><Ruler className="w-6 h-6" /></div>
                <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Área de Impresión - Camisetas</h2><p className="text-gray-500 dark:text-gray-400 text-sm">Define los bordes del área imprimible para las camisetas.</p></div>
            </div>

            {isLoadingConstraints ? (
                <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>
            ) : (
                <div className="space-y-6 mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* X Axis */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 text-sm uppercase"><Layout className="w-4 h-4"/> Límite Horizontal (X)</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Borde Izquierdo (Mín)</label>
                                    <input type="number" step="0.01" value={constraints.x.min} onChange={(e) => handleConstraintChange('x', 'min', e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-pink-500 outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Borde Derecho (Máx)</label>
                                    <input type="number" step="0.01" value={constraints.x.max} onChange={(e) => handleConstraintChange('x', 'max', e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-pink-500 outline-none text-sm" />
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2">Valores recomendados: -0.28 a 0.28</p>
                        </div>

                        {/* Y Axis */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 text-sm uppercase"><Layout className="w-4 h-4 rotate-90"/> Límite Vertical (Y)</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Borde Inferior (Mín)</label>
                                    <input type="number" step="0.01" value={constraints.y.min} onChange={(e) => handleConstraintChange('y', 'min', e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-pink-500 outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Borde Superior (Máx)</label>
                                    <input type="number" step="0.01" value={constraints.y.max} onChange={(e) => handleConstraintChange('y', 'max', e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-pink-500 outline-none text-sm" />
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2">Valores recomendados: -0.45 a 0.35</p>
                        </div>

                        {/* Scale */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 text-sm uppercase"><Layers className="w-4 h-4"/> Tamaño Imagen (Escala)</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Mínimo (Pequeño)</label>
                                    <input type="number" step="0.01" value={constraints.scale.min} onChange={(e) => handleConstraintChange('scale', 'min', e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-pink-500 outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Máximo (Grande)</label>
                                    <input type="number" step="0.01" value={constraints.scale.max} onChange={(e) => handleConstraintChange('scale', 'max', e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-pink-500 outline-none text-sm" />
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2">Valores recomendados: 0.05 a 0.45</p>
                        </div>
                    </div>
                    
                    <div className="flex justify-end">
                        <button onClick={saveConstraints} disabled={isSavingConstraints} className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-bold shadow-lg shadow-pink-500/20 flex items-center gap-2 transition-colors">
                            {isSavingConstraints ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSavingConstraints ? 'Guardando...' : 'Guardar Camisetas'}
                        </button>
                    </div>
                </div>
            )}

            <div className="flex items-start justify-between mb-6 mt-12 border-t border-gray-100 dark:border-gray-800 pt-8">
                <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Área de Impresión - Tote Bags</h2><p className="text-gray-500 dark:text-gray-400 text-sm">Define los bordes del área imprimible para los Tote Bags.</p></div>
            </div>

            {isLoadingConstraints ? (
                <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* X Axis */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 text-sm uppercase"><Layout className="w-4 h-4"/> Límite Horizontal (X)</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Borde Izquierdo (Mín)</label>
                                    <input type="number" step="0.01" value={toteConstraints.x.min} onChange={(e) => handleToteConstraintChange('x', 'min', e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-pink-500 outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Borde Derecho (Máx)</label>
                                    <input type="number" step="0.01" value={toteConstraints.x.max} onChange={(e) => handleToteConstraintChange('x', 'max', e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-pink-500 outline-none text-sm" />
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2">Valores recomendados: -1.8 a 1.8</p>
                        </div>

                        {/* Y Axis */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 text-sm uppercase"><Layout className="w-4 h-4 rotate-90"/> Límite Vertical (Y)</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Borde Inferior (Mín)</label>
                                    <input type="number" step="0.01" value={toteConstraints.y.min} onChange={(e) => handleToteConstraintChange('y', 'min', e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-pink-500 outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Borde Superior (Máx)</label>
                                    <input type="number" step="0.01" value={toteConstraints.y.max} onChange={(e) => handleToteConstraintChange('y', 'max', e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-pink-500 outline-none text-sm" />
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2">Valores recomendados: -2.0 a 0.3</p>
                        </div>

                        {/* Scale */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 text-sm uppercase"><Layers className="w-4 h-4"/> Tamaño Imagen (Escala)</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Mínimo (Pequeño)</label>
                                    <input type="number" step="0.01" value={toteConstraints.scale.min} onChange={(e) => handleToteConstraintChange('scale', 'min', e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-pink-500 outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Máximo (Grande)</label>
                                    <input type="number" step="0.01" value={toteConstraints.scale.max} onChange={(e) => handleToteConstraintChange('scale', 'max', e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-pink-500 outline-none text-sm" />
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2">Valores recomendados: 0.05 a 3.5</p>
                        </div>
                    </div>
                    
                    <div className="flex justify-end">
                        <button onClick={saveToteConstraints} disabled={isSavingToteConstraints} className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-bold shadow-lg shadow-pink-500/20 flex items-center gap-2 transition-colors">
                            {isSavingToteConstraints ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSavingToteConstraints ? 'Guardando...' : 'Guardar Tote Bags'}
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* SQL Settings Section */}
        <div className="rounded-xl shadow-sm p-6 liquid-glass">
            <h2 className="text-xl font-bold mb-4">Scripts de Configuración</h2>
            <p className="text-gray-500 mb-6">Usa estos scripts en el editor SQL de Supabase para configurar la base de datos.</p>
            
            <div className="space-y-6 min-w-0">
                <div className="min-w-0">
                    <h3 className="font-bold flex items-center gap-2"><Instagram className="w-4 h-4" /> Muro Social (Comunidad)</h3>
                    <div className="relative mt-2">
                        <button onClick={() => copyToClipboard(`
-- Tabla para publicaciones sociales
create table if not exists social_posts (
  id uuid default gen_random_uuid() primary key,
  username text not null,
  user_avatar text,
  image_url text not null,
  caption text,
  likes integer default 0,
  approved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Habilitar RLS
alter table social_posts enable row level security;

-- Política: Público puede VER posts APROBADOS
drop policy if exists "Public Read Approved Posts" on social_posts;
create policy "Public Read Approved Posts" on social_posts for select using (approved = true);

-- Política: Admin puede VER TODO
drop policy if exists "Admin Read All Posts" on social_posts;
create policy "Admin Read All Posts" on social_posts for select using (auth.role() = 'authenticated');

-- Política: Cualquiera puede CREAR (subir fotos), por defecto approved=false
drop policy if exists "Public Create Posts" on social_posts;
create policy "Public Create Posts" on social_posts for insert with check (true);

-- Política: Admin puede ACTUALIZAR (aprobar) y BORRAR
drop policy if exists "Admin Update Posts" on social_posts;
create policy "Admin Update Posts" on social_posts for update using (auth.role() = 'authenticated');
drop policy if exists "Admin Delete Posts" on social_posts;
create policy "Admin Delete Posts" on social_posts for delete using (auth.role() = 'authenticated');
`, 'community')} className="absolute top-2 right-2 bg-gray-800 text-white px-2 py-1 rounded text-xs">{copiedCommunity ? 'Copiado' : 'Copiar'}</button>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto w-full max-w-full box-border whitespace-pre-wrap break-words">-- SQL Social Community (Muro)</pre>
                    </div>
                </div>

                <div className="min-w-0">
                    <h3 className="font-bold flex items-center gap-2"><Database className="w-4 h-4" /> Configuración General (Tabla Settings)</h3>
                     <div className="relative mt-2">
                        <button onClick={() => copyToClipboard(`
-- Tabla para guardar configuraciones globales de la app
create table if not exists app_settings (
  id text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Habilitar RLS
alter table app_settings enable row level security;

-- Política: Todos pueden LEER (para que el customizer funcione)
create policy "Public Read Settings" on app_settings for select using (true);

-- Política: Solo autenticados (admins) pueden EDITAR
create policy "Admin Update Settings" on app_settings for update using (auth.role() = 'authenticated');
create policy "Admin Insert Settings" on app_settings for insert with check (auth.role() = 'authenticated');
`, 'settings')} className="absolute top-2 right-2 bg-gray-800 text-white px-2 py-1 rounded text-xs">{copiedSettings ? 'Copiado' : 'Copiar'}</button>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto w-full max-w-full box-border whitespace-pre-wrap break-words">-- SQL App Settings (Tabla para guardar variables)</pre>
                     </div>
                </div>

                <div className="min-w-0">
                    <h3 className="font-bold flex items-center gap-2"><Database className="w-4 h-4" /> Storage</h3>
                    <div className="relative mt-2">
                        <button onClick={() => copyToClipboard(`-- 1. Asegurar que el bucket existe y es público
INSERT INTO storage.buckets (id, name, public) VALUES ('inkfluencia-images', 'inkfluencia-images', true) ON CONFLICT (id) DO NOTHING;
-- 2. Limpiar políticas antiguas
DROP POLICY IF EXISTS "Public Access Inkfluencia" ON storage.objects;
-- 3. Crear política maestra
CREATE POLICY "Public Access Inkfluencia" ON storage.objects FOR ALL TO public USING ( bucket_id = 'inkfluencia-images' ) WITH CHECK ( bucket_id = 'inkfluencia-images' );`, 'storage')} className="absolute top-2 right-2 bg-gray-800 text-white px-2 py-1 rounded text-xs">{copiedStorage ? 'Copiado' : 'Copiar'}</button>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto w-full max-w-full box-border whitespace-pre-wrap break-words">-- SQL Storage...</pre>
                    </div>
                </div>
                 <div className="min-w-0">
                    <h3 className="font-bold flex items-center gap-2"><Layers className="w-4 h-4" /> Inventario (Actualizado con Género)</h3>
                    <div className="relative mt-2">
                        <button onClick={() => copyToClipboard(`
-- 1. Crear tabla si no existe
create table if not exists inventory ( id uuid default gen_random_uuid() primary key, gender text default 'male', color text, size text, grammage text default '150g', quantity integer default 0, created_at timestamp with time zone default timezone('utc'::text, now()) );

-- 2. Actualizar estructura si ya existe (Migration)
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='inventory' and column_name='gender') then
    alter table inventory add column gender text default 'male';
  end if;
end $$;

-- 2.1 Remover restricciones previas (Para soportar Tote Bags)
alter table inventory drop constraint if exists inventory_gender_check;
alter table inventory drop constraint if exists inventory_color_check;
alter table inventory drop constraint if exists inventory_grammage_check;

-- 3. Actualizar llave única
alter table inventory drop constraint if exists inventory_color_size_grammage_key;
alter table inventory drop constraint if exists inventory_gender_grammage_color_size_key;
alter table inventory add constraint inventory_gender_grammage_color_size_key unique (gender, grammage, color, size);

-- 4. Seguridad
alter table inventory enable row level security;
drop policy if exists "Public All Inventory" on inventory;
create policy "Public All Inventory" on inventory for all to public using (true) with check (true);
`, 'inventory')} className="absolute top-2 right-2 bg-gray-800 text-white px-2 py-1 rounded text-xs">{copiedInventory ? 'Copiado' : 'Copiar'}</button>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto w-full max-w-full box-border whitespace-pre-wrap break-words">-- SQL Inventory (Incluye migración de género)</pre>
                    </div>
                </div>
                <div className="min-w-0">
                     <h3 className="font-bold flex items-center gap-2 text-red-600"><AlertTriangle className="w-4 h-4" /> Ordenes: FIX ELIMINACIÓN (Copiar y Ejecutar)</h3>
                     <div className="relative mt-2">
                        <button onClick={() => copyToClipboard(`
-- 1. Habilitar RLS
alter table orders enable row level security;

-- 2. ELIMINAR políticas antiguas de borrado para evitar conflictos
drop policy if exists "Admin Delete Orders" on orders;
drop policy if exists "Admin All Access" on orders;
drop policy if exists "Enable delete for authenticated users only" on orders;

-- 3. Crear política EXPLÍCITA de borrado para administradores
create policy "Admin Delete Orders" 
on orders 
for delete 
to authenticated 
using (true);

-- 4. Crear política para el resto de operaciones (Lectura, Inserción, Actualización)
create policy "Admin Management Orders" 
on orders 
for all 
to authenticated 
using (true) 
with check (true);

-- 5. Asegurar columnas de migración
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='gender') then
    alter table orders add column gender text default 'male';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='admin_discount_applied') then
    alter table orders add column admin_discount_applied boolean default false;
  end if;
end $$;
`, 'orders')} className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">{copiedOrders ? 'Copiado' : 'Copiar FIX'}</button>
                        <pre className="bg-gray-900 text-red-100 p-4 rounded-lg text-xs overflow-x-auto w-full max-w-full box-border whitespace-pre-wrap break-words border border-red-900/50">-- SQL FIX: ESTE SCRIPT PERMITE EL BORRADO EN SUPABASE</pre>
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
};