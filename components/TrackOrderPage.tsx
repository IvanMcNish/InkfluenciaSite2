import React, { useState } from 'react';
import { Search, Package, Truck, CheckCircle2, AlertCircle, Clock, MapPin, Loader2, ArrowRight } from 'lucide-react';
import { getOrderById } from '../services/orderService';
import { Order } from '../types';
import { formatCurrency } from '../constants';

export const TrackOrderPage: React.FC = () => {
    const [orderId, setOrderId] = useState('');
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId.trim()) return;

        setLoading(true);
        setError('');
        setOrder(null);
        setHasSearched(true);

        try {
            const foundOrder = await getOrderById(orderId.trim().toUpperCase());
            if (foundOrder) {
                setOrder(foundOrder);
            } else {
                setError('No encontramos un pedido con ese ID. Por favor verifica e intenta de nuevo.');
            }
        } catch (err) {
            setError('Ocurrió un error al buscar el pedido.');
        } finally {
            setLoading(false);
        }
    };

    // Helper to determine active steps
    const getStepStatus = (step: number) => {
        if (!order) return 'inactive';
        
        const statusMap = {
            'pending': 1,
            'processing': 2,
            'shipped': 3
        };
        
        const currentStep = statusMap[order.status];
        if (currentStep >= step) return 'completed';
        return 'inactive';
    };

    return (
        <div className="max-w-3xl mx-auto p-6 min-h-[calc(100vh-80px)]">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-3">
                    <Package className="w-8 h-8 text-pink-500" />
                    Rastrea tu Pedido
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Ingresa el ID de tu pedido para ver el estado actual y los detalles.
                </p>
            </div>

            {/* Search Box */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 mb-8">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input 
                            type="text" 
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            placeholder="Ej. AB12CD34"
                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 outline-none transition-all text-lg font-mono uppercase"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading || !orderId.trim()}
                        className="px-8 py-4 bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-500 hover:to-orange-400 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
                        {!loading && <ArrowRight className="w-5 h-5" />}
                    </button>
                </form>
            </div>

            {/* Result Area */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-xl text-center text-red-600 dark:text-red-300 animate-fade-in flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8" />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            {order && (
                <div className="animate-fade-in space-y-6">
                    {/* Status Timeline */}
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-8 border-b border-gray-100 dark:border-gray-800 pb-4">
                            Estado del Envío
                        </h3>
                        
                        <div className="relative flex justify-between">
                            {/* Progress Bar Background */}
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 rounded-full -z-10"></div>
                            
                            {/* Active Progress Bar */}
                            <div 
                                className="absolute top-1/2 left-0 h-1 bg-pink-500 -translate-y-1/2 rounded-full -z-10 transition-all duration-1000"
                                style={{ width: order.status === 'pending' ? '0%' : order.status === 'processing' ? '50%' : '100%' }}
                            ></div>

                            {/* Step 1: Received */}
                            <div className="flex flex-col items-center gap-2 bg-white dark:bg-gray-900 px-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${getStepStatus(1) === 'completed' ? 'bg-pink-500 border-pink-500 text-white' : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'}`}>
                                    <Clock className="w-5 h-5" />
                                </div>
                                <span className={`text-xs font-bold uppercase ${getStepStatus(1) === 'completed' ? 'text-pink-600' : 'text-gray-400'}`}>Recibido</span>
                            </div>

                            {/* Step 2: Processing */}
                            <div className="flex flex-col items-center gap-2 bg-white dark:bg-gray-900 px-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${getStepStatus(2) === 'completed' ? 'bg-pink-500 border-pink-500 text-white' : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'}`}>
                                    <Package className="w-5 h-5" />
                                </div>
                                <span className={`text-xs font-bold uppercase ${getStepStatus(2) === 'completed' ? 'text-pink-600' : 'text-gray-400'}`}>Producción</span>
                            </div>

                            {/* Step 3: Shipped */}
                            <div className="flex flex-col items-center gap-2 bg-white dark:bg-gray-900 px-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${getStepStatus(3) === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'}`}>
                                    {getStepStatus(3) === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                                </div>
                                <span className={`text-xs font-bold uppercase ${getStepStatus(3) === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>Enviado</span>
                            </div>
                        </div>

                        <div className="mt-8 text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-sm text-gray-600 dark:text-gray-300">
                             {order.status === 'pending' && "Tu pedido ha sido recibido y estamos verificando el pago y los diseños."}
                             {order.status === 'processing' && "¡Manos a la obra! Estamos imprimiendo y confeccionando tu camiseta."}
                             {order.status === 'shipped' && "Tu pedido va en camino. Pronto podrás lucir tu estilo."}
                        </div>
                    </div>

                    {/* Order Details */}
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Summary */}
                        <div className="md:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5 text-gray-400" />
                                Resumen del Producto
                            </h3>
                            <div className="flex gap-4">
                                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700 shrink-0">
                                    {order.config.snapshotUrl ? (
                                        <img src={order.config.snapshotUrl} alt="Preview" className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sin imagen</div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <div className="font-bold text-gray-900 dark:text-white">Camiseta Inkfluencia</div>
                                    <div className="text-sm text-gray-500">Talla: <span className="font-medium text-gray-800 dark:text-gray-200">{order.size}</span></div>
                                    <div className="text-sm text-gray-500">Color: <span className="font-medium text-gray-800 dark:text-gray-200 capitalize">{order.config.color === 'white' ? 'Blanca' : 'Negra'}</span></div>
                                    <div className="text-sm text-gray-500">Gramaje: <span className="font-medium text-gray-800 dark:text-gray-200">{order.grammage}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Info */}
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                             <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-gray-400" />
                                Datos de Entrega
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="block text-gray-500 text-xs uppercase">Cliente</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{order.customerName}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs uppercase">Dirección</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{order.address}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs uppercase">Total</span>
                                    <span className="font-bold text-pink-600 text-lg">{formatCurrency(order.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};