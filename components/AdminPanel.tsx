import React, { useEffect, useState, useRef } from 'react';
import { getOrders, updateOrderStatus } from '../services/orderService';
import { getCustomers } from '../services/customerService';
import { getCollection, deleteDesignFromCollection } from '../services/galleryService';
import { uploadAppLogo, APP_LOGO_URL } from '../lib/supabaseClient';
import { Order, OrderStatus, Customer, CollectionItem } from '../types';
import { Package, Search, Calendar, X, Download, ChevronDown, Check, Eye, User, MapPin, CreditCard, Box, Phone, Loader2, Users, ShoppingBag, Settings, Database, Copy, AlertTriangle, Grid, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { formatCurrency } from '../constants';
import { Scene } from './Scene';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'customers' | 'settings' | 'gallery'>('orders');
  
  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Customers State
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Gallery State
  const [galleryItems, setGalleryItems] = useState<CollectionItem[]>([]);

  // Shared State
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Settings State
  const [copiedStorage, setCopiedStorage] = useState(false);
  const [copiedGallery, setCopiedGallery] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
      setIsLoading(true);
      if (activeTab === 'orders') {
          const loadedOrders = await getOrders();
          setOrders(loadedOrders);
      } else if (activeTab === 'customers') {
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

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? ({ ...prev, status: newStatus }) : null);
    }

    const success = await updateOrderStatus(orderId, newStatus);
    if (!success) {
        loadData(); // Revert on failure
        alert("Error al actualizar el estado");
    }
  };

  const handleDeleteGalleryItem = async (id: string, name: string) => {
      if (window.confirm(`¿Estás seguro que deseas eliminar el diseño "${name}" de la galería? Esta acción no se puede deshacer.`)) {
          const result = await deleteDesignFromCollection(id);
          if (result.success) {
              setGalleryItems(prev => prev.filter(item => item.id !== id));
          } else {
              alert(`Error al eliminar: ${result.error}\n\nPor favor ve a la pestaña "Configuración" y ejecuta el SQL actualizado.`);
          }
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
          // Optional: Force reload to show new logo across the app
          window.location.reload();
      }
  };

  const copyToClipboard = (text: string, type: 'storage' | 'gallery') => {
    navigator.clipboard.writeText(text);
    if (type === 'storage') {
        setCopiedStorage(true);
        setTimeout(() => setCopiedStorage(false), 2000);
    } else {
        setCopiedGallery(true);
        setTimeout(() => setCopiedGallery(false), 2000);
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

  const gallerySQL = `-- ACTUALIZADO: SQL PARA PERMISOS TOTALES
-- Ejecuta esto para reiniciar los permisos de la tabla gallery y permitir borrar.

-- 1. Deshabilitar y Habilitar RLS para limpiar estado
ALTER TABLE gallery DISABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR TODAS las políticas existentes (limpieza profunda)
DROP POLICY IF EXISTS "Permitir todo público" ON gallery;
DROP POLICY IF EXISTS "Enable delete for anon" ON gallery;
DROP POLICY IF EXISTS "Permitir Borrado Publico" ON gallery;
DROP POLICY IF EXISTS "Permitir Acceso Total Galeria" ON gallery;
DROP POLICY IF EXISTS "Enable read access for all users" ON gallery;
DROP POLICY IF EXISTS "Enable insert for all users" ON gallery;

-- 3. Crear UNA ÚNICA política maestra para TODO (Select, Insert, Update, Delete)
CREATE POLICY "Acceso Total Publico"
ON gallery
FOR ALL
TO public
USING (true)
WITH CHECK (true);`;

  // --- MODAL ---
  const OrderDetailModal = () => {
    if (!selectedOrder) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
                <button 
                    onClick={() => setSelectedOrder(null)}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black rounded-full backdrop-blur-sm transition-all"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Left: 3D Visualization */}
                <div className="w-full md:w-1/2 h-1/2 md:h-full bg-gray-100 dark:bg-gray-800 relative border-r border-gray-200 dark:border-gray-700">
                    <div className="absolute top-4 left-4 z-10 bg-white/80 dark:bg-black/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        Render en Vivo
                    </div>
                    {/* Reusing Scene component to show the exact config */}
                    <Scene config={selectedOrder.config} />
                </div>

                {/* Right: Details & Data */}
                <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-y-auto p-6 md:p-8 bg-white dark:bg-gray-900">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                Pedido #{selectedOrder.id}
                            </h2>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(selectedOrder.date)}
                            </div>
                        </div>
                        <div className="relative inline-block text-left group">
                            <button className={`inline-flex items-center justify-between gap-2 px-4 py-2 rounded-lg text-sm font-bold border cursor-pointer uppercase tracking-wide transition-all ${getStatusColor(selectedOrder.status)}`}>
                                {selectedOrder.status === 'pending' && 'Pendiente'}
                                {selectedOrder.status === 'processing' && 'Procesando'}
                                {selectedOrder.status === 'shipped' && 'Enviado'}
                                <ChevronDown className="w-4 h-4 opacity-50" />
                            </button>
                            
                             <div className="hidden group-hover:block absolute right-0 mt-0 w-48 rounded-lg shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-20 overflow-hidden">
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
    <div className="max-w-7xl mx-auto p-6 min-h-screen">
      {selectedOrder && <OrderDetailModal />}

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Panel Administrativo</h1>
            <p className="text-gray-500 dark:text-gray-400">Control de Pedidos y Base de Datos de Clientes</p>
        </div>
        
        <div className="flex gap-4">
            <div className="relative w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder={activeTab === 'customers' ? "Buscar cliente..." : activeTab === 'gallery' ? "Buscar diseño..." : "Buscar..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={activeTab === 'settings'}
                    className={`pl-10 pr-4 py-2 w-full md:w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 outline-none transition-all ${activeTab === 'settings' ? 'opacity-50' : ''}`}
                />
            </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('orders'); setSearchTerm(''); }}
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${activeTab === 'orders' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
          >
              <ShoppingBag className="w-4 h-4" />
              Pedidos Activos
          </button>
          <button
            onClick={() => { setActiveTab('customers'); setSearchTerm(''); }}
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${activeTab === 'customers' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
          >
              <Users className="w-4 h-4" />
              Base de Clientes
          </button>
          <button
            onClick={() => { setActiveTab('gallery'); setSearchTerm(''); }}
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${activeTab === 'gallery' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
          >
              <Grid className="w-4 h-4" />
              Galería
          </button>
          <button
            onClick={() => { setActiveTab('settings'); setSearchTerm(''); }}
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${activeTab === 'settings' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
          >
              <Settings className="w-4 h-4" />
              Configuración
          </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
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
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden animate-fade-in">
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
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden animate-fade-in">
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
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden animate-fade-in">
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
                                                    onClick={() => handleDeleteGalleryItem(item.id, item.name)}
                                                    className="inline-flex items-center gap-1 text-sm font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
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
               </div>
            )}
          </>
      )}
    </div>
  );
};