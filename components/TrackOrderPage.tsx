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
            <div className="liquid-glass p-6 rounded-3xl shadow-xl mb-8 text-left">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-550 dark:text-pink-400 w-5 h-5 z-10" />
                        <input 
                            type="text" 
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            placeholder="Ej. AB12CD34"
                            className="w-full pl-12 pr-4 py-4 rounded-xl glass-input outline-none text-lg font-mono uppercase text-zinc-950 dark:text-white font-extrabold"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading || !orderId.trim()}
                        className="px-8 py-4 bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-500 hover:to-orange-400 text-white font-black rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
                        {!loading && <ArrowRight className="w-5 h-5" />}
                    </button>
                </form>
            </div>

            {/* Result Area */}
            {error && (
                <div className="bg-red-50/60 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 p-6 rounded-2xl text-center text-red-650 dark:text-red-350 animate-fade-in flex flex-col items-center gap-2 backdrop-blur-sm">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                    <p className="font-extrabold text-sm leading-relaxed">{error}</p>
                </div>
            )}

            {order && (
                <div className="animate-fade-in space-y-6">
                    {/* Status Timeline */}
                    <div className="liquid-glass p-8 rounded-3xl shadow-xl text-left">
                        <h3 className="font-black text-gray-950 dark:text-white mb-8 border-b border-white/20 dark:border-white/5 pb-4 uppercase tracking-wider text-sm">
                            Estado del Envío
                        </h3>
                        
                        <div className="relative flex justify-between">
                            {/* Progress Bar Background */}
                            <div className="absolute top-1/2 left-0 w-full h-1.5 bg-white/30 dark:bg-zinc-800 -translate-y-1/2 rounded-full -z-10"></div>
                            
                            {/* Active Progress Bar */}
                            <div 
                                className="absolute top-1/2 left-0 h-1.5 bg-gradient-to-r from-pink-500 to-orange-500 -translate-y-1/2 rounded-full -z-10 transition-all duration-1000"
                                style={{ width: order.status === 'pending' ? '0%' : order.status === 'processing' ? '50%' : '100%' }}
                            ></div>

                            {/* Step 1: Received */}
                            <div className="flex flex-col items-center gap-2 bg-transparent px-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shadow-md ${getStepStatus(1) === 'completed' ? 'bg-gradient-to-tr from-pink-500 to-orange-400 border-none text-white' : 'bg-white/40 dark:bg-zinc-950/40 border-white/40 dark:border-zinc-800 text-gray-400'}`}>
                                    <Clock className="w-5 h-5 shadow-sm" />
                                </div>
                                <span className={`text-[10px] tracking-wider font-extrabold uppercase ${getStepStatus(1) === 'completed' ? 'text-pink-600 dark:text-pink-400' : 'text-gray-450 dark:text-gray-500'}`}>Recibido</span>
                            </div>

                            {/* Step 2: Processing */}
                            <div className="flex flex-col items-center gap-2 bg-transparent px-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shadow-md ${getStepStatus(2) === 'completed' ? 'bg-gradient-to-tr from-pink-500 to-orange-400 border-none text-white' : 'bg-white/40 dark:bg-zinc-950/40 border-white/40 dark:border-zinc-800 text-gray-400'}`}>
                                    <Package className="w-5 h-5" />
                                </div>
                                <span className={`text-[10px] tracking-wider font-extrabold uppercase ${getStepStatus(2) === 'completed' ? 'text-pink-600 dark:text-pink-400' : 'text-gray-455 dark:text-gray-500'}`}>Producción</span>
                            </div>

                            {/* Step 3: Shipped */}
                            <div className="flex flex-col items-center gap-2 bg-transparent px-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shadow-md ${getStepStatus(3) === 'completed' ? 'bg-green-600 border-none text-white' : 'bg-white/40 dark:bg-zinc-950/40 border-white/40 dark:border-zinc-800 text-gray-400'}`}>
                                    {getStepStatus(3) === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                                </div>
                                <span className={`text-[10px] tracking-wider font-extrabold uppercase ${getStepStatus(3) === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-gray-455 dark:text-gray-500'}`}>Enviado</span>
                            </div>
                        </div>

                        <div className="mt-8 text-center p-4 bg-white/20 dark:bg-black/25 rounded-2xl text-sm text-zinc-900 dark:text-gray-200 border border-white/10 dark:border-white/5 font-medium leading-relaxed">
                             {order.status === 'pending' && "Tu pedido ha sido recibido y estamos verificando el pago y los diseños."}
                             {order.status === 'processing' && "¡Manos a la obra! Estamos imprimiendo y confeccionando tu camiseta."}
                             {order.status === 'shipped' && "Tu pedido va en camino. Pronto podrás lucir tu estilo."}
                        </div>
                    </div>

                    {/* Order Details */}
                    <div className="grid md:grid-cols-3 gap-6 text-left">
                        {/* Summary */}
                        <div className="md:col-span-2 liquid-glass p-6 rounded-3xl shadow-sm text-left">
                            <h3 className="font-black text-sm mb-5 flex items-center gap-2 text-zinc-950 dark:text-white uppercase tracking-wider">
                                <Package className="w-5 h-5 text-pink-500" />
                                Resumen del Producto
                            </h3>
                            <div className="flex gap-4">
                                <div className="w-24 h-24 bg-white/30 dark:bg-black/40 rounded-2xl p-2 border border-white/20 dark:border-white/5 shrink-0 shadow-lg">
                                    {order.config.snapshotUrl ? (
                                        <img src={order.config.snapshotUrl} alt="Preview" className="w-full h-full object-contain filter drop-shadow-md hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-450 dark:text-gray-400 text-xs font-semibold">Sin imagen</div>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <div className="font-extrabold text-gray-950 dark:text-white text-base">Camiseta Inkfluencia</div>
                                    <div className="text-xs font-bold text-zinc-600 dark:text-gray-400 uppercase tracking-wide">Talla: <span className="font-black text-gray-950 dark:text-white">{order.size}</span></div>
                                    <div className="text-xs font-bold text-zinc-600 dark:text-gray-400 uppercase tracking-wide">Color: <span className="font-black text-gray-955 dark:text-white capitalize">{order.config.color === 'white' ? 'Blanca' : 'Negra'}</span></div>
                                    <div className="text-xs font-bold text-zinc-600 dark:text-gray-400 uppercase tracking-wide">Gramaje: <span className="font-black text-gray-950 dark:text-white">{order.grammage}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Info */}
                        <div className="liquid-glass p-6 rounded-3xl shadow-sm text-left">
                             <h3 className="font-black text-sm mb-5 flex items-center gap-2 text-zinc-950 dark:text-white uppercase tracking-wider">
                                <MapPin className="w-5 h-5 text-purple-500" />
                                Datos de Entrega
                            </h3>
                            <div className="space-y-3.5 text-sm">
                                <div>
                                    <span className="block text-zinc-600 dark:text-gray-400 text-[10px] uppercase font-black tracking-wider mb-0.5">Cliente</span>
                                    <span className="font-extrabold text-gray-955 dark:text-white text-base leading-tight block">{order.customerName}</span>
                                </div>
                                <div>
                                    <span className="block text-zinc-600 dark:text-gray-400 text-[10px] uppercase font-black tracking-wider mb-0.5">Dirección</span>
                                    <span className="font-bold text-gray-900 dark:text-zinc-200 text-sm leading-relaxed block">{order.address}</span>
                                </div>
                                <div className="pt-2 border-t border-white/20 dark:border-white/5">
                                    <span className="block text-zinc-650 dark:text-gray-400 text-[10px] uppercase font-black tracking-wider">Total</span>
                                    <span className="font-black text-pink-600 dark:text-pink-400 text-xl block">{formatCurrency(order.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};