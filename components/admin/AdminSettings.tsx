import React, { useState, useRef, useEffect } from 'react';
import { ImageIcon, Smartphone, Monitor, Layout, Upload, Loader2, Database, Copy, Check, Trash2, AlertTriangle, Layers, Ruler, Save, HardDrive, Palette, Instagram } from 'lucide-react';
import { uploadAppLogo, APP_LOGO_URL, APP_DESKTOP_LOGO_URL, APP_LANDING_LOGO_URL } from '../../lib/supabaseClient';
import { getCustomizerConstraints, saveCustomizerConstraints, getUploadLimits, saveUploadLimits, getAppearanceSettings, saveAppearanceSettings, DEFAULT_CONSTRAINTS, DEFAULT_UPLOAD_LIMITS, DEFAULT_APPEARANCE } from '../../services/settingsService';
import { CustomizerConstraints, UploadLimits, AppearanceSettings } from '../../types';

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
  const [uploadLimits, setUploadLimits] = useState<UploadLimits>(DEFAULT_UPLOAD_LIMITS);
  const [appearance, setAppearance] = useState<AppearanceSettings>(DEFAULT_APPEARANCE);
  
  const [isLoadingConstraints, setIsLoadingConstraints] = useState(true);
  const [isSavingConstraints, setIsSavingConstraints] = useState(false);
  const [isSavingLimits, setIsSavingLimits] = useState(false);
  const [isSavingAppearance, setIsSavingAppearance] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const desktopLogoInputRef = useRef<HTMLInputElement>(null);
  const landingLogoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadSettings = async () => {
        setIsLoadingConstraints(true);
        const [constraintsData, limitsData, appearanceData] = await Promise.all([
            getCustomizerConstraints(),
            getUploadLimits(),
            getAppearanceSettings()
        ]);
        setConstraints(constraintsData);
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

  const saveConstraints = async () => {
      setIsSavingConstraints(true);
      const success = await saveCustomizerConstraints(constraints);
      if (success) {
          alert('Configuración de área guardada exitosamente');
      } else {
          alert('Error al guardar. Asegúrate de ejecutar el Script SQL de "Configuración General".');
      }
      setIsSavingConstraints(false);
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
      if (!file.type.startsWith('image/')) { alert('Por favor selecciona un archivo de imagen válido.'); return; }

      setIsUploadingLogo(true);
      const newLogoUrl = await uploadAppLogo(file, 'mobile');
      setIsUploadingLogo(false);

      if (newLogoUrl) { alert('¡Logo móvil actualizado! Recarga para ver cambios.'); window.location.reload(); }
  };

  const handleDesktopLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) { alert('Por favor selecciona un archivo de imagen válido.'); return; }

      setIsUploadingDesktopLogo(true);
      const newLogoUrl = await uploadAppLogo(file, 'desktop');
      setIsUploadingDesktopLogo(false);

      if (newLogoUrl) { alert('¡Logo desktop actualizado! Recarga para ver cambios.'); window.location.reload(); }
  };

  const handleLandingLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) { alert('Por favor selecciona un archivo de imagen válido.'); return; }

      setIsUploadingLandingLogo(true);
      const newLogoUrl = await uploadAppLogo(file, 'landing');
      setIsUploadingLandingLogo(false);

      if (newLogoUrl) { alert('¡Logo Landing Page actualizado! Recarga para ver cambios.'); window.location.reload(); }
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
    <div className="max-w-6xl mx-auto animate-fade-in space-y-8 pb-10">
        
        {/* Logo Management Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg text-indigo-600"><ImageIcon className="w-6 h-6" /></div>
                <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Identidad de Marca (Logos)</h2><p className="text-gray-500 dark:text-gray-400 text-sm">Gestiona las imágenes oficiales de la marca.</p></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

        {/* 3D Appearance Settings Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
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
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer">
                                <input 
                                    type="color" 
                                    value={appearance.blackShirtHex} 
                                    onChange={(e) => setAppearance({...appearance, blackShirtHex: e.target.value})} 
                                    className="w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 p-0 border-0 cursor-pointer" 
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 block mb-1">Código Hexadecimal</label>
                                <input 
                                    type="text" 
                                    value={appearance.blackShirtHex} 
                                    onChange={(e) => setAppearance({...appearance, blackShirtHex: e.target.value})} 
                                    className="w-full md:w-48 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-cyan-500 outline-none text-sm font-mono uppercase" 
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">
                            Define qué tan oscura se ve la camiseta negra. <br/>
                            <span className="font-bold text-cyan-600">Recomendado:</span> #050505 (Negro Profundo) o #1a1a1a (Gris Oscuro/Lavado).
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
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
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
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-pink-100 dark:bg-pink-900/20 rounded-lg text-pink-600"><Ruler className="w-6 h-6" /></div>
                <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Área de Impresión (Restricciones)</h2><p className="text-gray-500 dark:text-gray-400 text-sm">Define los bordes del área imprimible. La imagen no podrá salirse de estos límites.</p></div>
            </div>

            {isLoadingConstraints ? (
                <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            {isSavingConstraints ? 'Guardando...' : 'Guardar Configuración'}
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* SQL Settings Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold mb-4">Scripts de Configuración</h2>
            <p className="text-gray-500 mb-6">Usa estos scripts en el editor SQL de Supabase para configurar la base de datos.</p>
            
            <div className="space-y-6">
                <div>
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
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">-- SQL Social Community (Muro)</pre>
                    </div>
                </div>

                <div>
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
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">-- SQL App Settings (Tabla para guardar variables)</pre>
                     </div>
                </div>

                <div>
                    <h3 className="font-bold flex items-center gap-2"><Database className="w-4 h-4" /> Storage</h3>
                    <div className="relative mt-2">
                        <button onClick={() => copyToClipboard(`-- 1. Asegurar que el bucket existe y es público
INSERT INTO storage.buckets (id, name, public) VALUES ('inkfluencia-images', 'inkfluencia-images', true) ON CONFLICT (id) DO NOTHING;
-- 2. Limpiar políticas antiguas
DROP POLICY IF EXISTS "Public Access Inkfluencia" ON storage.objects;
-- 3. Crear política maestra
CREATE POLICY "Public Access Inkfluencia" ON storage.objects FOR ALL TO public USING ( bucket_id = 'inkfluencia-images' ) WITH CHECK ( bucket_id = 'inkfluencia-images' );`, 'storage')} className="absolute top-2 right-2 bg-gray-800 text-white px-2 py-1 rounded text-xs">{copiedStorage ? 'Copiado' : 'Copiar'}</button>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">-- SQL Storage...</pre>
                    </div>
                </div>
                 <div>
                    <h3 className="font-bold flex items-center gap-2"><Layers className="w-4 h-4" /> Inventario (Actualizado con Género)</h3>
                    <div className="relative mt-2">
                        <button onClick={() => copyToClipboard(`
-- 1. Crear tabla si no existe
create table if not exists inventory ( id uuid default gen_random_uuid() primary key, gender text check (gender in ('male', 'female')) default 'male', color text check (color in ('white', 'black')), size text, grammage text check (grammage in ('150g', '200g')) default '150g', quantity integer default 0, created_at timestamp with time zone default timezone('utc'::text, now()) );

-- 2. Actualizar estructura si ya existe (Migration)
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='inventory' and column_name='gender') then
    alter table inventory add column gender text check (gender in ('male', 'female')) default 'male';
  end if;
end $$;

-- 3. Actualizar llave única
alter table inventory drop constraint if exists inventory_color_size_grammage_key;
alter table inventory drop constraint if exists inventory_gender_grammage_color_size_key;
alter table inventory add constraint inventory_gender_grammage_color_size_key unique (gender, grammage, color, size);

-- 4. Seguridad
alter table inventory enable row level security;
drop policy if exists "Public All Inventory" on inventory;
create policy "Public All Inventory" on inventory for all to public using (true) with check (true);
`, 'inventory')} className="absolute top-2 right-2 bg-gray-800 text-white px-2 py-1 rounded text-xs">{copiedInventory ? 'Copiado' : 'Copiar'}</button>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">-- SQL Inventory (Incluye migración de género)</pre>
                    </div>
                </div>
                <div>
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
                        <pre className="bg-gray-900 text-red-100 p-4 rounded-lg text-xs overflow-x-auto border border-red-900/50">-- SQL FIX: ESTE SCRIPT PERMITE EL BORRADO EN SUPABASE</pre>
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
};