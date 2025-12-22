
import React, { useState, useRef } from 'react';
import { ImageIcon, Smartphone, Monitor, Layout, Upload, Loader2, Database, Copy, Check, Trash2, AlertTriangle, Layers } from 'lucide-react';
import { uploadAppLogo, APP_LOGO_URL, APP_DESKTOP_LOGO_URL, APP_LANDING_LOGO_URL } from '../../lib/supabaseClient';


export const AdminSettings: React.FC = () => {
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingDesktopLogo, setIsUploadingDesktopLogo] = useState(false);
  const [isUploadingLandingLogo, setIsUploadingLandingLogo] = useState(false);
  
  const [copiedStorage, setCopiedStorage] = useState(false);
  const [copiedGallery, setCopiedGallery] = useState(false);
  const [copiedInventory, setCopiedInventory] = useState(false);
  const [copiedOrders, setCopiedOrders] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const desktopLogoInputRef = useRef<HTMLInputElement>(null);
  const landingLogoInputRef = useRef<HTMLInputElement>(null);

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

  const copyToClipboard = (text: string, type: 'storage' | 'gallery' | 'inventory' | 'orders') => {
    navigator.clipboard.writeText(text);
    if (type === 'storage') { setCopiedStorage(true); setTimeout(() => setCopiedStorage(false), 2000); }
    else if (type === 'gallery') { setCopiedGallery(true); setTimeout(() => setCopiedGallery(false), 2000); }
    else if (type === 'inventory') { setCopiedInventory(true); setTimeout(() => setCopiedInventory(false), 2000); }
    else { setCopiedOrders(true); setTimeout(() => setCopiedOrders(false), 2000); }
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

        {/* SQL Settings Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold mb-4">Scripts de Configuración</h2>
            <p className="text-gray-500 mb-6">Usa estos scripts en el editor SQL de Supabase para configurar la base de datos.</p>
            
            <div className="space-y-6">
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
                     <h3 className="font-bold flex items-center gap-2"><Database className="w-4 h-4" /> Ordenes (Actualizado con Género)</h3>
                     <div className="relative mt-2">
                        <button onClick={() => copyToClipboard(`
-- Agregar columna de género a pedidos si no existe
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='gender') then
    alter table orders add column gender text default 'male';
  end if;
end $$;
`, 'orders')} className="absolute top-2 right-2 bg-gray-800 text-white px-2 py-1 rounded text-xs">{copiedOrders ? 'Copiado' : 'Copiar'}</button>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">-- SQL Orders Migration</pre>
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
};
