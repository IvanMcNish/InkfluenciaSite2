
import React, { useEffect, useState } from 'react';
import { Package, Search, Calendar, Eye, ChevronDown, Check, X, User, Phone, MapPin, Box, Download, CreditCard, Map, Navigation, Tag } from 'lucide-react';
import { getOrders, updateOrderStatus, toggleOrderDiscount } from '../../services/orderService';
import { Order, OrderStatus } from '../../types';
import { formatCurrency } from '../../constants';
import { Scene } from '../Scene';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Ubicación fija de la empresa
  const ORIGIN_ADDRESS = "Carrera 31 # 20 - 26, Bucaramanga";

  const loadOrders = async () => {
    setIsLoading(true);
    const data = await getOrders();
    setOrders(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? ({ ...prev, status: newStatus }) : null);
    }

    const success = await updateOrderStatus(orderId, newStatus);
    if (!success) {
        loadOrders();
        alert("Error al actualizar el estado");
    }
  };

  const handleDiscountToggle = async (checked: boolean) => {
      if (!selectedOrder) return;
      
      const DISCOUNT_AMOUNT = 5000;
      
      // Calculate optimistic new total for UI
      // If checking the box (applying discount), subtract. If unchecking, add.
      // Use Math.max to prevent negative totals just in case
      const newTotal = checked 
          ? Math.max(0, selectedOrder.total - DISCOUNT_AMOUNT)
          : selectedOrder.total + DISCOUNT_AMOUNT;

      // Optimistic Update: Update State IMMEDIATELY
      const updatedOrder = { ...selectedOrder, adminDiscountApplied: checked, total: newTotal };
      setSelectedOrder(updatedOrder);
      // Also update the list in the background
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));

      // DB Update (Async)
      const success = await toggleOrderDiscount(selectedOrder.id, selectedOrder.total, checked);
      if (!success) {
          // Revert if failed
          alert("Error al aplicar el descuento");
          loadOrders(); // Reload from DB to be safe
          if (selectedOrder) setSelectedOrder(selectedOrder); // Reset local state to original from closure
      }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900';
      case 'shipped': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const OrderDetailModal = () => {
    if (!selectedOrder) return null;

    // Generar URLs para el mapa
    const encodedOrigin = encodeURIComponent(ORIGIN_ADDRESS);
    const encodedDest = encodeURIComponent(selectedOrder.address);
    // URL para el iframe (Embed)
    const iframeUrl = `https://maps.google.com/maps?saddr=${encodedOrigin}&daddr=${encodedDest}&output=embed`;
    // URL para abrir en nueva pestaña (Full Google Maps)
    const externalMapUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodedOrigin}&destination=${encodedDest}`;

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
                    <Scene config={selectedOrder.config} showMeasurements={true} />
                </div>

                {/* Right: Details & Data */}
                <div className="w-full md:w-1/2 p-6 md:p-8 md:overflow-y-auto bg-white dark:bg-gray-900">
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

                    <div className="space-y-6">
                        {/* Info Cliente */}
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

                        {/* Mapa de Ruta */}
                        <div className="bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                             <div className="p-4 pb-2">
                                <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
                                    <Map className="w-4 h-4" /> Ruta de Entrega
                                </h3>
                                {/* Visual Timeline */}
                                <div className="flex flex-col gap-0 mb-4 pl-1">
                                    {/* Origen */}
                                    <div className="flex gap-3 relative">
                                        <div className="flex flex-col items-center">
                                            <div className="w-3 h-3 rounded-full bg-pink-500 ring-4 ring-pink-100 dark:ring-pink-900/30 z-10"></div>
                                            <div className="w-0.5 h-12 bg-gray-200 dark:bg-gray-600 absolute top-3"></div>
                                        </div>
                                        <div className="pb-4">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Origen (Inkfluencia)</p>
                                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[250px]">{ORIGIN_ADDRESS}</p>
                                        </div>
                                    </div>

                                    {/* Destino */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/30 z-10"></div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Destino (Cliente)</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedOrder.address}</p>
                                        </div>
                                    </div>
                                </div>
                             </div>

                             {/* Iframe Map */}
                             <div className="relative w-full h-56 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 group">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    scrolling="no"
                                    src={iframeUrl}
                                    title="Ruta de Entrega"
                                    className="filter grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500"
                                ></iframe>
                                
                                <div className="absolute bottom-3 right-3">
                                     <a 
                                        href={externalMapUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
                                     >
                                        <Navigation className="w-3 h-3 text-blue-500" /> Abrir GPS
                                     </a>
                                </div>
                             </div>
                        </div>

                        {/* Info Producto */}
                        <div>
                             <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
                                <Box className="w-4 h-4" /> Producto
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <span className="block text-gray-500 text-xs uppercase">Género / Talla</span>
                                    <span className="font-bold text-lg capitalize">{selectedOrder.gender === 'male' ? 'H' : 'M'} - {selectedOrder.size}</span>
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

                            <div className="space-y-2">
                                <span className="text-xs font-bold uppercase text-gray-400">Archivos Originales</span>
                                {selectedOrder.config.layers.map((layer, idx) => (
                                    <div key={layer.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden p-1">
                                                <img src={layer.textureUrl} alt={`Layer ${idx}`} className="w-full h-full object-contain" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm">Diseño #{idx + 1}</div>
                                            </div>
                                        </div>
                                        <a 
                                            href={layer.textureUrl} 
                                            download={`order-${selectedOrder.id}-design-${idx+1}.png`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/30 rounded-lg transition-colors"
                                        >
                                            <Download className="w-5 h-5" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                            <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
                                <CreditCard className="w-4 h-4" /> Total
                            </h3>
                            
                            {/* Checkbox for Admin Discount */}
                            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                                <div className="relative flex items-center">
                                    <input 
                                        type="checkbox" 
                                        id="admin-discount" 
                                        checked={selectedOrder.adminDiscountApplied || false}
                                        onChange={(e) => handleDiscountToggle(e.target.checked)}
                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 transition-all checked:border-pink-500 checked:bg-pink-500"
                                    />
                                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                    </div>
                                </div>
                                <label htmlFor="admin-discount" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-pink-500" />
                                    Aplicar Descuento Admin (-$5.000)
                                </label>
                            </div>

                            <div className="flex justify-between items-center mb-4">
                                <div className="text-3xl font-black text-gray-900 dark:text-white transition-all duration-300">
                                    {formatCurrency(selectedOrder.total)}
                                </div>
                                {selectedOrder.adminDiscountApplied && (
                                    <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded font-bold animate-pulse">
                                        Descuento Aplicado
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="animate-fade-in">
        <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
                type="text" 
                placeholder="Buscar pedido por ID, cliente o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full md:w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
            />
        </div>

        {selectedOrder && <OrderDetailModal />}

        {orders.length === 0 && !isLoading ? (
            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">No hay pedidos registrados</h3>
            </div>
        ) : (
            <>
                {/* Mobile View */}
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

                {/* Desktop View */}
                <div className="hidden md:block bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                    <th className="p-4">ID / Fecha</th>
                                    <th className="p-4">Cliente</th>
                                    <th className="p-4">Detalle</th>
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
                                            <div className="text-xs text-gray-400 mt-1">{formatDate(order.date)}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900 dark:text-white">{order.customerName}</div>
                                            <div className="text-sm text-gray-500">{order.email}</div>
                                        </td>
                                        <td className="p-4 text-sm">
                                            {order.gender === 'male' ? 'Hombre' : 'Mujer'} / {order.size}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900 dark:text-white">
                                                {formatCurrency(order.total)}
                                            </div>
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
                                                Ver
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </>
        )}
    </div>
  );
};
