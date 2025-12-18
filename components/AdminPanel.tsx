import React, { useEffect, useState } from 'react';
import { getOrders, updateOrderStatus } from '../services/orderService';
import { Order, OrderStatus } from '../types';
import { Package, Search, Calendar, Image as ImageIcon, X, Download, ChevronDown, Check, Eye, FileImage } from 'lucide-react';
import { formatCurrency } from '../constants';

// Simple Modal Component for Image Viewing
const ImageModal = ({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) => {
  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <X className="w-8 h-8" />
        </button>
        <img 
          src={imageUrl} 
          alt="Full size view" 
          className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl bg-white" 
        />
        <div className="mt-4 flex gap-4">
          <a 
            href={imageUrl} 
            download={`inkfluencia-file-${Date.now()}.png`}
            className="flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors"
          >
            <Download className="w-5 h-5" />
            Descargar Imagen
          </a>
        </div>
      </div>
    </div>
  );
};

export const AdminPanel: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const loadedOrders = getOrders();
    setOrders(loadedOrders);
  }, []);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const updated = updateOrderStatus(orderId, newStatus);
    setOrders(updated);
  };

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen">
      {selectedImage && <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Panel de Pedidos</h1>
            <p className="text-gray-500 dark:text-gray-400">Gestiona las órdenes de Inkfluencia</p>
        </div>
        
        <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
                type="text" 
                placeholder="Buscar pedido..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full md:w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
            />
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">No hay pedidos registrados</h3>
            <p className="text-gray-400 text-sm mt-2">Los pedidos aparecerán aquí una vez que los clientes realicen compras.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                            <th className="p-4">ID / Fecha</th>
                            <th className="p-4">Cliente</th>
                            <th className="p-4">Especificaciones</th>
                            <th className="p-4">Diseño</th>
                            <th className="p-4 text-right">Total</th>
                            <th className="p-4 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredOrders.map((order) => (
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
                                    <div className="text-xs text-gray-400 mt-1 max-w-[200px] truncate" title={order.address}>{order.address}</div>
                                </td>
                                <td className="p-4">
                                    <div className="space-y-1">
                                        <div className="flex gap-2 text-sm">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                                                order.config.color === 'white' 
                                                ? 'bg-white text-gray-700 border-gray-200' 
                                                : 'bg-gray-900 text-white border-gray-700'
                                            }`}>
                                                {order.config.color === 'white' ? 'BLANCA' : 'NEGRA'}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                            Talla: <span className="font-bold">{order.size}</span>
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                            Gramaje: <span className="font-bold">{order.grammage}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        {/* Snapshot Thumbnail */}
                                        {order.config.snapshotUrl ? (
                                            <div className="relative group w-16 h-16 shrink-0">
                                                <img 
                                                    src={order.config.snapshotUrl} 
                                                    alt="3D Snapshot" 
                                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700 bg-white"
                                                />
                                                <button 
                                                    onClick={() => setSelectedImage(order.config.snapshotUrl!)}
                                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center cursor-zoom-in text-white"
                                                    title="Ver Modelo 3D"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Sin vista</span>
                                        )}

                                        {/* Original File Button */}
                                        {order.config.textureUrl && (
                                            <button
                                                onClick={() => setSelectedImage(order.config.textureUrl!)}
                                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-pink-100 dark:hover:bg-pink-900/30 text-gray-500 hover:text-pink-600 transition-colors border border-gray-200 dark:border-gray-700"
                                                title="Ver Archivo Original"
                                            >
                                                <FileImage className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-right font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(order.total)}
                                </td>
                                <td className="p-4 text-center">
                                    <div className="relative inline-block text-left group">
                                        <button className={`inline-flex items-center justify-between gap-2 px-3 py-1 rounded-full text-xs font-medium border cursor-pointer ${getStatusColor(order.status)}`}>
                                            {order.status === 'pending' && 'Pendiente'}
                                            {order.status === 'processing' && 'Procesando'}
                                            {order.status === 'shipped' && 'Enviado'}
                                            <ChevronDown className="w-3 h-3 opacity-50" />
                                        </button>
                                        
                                        {/* Dropdown for status change */}
                                        <div className="hidden group-hover:block absolute right-0 mt-0 w-36 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10 p-1">
                                            <div 
                                                onClick={() => handleStatusChange(order.id, 'pending')}
                                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-sm flex items-center justify-between"
                                            >
                                                Pendiente {order.status === 'pending' && <Check className="w-3 h-3 text-pink-500" />}
                                            </div>
                                            <div 
                                                onClick={() => handleStatusChange(order.id, 'processing')}
                                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-sm flex items-center justify-between"
                                            >
                                                Procesando {order.status === 'processing' && <Check className="w-3 h-3 text-pink-500" />}
                                            </div>
                                            <div 
                                                onClick={() => handleStatusChange(order.id, 'shipped')}
                                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-sm flex items-center justify-between"
                                            >
                                                Enviado {order.status === 'shipped' && <Check className="w-3 h-3 text-pink-500" />}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
};