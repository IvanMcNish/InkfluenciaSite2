import React, { useEffect, useState, useRef } from 'react';
import { getOrders, updateOrderStatus } from '../services/orderService';
import { getCustomers } from '../services/customerService';
import { getCollection, deleteDesignFromCollection } from '../services/galleryService';
import { getInventory } from '../services/inventoryService';
import { uploadAppLogo, APP_LOGO_URL, supabase } from '../lib/supabaseClient';
import { Order, OrderStatus, Customer, CollectionItem, InventoryItem } from '../types';
import { Package, Search, Calendar, X, Download, ChevronDown, Check, Eye, User, MapPin, CreditCard, Box, Phone, Loader2, Users, ShoppingBag, Settings, Database, Copy, AlertTriangle, Grid, Trash2, Upload, Image as ImageIcon, LogOut, TrendingUp, BarChart3, DollarSign, Activity, Percent, Layers, Shirt } from 'lucide-react';
import { formatCurrency, PRICES } from '../constants';
import { Scene } from './Scene';

export const AdminPanel: React.FC = () => {
  // Changed default state to 'financial'
  const [activeTab, setActiveTab] = useState<'orders' | 'customers' | 'settings' | 'gallery' | 'financial'>('financial');
  
  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Customers State
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Gallery State
  const [galleryItems, setGalleryItems] = useState<CollectionItem[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string} | null>(null);

  // Inventory State
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // Shared State
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Settings State
  const [copiedStorage, setCopiedStorage] = useState(false);
  const [copiedGallery, setCopiedGallery] = useState(false);
  const [copiedInventory, setCopiedInventory] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Tabs Configuration
  const tabs = [
    { id: 'financial', label: 'Finanzas', icon: BarChart3 },
    { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'gallery', label: 'Galería', icon: Grid },
    { id: 'settings', label: 'Config', icon: Settings },
  ] as const;

  const loadData = async () => {
      setIsLoading(true);
      // Always load orders if we are in financial tab to calculate stats
      if (activeTab === 'orders' || activeTab === 'financial') {
          const loadedOrders = await getOrders();
          setOrders(loadedOrders);
      }
      
      // Load inventory for financial tab
      if (activeTab === 'financial') {
          const loadedInventory = await getInventory();
          setInventory(loadedInventory);
      }
      
      if (activeTab === 'customers') {
          const loadedCustomers = await getCustomers();
          setCustomers(loadedCustomers);
      } else if (activeTab === 'gallery') {
          const loadedGallery = await getCollection();
          setGalleryItems(loadedGallery);
      }
      setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleLogout = async () => {
      await supabase.auth.signOut();
      // App.tsx auth listener will redirect to Login
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? ({ ...prev, status: newStatus }) : null);
    }

    const success = await updateOrderStatus(orderId, newStatus);
    if (!success) {
        loadData();
        alert("Error al actualizar el estado");
    }
  };

  const requestDeleteGalleryItem = (id: string, name: string) => {
      setItemToDelete({ id, name });
  };

  const confirmDeleteGalleryItem = async () => {
      if (!itemToDelete) return;
      
      const { id } = itemToDelete;
      setItemToDelete(null); 
      setDeletingId(id); 
      
      try {
        const result = await deleteDesignFromCollection(id);
        if (result.success) {
            setGalleryItems(prev => prev.filter(item => item.id !== id));
            await loadData();
        } else {
            console.error("Delete failed:", result.error);
            alert(`NO SE PUDO ELIMINAR:\n${result.error}\n\nSolución: Ve a la pestaña 'Configuración' > copia el SQL de Galería > Ejecútalo en Supabase.`);
        }
      } catch (e) {
          console.error("Delete exception:", e);
          alert("Error inesperado al intentar eliminar.");
      } finally {
          setDeletingId(null);
      }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
          alert('Por favor selecciona un archivo de imagen válido.');
          return;
      }

      setIsUploadingLogo(true);
      const newLogoUrl = await uploadAppLogo(file);
      setIsUploadingLogo(false);

      if (newLogoUrl) {
          alert('¡Logo actualizado con éxito! Recarga la página para ver los cambios.');
          window.location.reload();
      }
  };

  const copyToClipboard = (text: string, type: 'storage' | 'gallery' | 'inventory') => {
    navigator.clipboard.writeText(text);
    if (type === 'storage') {
        setCopiedStorage(true);
        setTimeout(() => setCopiedStorage(false), 2000);
    } else if (type === 'gallery') {
        setCopiedGallery(true);
        setTimeout(() => setCopiedGallery(false), 2000);
    } else {
        setCopiedInventory(true);
        setTimeout(() => setCopiedInventory(false), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900';
      case 'shipped': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // --- Financial Calculations ---
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const processingOrdersCount = orders.filter(o => o.status === 'processing').length;
  const shippedOrdersCount = orders.filter(o => o.status === 'shipped').length;
  
  // Calculate Revenue (Only Shipped Orders)
  const realizedRevenue = orders
    .filter(o => o.status === 'shipped')
    .reduce((acc, curr) => acc + curr.total, 0);

  // Calculate Potential Revenue (Pending + Processing)
  const potentialRevenue = orders
    .filter(o => o.status !== 'shipped')
    .reduce((acc, curr) => acc + curr.total, 0);

  // Percentages for UI
  const shippedPercentage = totalOrdersCount > 0 ? (shippedOrdersCount / totalOrdersCount) * 100 : 0;
  const processingPercentage = totalOrdersCount > 0 ? (processingOrdersCount / totalOrdersCount) * 100 : 0;
  const pendingPercentage = totalOrdersCount > 0 ? (pendingOrdersCount / totalOrdersCount) * 100 : 0;

  // Inventory Calculations
  const totalStock = inventory.reduce((acc, item) => acc + item.quantity, 0);
  const whiteStock = inventory.filter(i => i.color === 'white').reduce((acc, i) => acc + i.quantity, 0);
  const blackStock = inventory.filter(i => i.color === 'black').reduce((acc, i) => acc + i.quantity, 0);
  // Estimation: Using base price of 150g shirt for inventory value estimation
  const estimatedInventoryValue = totalStock * PRICES['150g'];


  const storageSQL = `-- Copia y pega esto en el SQL Editor de Supabase para arreglar las imágenes

-- 1. Asegurar que el bucket existe y es público
INSERT INTO storage.buckets (id, name, public)
VALUES ('inkfluencia-images', 'inkfluencia-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Limpiar políticas antiguas para evitar conflictos
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Permitir Subida Publica" ON storage.objects;
DROP POLICY IF EXISTS "Permitir Lectura Publica" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Inkfluencia" ON storage.objects;

-- 3. Crear política maestra: Permitir TODO (Leer/Escribir) a TODOS (Público) en este bucket
CREATE POLICY "Public Access Inkfluencia"
ON storage.objects FOR ALL
TO public
USING ( bucket_id = 'inkfluencia-images' )
WITH CHECK ( bucket_id = 'inkfluencia-images' );`;

  const gallerySQL = `-- SQL PARA REPARAR PERMISOS DE BORRADO (Versión Forzada)

-- 1. Reiniciar RLS
ALTER TABLE gallery DISABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- 2. Borrar CUALQUIER política previa (evita conflictos de nombres)
DROP POLICY IF EXISTS "Permitir todo público" ON gallery;
DROP POLICY IF EXISTS "Enable delete for anon" ON gallery;
DROP POLICY IF EXISTS "Permitir Borrado Publico" ON gallery;
DROP POLICY IF EXISTS "Permitir Acceso Total Galeria" ON gallery;
DROP POLICY IF EXISTS "Enable read access for all users" ON gallery;
DROP POLICY IF EXISTS "Enable insert for all users" ON gallery;
DROP POLICY IF EXISTS "Acceso Total Publico" ON gallery;
DROP POLICY IF EXISTS "Public Access All" ON gallery;

-- 3. Crear la política MAESTRA que permite TODO a TODOS
CREATE POLICY "Acceso Total Publico"
ON gallery
FOR ALL
TO public
USING (true)
WITH CHECK (true);`;

  const inventorySQL = `-- SQL PARA CREAR LA TABLA INVENTORY

create table if not exists inventory (
  id uuid default gen_random_uuid() primary key,
  color text check (color in ('white', 'black')),
  size text,
  quantity integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Habilitar RLS
alter table inventory enable row level security;

-- Política de lectura pública
create policy "Public Read Inventory"
on inventory for select
to public
using (true);

-- Insertar datos iniciales de ejemplo
insert into inventory (color, size, quantity) values
  ('white', 'S', 50),
  ('white', 'M', 45),
  ('white', 'L', 30),
  ('black', 'S', 40),
  ('black', 'M', 35),
  ('black', 'L', 20)
on conflict do nothing;
`;

  // --- MODALS ---
  
  const DeleteConfirmationModal = () => {
      if (!itemToDelete) return null;
      return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 text-red-600 mb-4">
                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                        <Trash2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold">Confirmar Eliminación</h3>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    ¿Estás seguro que deseas eliminar el diseño <span className="font-bold text-gray-900 dark:text-white">"{itemToDelete.name}"</span>? 
                    <br/><br/>
                    Esta acción no se puede deshacer.
                </p>

                <div className="flex justify-end gap-3">
                    <button 
                        onClick={() => setItemToDelete(null)}
                        className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={confirmDeleteGalleryItem}
                        className="px-4 py-2 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
                    >
                        Sí, Eliminar
                    </button>
                </div>
            </div>
        </div>
      );
  }

  const OrderDetailModal = () => {
    if (!selectedOrder) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto md:overflow-hidden">
            <div className="bg-white dark:bg-gray-900 w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl overflow-y-auto md:overflow-hidden flex flex-col md:flex-row relative border border-gray-200 dark:border-gray-800">
                <button 
                    onClick={() => setSelectedOrder(null)}
                    className="absolute top-4 right-4 z-50 p-2 bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black rounded-full backdrop-blur-sm transition-all shadow-md"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Left: 3D Visualization */}
                <div className="w-full md:w-1/2 h-80 md:h-auto bg-gray-100 dark:bg-gray-800 relative border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 shrink-0">
                    <div className="absolute top-4 left-4 z-10 bg-white/80 dark:bg-black/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                        Render en Vivo
                    </div>
                    {/* Reusing Scene component to show the exact config */}
                    <Scene config={selectedOrder.config} />
                </div>

                {/* Right: Details & Data */}
                <div className="w-full md:w-1/2 p-6 md:p-8 md:overflow-y-auto bg-white dark:bg-gray-900">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                Pedido #{selectedOrder.id}
                            </h2>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(selectedOrder.date)}
                            </div>
                        </div>
                        <div className="relative inline-block text-left group w-full sm:w-auto">
                            <button className={`inline-flex items-center justify-between gap-2 px-4 py-2 rounded-lg text-sm font-bold border cursor-pointer uppercase tracking-wide transition-all w-full sm:w-auto ${getStatusColor(selectedOrder.status)}`}>
                                {selectedOrder.status === 'pending' && 'Pendiente'}
                                {selectedOrder.status === 'processing' && 'Procesando'}
                                {selectedOrder.status === 'shipped' && 'Enviado'}
                                <ChevronDown className="w-4 h-4 opacity-50" />
                            </button>
                            
                             <div className="hidden group-hover:block absolute right-0 mt-0 w-full sm:w-48 rounded-lg shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-20 overflow-hidden">
                                {(['pending', 'processing', 'shipped'] as OrderStatus[]).map((status) => (
                                    <div 
                                        key={status}
                                        onClick={() => handleStatusChange(selectedOrder.id, status)}
                                        className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-between border-b border-gray-100 dark:border-gray-700 last:border-0"
                                    >
                                        <span className="capitalize">
                                            {status === 'pending' && 'Pendiente'}
                                            {status === 'processing' && 'Procesando'}
                                            {status === 'shipped' && 'Enviado'}
                                        </span>
                                        {selectedOrder.status === status && <Check className="w-4 h-4 text-pink-500" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Customer Section */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-100 dark:border-gray-800">
                            <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
                                <User className="w-4 h-4" /> Cliente
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <div className="font-bold text-lg">{selectedOrder.customerName}</div>
                                    <div className="text-gray-500 text-sm">{selectedOrder.email}</div>
                                </div>
                                <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <Phone className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
                                    <span>{selectedOrder.phone}</span>
                                </div>
                                <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
                                    <span>{selectedOrder.address}</span>
                                </div>
                            </div>
                        </div>

                        {/* Product Section */}
                        <div>
                             <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
                                <Box className="w-4 h-4" /> Producto
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <span className="block text-gray-500 text-xs uppercase">Talla</span>
                                    <span className="font-bold text-lg">{selectedOrder.size}</span>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <span className="block text-gray-500 text-xs uppercase">Color Base</span>
                                    <span className="font-bold text-lg capitalize">{selectedOrder.config.color === 'white' ? 'Blanca' : 'Negra'}</span>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg col-span-2">
                                    <span className="block text-gray-500 text-xs uppercase">Gramaje</span>
                                    <span className="font-bold">{selectedOrder.grammage}</span>
                                </div>
                            </div>

                            {/* Files Download */}
                            <div className="space-y-2">
                                <span className="text-xs font-bold uppercase text-gray-400">Archivos Originales (PNG Transparente)</span>
                                {selectedOrder.config.layers.map((layer, idx) => (
                                    <div key={layer.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden p-1">
                                                <img src={layer.textureUrl} alt={`Layer ${idx}`} className="w-full h-full object-contain" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm">Diseño #{idx + 1}</div>
                                                <div className="text-xs text-gray-500">
                                                    {layer.textureUrl.includes('supabase') ? 'Cloud Stored' : 'Local File'}
                                                </div>
                                            </div>
                                        </div>
                                        <a 
                                            href={layer.textureUrl} 
                                            download={`order-${selectedOrder.id}-design-${idx+1}.png`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/30 rounded-lg transition-colors"
                                            title="Descargar Original"
                                        >
                                            <Download className="w-5 h-5" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payment */}
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                            <h3 className="text-sm font-bold uppercase text-gray-400 mb-2 flex items-center gap-2">
                                <CreditCard className="w-4 h-4" /> Total
                            </h3>
                            <div className="text-3xl font-black text-gray-900 dark:text-white">
                                {formatCurrency(selectedOrder.total)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    // CAMBIO IMPORTANTE: Estructura flex con altura fija para scroll interno
    <div className="max-w-7xl mx-auto p-4 md:p-6 h-[calc(100vh-85px)] flex flex-col">
      {selectedOrder && <OrderDetailModal />}
      {itemToDelete && <DeleteConfirmationModal />}

      {/* SECCIÓN FIJA: Cabecera y Pestañas */}
      <div className="shrink-0 mb-4 z-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Panel Administrativo</h1>
                <p className="text-gray-500 dark:text-gray-400">Control de Pedidos y Base de Datos de Clientes</p>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="relative w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder={activeTab === 'customers' ? "Buscar cliente..." : activeTab === 'gallery' ? "Buscar diseño..." : "Buscar..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={activeTab === 'settings' || activeTab === 'financial'}
                        className={`pl-10 pr-4 py-2 w-full md:w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 outline-none transition-all ${activeTab === 'settings' || activeTab === 'financial' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                </div>
                
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-700 dark:text-gray-300 hover:text-red-600 transition-colors rounded-lg font-bold text-sm"
                    title="Cerrar Sesión"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Salir</span>
                </button>
            </div>
        </div>

        {/* MOBILE GRID MENU (No Horizontal Scroll) */}
        <div className="grid grid-cols-3 gap-2 mb-6 md:hidden">
            {tabs.map(tab => (
                <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSearchTerm(''); }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id
                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/30'
                    : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
                }`}
                >
                <tab.icon className="w-5 h-5 mb-1.5" />
                {tab.label}
                </button>
            ))}
        </div>

        {/* DESKTOP TABS (Standard) */}
        <div className="hidden md:flex gap-4 mb-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as any); setSearchTerm(''); }}
                    className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
                >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                </button>
            ))}
        </div>
      </div>

      {/* SECCIÓN SCROLLABLE: Contenido */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 pb-4">
        {isLoading ? (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
            </div>
        ) : (
            <>
                {/* ORDERS VIEW */}
                {activeTab === 'orders' && (
                    orders.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">No hay pedidos registrados</h3>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card View */}
                            <div className="grid grid-cols-1 gap-4 md:hidden">
                                {orders.filter(order => 
                                    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    order.email.toLowerCase().includes(searchTerm.toLowerCase())
                                ).map((order) => (
                                    <div key={order.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <span className="text-xs font-bold text-gray-400 block mb-1">ID: #{order.id}</span>
                                                <div className="font-bold text-lg text-gray-900 dark:text-white">{order.customerName}</div>
                                            </div>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                                {order.status === 'pending' && 'Pendiente'}
                                                {order.status === 'processing' && 'Procesando'}
                                                {order.status === 'shipped' && 'Enviado'}
                                            </span>
                                        </div>
                                        <div className="space-y-1 mb-4 text-sm text-gray-600 dark:text-gray-300">
                                            <div className="flex justify-between">
                                                <span>Fecha:</span>
                                                <span>{formatDate(order.date)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Email:</span>
                                                <span className="truncate max-w-[150px]">{order.email}</span>
                                            </div>
                                            <div className="flex justify-between font-bold text-gray-900 dark:text-white border-t border-gray-100 dark:border-gray-800 pt-2 mt-2">
                                                <span>Total:</span>
                                                <span className="text-pink-600">{formatCurrency(order.total)}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setSelectedOrder(order)}
                                            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-pink-600 hover:bg-pink-700 py-2.5 rounded-lg transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Ver Detalles
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden animate-fade-in">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                                <th className="p-4">ID / Fecha</th>
                                                <th className="p-4">Cliente</th>
                                                <th className="p-4">Total</th>
                                                <th className="p-4 text-center">Estado</th>
                                                <th className="p-4 text-center">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {orders.filter(order => 
                                                order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                order.email.toLowerCase().includes(searchTerm.toLowerCase())
                                            ).map((order) => (
                                                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                    <td className="p-4">
                                                        <div className="font-mono text-sm font-bold text-pink-600">#{order.id}</div>
                                                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {formatDate(order.date)}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-medium text-gray-900 dark:text-white">{order.customerName}</div>
                                                        <div className="text-sm text-gray-500">{order.email}</div>
                                                    </td>
                                                    <td className="p-4 font-bold text-gray-900 dark:text-white">
                                                        {formatCurrency(order.total)}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                                            {order.status === 'pending' && 'Pendiente'}
                                                            {order.status === 'processing' && 'Procesando'}
                                                            {order.status === 'shipped' && 'Enviado'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <button 
                                                            onClick={() => setSelectedOrder(order)}
                                                            className="inline-flex items-center gap-1 text-sm font-bold text-pink-600 hover:text-pink-700 bg-pink-50 hover:bg-pink-100 dark:bg-pink-900/20 dark:hover:bg-pink-900/40 px-3 py-1.5 rounded-lg transition-colors"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            Ver Detalles
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )
                )}

                {/* CUSTOMERS VIEW */}
                {activeTab === 'customers' && (
                    customers.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">No hay clientes en la base de datos</h3>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card View */}
                            <div className="grid grid-cols-1 gap-4 md:hidden">
                                {customers.filter(customer =>
                                    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    customer.phone.includes(searchTerm)
                                ).map((customer) => (
                                    <div key={customer.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xl">
                                                {customer.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-white text-lg">{customer.name}</div>
                                                <div className="text-xs text-gray-500">Reg: {new Date(customer.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                {customer.email}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                {customer.phone}
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <MapPin className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                                                <span className="text-xs">{customer.address}</span>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex justify-between items-center text-xs">
                                            <span className="text-gray-500 uppercase font-bold">Última compra</span>
                                            <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-medium">{new Date(customer.lastOrderAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden animate-fade-in">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                                <th className="p-4">Cliente</th>
                                                <th className="p-4">Contacto</th>
                                                <th className="p-4">Ubicación</th>
                                                <th className="p-4">Última Compra</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {customers.filter(customer =>
                                                customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                customer.phone.includes(searchTerm)
                                            ).map((customer) => (
                                                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">
                                                                {customer.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-gray-900 dark:text-white">{customer.name}</div>
                                                                <div className="text-xs text-gray-500">Registrado el {new Date(customer.createdAt).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col gap-1 text-sm">
                                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                                <User className="w-3 h-3 text-gray-400" />
                                                                {customer.email}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                                <Phone className="w-3 h-3 text-gray-400" />
                                                                {customer.phone}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300 max-w-xs">
                                                            <MapPin className="w-3 h-3 mt-1 text-gray-400 shrink-0" />
                                                            {customer.address}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                                            {new Date(customer.lastOrderAt).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )
                )}

                {/* GALLERY MANAGEMENT VIEW */}
                {activeTab === 'gallery' && (
                    galleryItems.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                            <Grid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">No hay diseños en la galería</h3>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card View */}
                            <div className="grid grid-cols-1 gap-4 md:hidden">
                                {galleryItems.filter(item => 
                                    item.name.toLowerCase().includes(searchTerm.toLowerCase())
                                ).map((item) => (
                                    <div key={item.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex gap-4">
                                        {/* Left: Image */}
                                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700">
                                            {item.config.snapshotUrl ? (
                                                <img src={item.config.snapshotUrl} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Sin img</div>
                                            )}
                                        </div>
                                        
                                        {/* Right: Info & Actions */}
                                        <div className="flex flex-col justify-between flex-1">
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight">{item.name}</div>
                                                <div className="text-xs text-gray-500 mt-1 flex flex-col">
                                                    <span>Color: <span className="capitalize">{item.config.color === 'white' ? 'Blanca' : 'Negra'}</span></span>
                                                    <span>{formatDate(item.createdAt)}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex justify-end mt-2">
                                                <button 
                                                    onClick={() => requestDeleteGalleryItem(item.id, item.name)}
                                                    disabled={deletingId === item.id}
                                                    className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg transition-colors w-full justify-center ${deletingId === item.id ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40'}`}
                                                >
                                                    {deletingId === item.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Trash2 className="w-4 h-4" />
                                                            Eliminar
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden animate-fade-in">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                                <th className="p-4">Vista Previa</th>
                                                <th className="p-4">Nombre / Detalles</th>
                                                <th className="p-4">Fecha Creación</th>
                                                <th className="p-4 text-center">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {galleryItems.filter(item => 
                                                item.name.toLowerCase().includes(searchTerm.toLowerCase())
                                            ).map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                    <td className="p-4">
                                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                                            {item.config.snapshotUrl ? (
                                                                <img src={item.config.snapshotUrl} alt={item.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Sin img</div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-bold text-gray-900 dark:text-white mb-1">{item.name}</div>
                                                        <div className="text-xs text-gray-500 flex flex-col gap-1">
                                                            <span>Color: <span className="capitalize">{item.config.color === 'white' ? 'Blanca' : 'Negra'}</span></span>
                                                            <span>Capas: {item.config.layers.length}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                                        {formatDate(item.createdAt)}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <button 
                                                            onClick={() => requestDeleteGalleryItem(item.id, item.name)}
                                                            disabled={deletingId === item.id}
                                                            className={`inline-flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${deletingId === item.id ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40'}`}
                                                        >
                                                            {deletingId === item.id ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                    Borrando...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Trash2 className="w-4 h-4" />
                                                                    Eliminar
                                                                </>
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )
                )}

                {/* FINANCIAL DASHBOARD */}
                {activeTab === 'financial' && (
                    <div className="animate-fade-in space-y-8">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Card 1: Total Orders */}
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Package className="w-16 h-16 text-blue-500" />
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600">
                                        <ShoppingBag className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Pedidos Totales</h3>
                                </div>
                                <div className="text-3xl font-black text-gray-900 dark:text-white">
                                    {totalOrdersCount}
                                </div>
                                <p className="text-xs text-blue-600 mt-1 font-medium">Histórico global</p>
                            </div>

                            {/* Card 2: Orders In Process */}
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Activity className="w-16 h-16 text-yellow-500" />
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg text-yellow-600">
                                        <Loader2 className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">En Proceso</h3>
                                </div>
                                <div className="text-3xl font-black text-gray-900 dark:text-white">
                                    {processingOrdersCount + pendingOrdersCount}
                                </div>
                                <p className="text-xs text-yellow-600 mt-1 font-medium">Pendientes de envío</p>
                            </div>

                            {/* Card 3: Orders Shipped */}
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Check className="w-16 h-16 text-green-500" />
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg text-green-600">
                                        <Box className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Pedidos Enviados</h3>
                                </div>
                                <div className="text-3xl font-black text-gray-900 dark:text-white">
                                    {shippedOrdersCount}
                                </div>
                                <p className="text-xs text-green-600 mt-1 font-medium">Completados</p>
                            </div>

                            {/* Card 4: Realized Revenue */}
                            <div className="bg-gradient-to-br from-pink-600 to-orange-500 p-6 rounded-2xl shadow-lg shadow-pink-500/20 relative overflow-hidden text-white">
                                <div className="absolute top-0 right-0 p-4 opacity-20">
                                    <DollarSign className="w-16 h-16 text-white" />
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-white/20 rounded-lg text-white backdrop-blur-sm">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-bold text-white/80 uppercase">Total Devengado</h3>
                                </div>
                                <div className="text-3xl font-black text-white">
                                    {formatCurrency(realizedRevenue)}
                                </div>
                                <div className="flex justify-between items-end mt-1">
                                    <p className="text-xs text-white/80 font-medium">Solo pedidos enviados</p>
                                    {potentialRevenue > 0 && (
                                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white/90">
                                            + {formatCurrency(potentialRevenue)} por cobrar
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Detailed Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 md:col-span-2">
                                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-gray-500" />
                                    Distribución de Pedidos
                                </h3>
                                
                                <div className="space-y-6">
                                    {/* Shipped Bar */}
                                    <div>
                                        <div className="flex justify-between mb-2 text-sm">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Enviados (Completados)</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{shippedOrdersCount} ({shippedPercentage.toFixed(0)}%)</span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                                            <div className="bg-green-500 h-3 rounded-full" style={{ width: `${shippedPercentage}%` }}></div>
                                        </div>
                                    </div>

                                    {/* Processing Bar */}
                                    <div>
                                        <div className="flex justify-between mb-2 text-sm">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">En Proceso (Producción)</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{processingOrdersCount} ({processingPercentage.toFixed(0)}%)</span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                                            <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${processingPercentage}%` }}></div>
                                        </div>
                                    </div>

                                    {/* Pending Bar */}
                                    <div>
                                        <div className="flex justify-between mb-2 text-sm">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Pendientes (Nuevos)</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{pendingOrdersCount} ({pendingPercentage.toFixed(0)}%)</span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                                            <div className="bg-yellow-400 h-3 rounded-full" style={{ width: `${pendingPercentage}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Efficiency Metric */}
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-center">
                                <div className="w-24 h-24 rounded-full border-8 border-gray-100 dark:border-gray-800 flex items-center justify-center mb-4 relative">
                                    <Percent className="w-8 h-8 text-gray-400 absolute" />
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                            cx="48"
                                            cy="48"
                                            r="38"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="transparent"
                                            className="text-pink-500"
                                            strokeDasharray={`${2 * Math.PI * 38}`}
                                            strokeDashoffset={`${2 * Math.PI * 38 * (1 - shippedPercentage / 100)}`}
                                        />
                                    </svg>
                                </div>
                                <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">
                                    {shippedPercentage.toFixed(0)}%
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wide">Tasa de Cumplimiento</p>
                            </div>
                        </div>
                        
                        {/* INVENTORY SUMMARY SECTION (NEW) */}
                        <div>
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-gray-500" />
                            Resumen de Inventario
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Card 1: Total Stock */}
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Shirt className="w-16 h-16 text-indigo-500" />
                                    </div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg text-indigo-600">
                                            <Layers className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Stock Total</h3>
                                    </div>
                                    <div className="text-3xl font-black text-gray-900 dark:text-white">
                                        {totalStock}
                                    </div>
                                    <p className="text-xs text-indigo-600 mt-1 font-medium">Camisetas disponibles</p>
                                </div>

                                {/* Card 2: White Stock */}
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 relative overflow-hidden group">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 border border-gray-200 dark:border-gray-700">
                                            <div className="w-5 h-5 bg-white rounded-full border border-gray-300"></div>
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Stock Blancas</h3>
                                    </div>
                                    <div className="text-3xl font-black text-gray-900 dark:text-white">
                                        {whiteStock}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 font-medium">Todas las tallas</p>
                                </div>

                                {/* Card 3: Black Stock */}
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 relative overflow-hidden group">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 border border-gray-200 dark:border-gray-700">
                                            <div className="w-5 h-5 bg-black rounded-full border border-gray-600"></div>
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Stock Negras</h3>
                                    </div>
                                    <div className="text-3xl font-black text-gray-900 dark:text-white">
                                        {blackStock}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 font-medium">Todas las tallas</p>
                                </div>

                                {/* Card 4: Estimated Value */}
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <DollarSign className="w-16 h-16 text-green-500" />
                                    </div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg text-green-600">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Valor Inventario</h3>
                                    </div>
                                    <div className="text-xl font-black text-gray-900 dark:text-white">
                                        {formatCurrency(estimatedInventoryValue)}
                                    </div>
                                    <p className="text-xs text-green-600 mt-1 font-medium">Estimado (Costo venta base)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SETTINGS VIEW */}
                {activeTab === 'settings' && (
                <div className="max-w-4xl mx-auto animate-fade-in space-y-8">
                    
                    {/* Logo Upload Section */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg text-indigo-600">
                                <ImageIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Personalización de Marca</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Actualiza el logo principal de la aplicación (Sobrescribe LOGO/logo.png).</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700 p-2">
                                <img src={`${APP_LOGO_URL}?t=${Date.now()}`} alt="Current Logo" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-1">
                                <input 
                                        type="file" 
                                        ref={logoInputRef} 
                                        onChange={handleLogoUpload} 
                                        accept="image/png, image/jpeg, image/webp" 
                                        className="hidden" 
                                    />
                                <button 
                                        onClick={() => logoInputRef.current?.click()}
                                        disabled={isUploadingLogo}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    {isUploadingLogo ? 'Subiendo...' : 'Subir Nuevo Logo'}
                                </button>
                                <p className="text-xs text-gray-500 mt-2">Recomendado: PNG Transparente (512x512px). Los cambios pueden tardar unos segundos en reflejarse.</p>
                            </div>
                        </div>
                    </div>

                    {/* Storage Settings */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-pink-100 dark:bg-pink-900/20 rounded-lg text-pink-600">
                                <Database className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">SQL para Imágenes (Storage)</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Ejecuta esto si las imágenes no se suben.</p>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute top-3 right-3">
                                <button 
                                    onClick={() => copyToClipboard(storageSQL, 'storage')}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {copiedStorage ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                    {copiedStorage ? 'Copiado' : 'Copiar SQL'}
                                </button>
                            </div>
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm font-mono leading-relaxed border border-gray-800">
                                {storageSQL}
                            </pre>
                        </div>
                    </div>

                    {/* Database Permissions Settings */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg text-purple-600">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">SQL para Permisos de Galería</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Ejecuta esto si no puedes ELIMINAR diseños.</p>
                            </div>
                        </div>

                            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-lg p-4 mb-6 flex gap-3">
                            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-500 shrink-0" />
                            <div>
                                <h3 className="font-bold text-yellow-800 dark:text-yellow-400 text-sm">Advertencia de Seguridad (RLS)</h3>
                                <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                                    Supabase bloquea la eliminación de registros por defecto para usuarios anónimos. 
                                    Este script habilita una política pública de borrado para que el panel funcione sin autenticación.
                                </p>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute top-3 right-3">
                                <button 
                                    onClick={() => copyToClipboard(gallerySQL, 'gallery')}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {copiedGallery ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                    {copiedGallery ? 'Copiado' : 'Copiar SQL'}
                                </button>
                            </div>
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm font-mono leading-relaxed border border-gray-800">
                                {gallerySQL}
                            </pre>
                        </div>
                    </div>
                    
                    {/* Inventory SQL Settings */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg text-indigo-600">
                                <Layers className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">SQL para Tabla de Inventario</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Ejecuta esto si ves el error "Could not find the table inventory".</p>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute top-3 right-3">
                                <button 
                                    onClick={() => copyToClipboard(inventorySQL, 'inventory')}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {copiedInventory ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                    {copiedInventory ? 'Copiado' : 'Copiar SQL'}
                                </button>
                            </div>
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm font-mono leading-relaxed border border-gray-800">
                                {inventorySQL}
                            </pre>
                        </div>
                    </div>
                </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};