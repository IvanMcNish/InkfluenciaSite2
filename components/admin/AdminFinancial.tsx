import React, { useEffect, useState } from 'react';
import { Package, ShoppingBag, Loader2, Box, Check, TrendingUp, DollarSign, BarChart3, Percent, Layers, Shirt, Ruler, Weight, Activity } from 'lucide-react';
import { getOrders } from '../../services/orderService';
import { Order } from '../../types';
import { formatCurrency, SIZES } from '../../constants';
import { useInventory } from '../../hooks/useInventory';

export const AdminFinancial: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  
  // Use the shared hook for inventory data
  const { inventory, metrics, loading: isLoadingInventory, getQuantity } = useInventory();

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoadingOrders(true);
      const loadedOrders = await getOrders();
      setOrders(loadedOrders);
      setIsLoadingOrders(false);
    };
    loadOrders();
  }, []);

  // Order Calculations
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const processingOrdersCount = orders.filter(o => o.status === 'processing').length;
  const shippedOrdersCount = orders.filter(o => o.status === 'shipped').length;

  const realizedRevenue = orders
    .filter(o => o.status === 'shipped')
    .reduce((acc, curr) => acc + curr.total, 0);

  const potentialRevenue = orders
    .filter(o => o.status !== 'shipped')
    .reduce((acc, curr) => acc + curr.total, 0);

  const shippedPercentage = totalOrdersCount > 0 ? (shippedOrdersCount / totalOrdersCount) * 100 : 0;
  const processingPercentage = totalOrdersCount > 0 ? (processingOrdersCount / totalOrdersCount) * 100 : 0;
  const pendingPercentage = totalOrdersCount > 0 ? (pendingOrdersCount / totalOrdersCount) * 100 : 0;

  if (isLoadingOrders || isLoadingInventory) return <div className="p-8 text-center">Cargando datos financieros e inventario...</div>;

  return (
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
                        
                        {/* INVENTORY SUMMARY SECTION (Shared Logic via Hook) */}
                        <div>
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-gray-500" />
                            Resumen de Inventario (Tiempo Real)
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
                                        {metrics.totalStock}
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
                                        {metrics.whiteTotal}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 font-medium flex gap-2">
                                        <span className="text-purple-600">150g: {metrics.white150}</span>
                                        <span className="text-gray-300">|</span>
                                        <span className="text-pink-600">200g: {metrics.white200}</span>
                                    </div>
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
                                        {metrics.blackTotal}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 font-medium flex gap-2">
                                        <span className="text-purple-600">150g: {metrics.black150}</span>
                                        <span className="text-gray-300">|</span>
                                        <span className="text-pink-600">200g: {metrics.black200}</span>
                                    </div>
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
                                        {formatCurrency(metrics.estimatedValue)}
                                    </div>
                                    <p className="text-xs text-green-600 mt-1 font-medium">Estimado (Costo venta)</p>
                                </div>
                            </div>

                            {/* SIZE BREAKDOWN SECTION */}
                            <h3 className="font-bold text-lg mb-4 mt-8 flex items-center gap-2">
                                <Ruler className="w-5 h-5 text-gray-500" />
                                Disponibilidad por Gramaje y Talla
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Panel 1: 150g (Standard) */}
                                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 border-b border-purple-100 dark:border-purple-800/30 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Weight className="w-5 h-5 text-purple-600" />
                                            <h4 className="font-bold text-gray-900 dark:text-white">Gramaje 150g (Estándar)</h4>
                                        </div>
                                        <span className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border border-purple-100 dark:border-purple-800 text-purple-600 font-bold">{metrics.white150 + metrics.black150} Unds</span>
                                    </div>
                                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* White 150g */}
                                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                                                <div className="w-3 h-3 rounded-full bg-white border border-gray-300"></div>
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Blancas</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {SIZES.map(size => {
                                                     const qty = getQuantity('male', 'white', size, '150g') + getQuantity('female', 'white', size, '150g');
                                                     return (
                                                         <div key={size} className="text-center">
                                                             <div className="text-[10px] text-gray-400 uppercase font-bold">{size}</div>
                                                             <div className={`text-sm font-bold ${qty > 0 ? 'text-gray-800 dark:text-white' : 'text-red-400'}`}>{qty}</div>
                                                         </div>
                                                     )
                                                })}
                                            </div>
                                        </div>
                                        {/* Black 150g */}
                                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                                                <div className="w-3 h-3 rounded-full bg-black border border-gray-600"></div>
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Negras</span>
                                            </div>
                                             <div className="grid grid-cols-3 gap-2">
                                                {SIZES.map(size => {
                                                     const qty = getQuantity('male', 'black', size, '150g') + getQuantity('female', 'black', size, '150g');
                                                     return (
                                                         <div key={size} className="text-center">
                                                             <div className="text-[10px] text-gray-400 uppercase font-bold">{size}</div>
                                                             <div className={`text-sm font-bold ${qty > 0 ? 'text-gray-800 dark:text-white' : 'text-red-400'}`}>{qty}</div>
                                                         </div>
                                                     )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Panel 2: 200g (Premium) */}
                                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                                    <div className="bg-pink-50 dark:bg-pink-900/20 p-4 border-b border-pink-100 dark:border-pink-800/30 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Weight className="w-5 h-5 text-pink-600" />
                                            <h4 className="font-bold text-gray-900 dark:text-white">Gramaje 200g (Premium)</h4>
                                        </div>
                                        <span className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border border-pink-100 dark:border-pink-800 text-pink-600 font-bold">{metrics.white200 + metrics.black200} Unds</span>
                                    </div>
                                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* White 200g */}
                                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                                                <div className="w-3 h-3 rounded-full bg-white border border-gray-300"></div>
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Blancas</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {SIZES.map(size => {
                                                     const qty = getQuantity('male', 'white', size, '200g') + getQuantity('female', 'white', size, '200g');
                                                     return (
                                                         <div key={size} className="text-center">
                                                             <div className="text-[10px] text-gray-400 uppercase font-bold">{size}</div>
                                                             <div className={`text-sm font-bold ${qty > 0 ? 'text-gray-800 dark:text-white' : 'text-red-400'}`}>{qty}</div>
                                                         </div>
                                                     )
                                                })}
                                            </div>
                                        </div>
                                        {/* Black 200g */}
                                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                                                <div className="w-3 h-3 rounded-full bg-black border border-gray-600"></div>
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Negras</span>
                                            </div>
                                             <div className="grid grid-cols-3 gap-2">
                                                {SIZES.map(size => {
                                                     const qty = getQuantity('male', 'black', size, '200g') + getQuantity('female', 'black', size, '200g');
                                                     return (
                                                         <div key={size} className="text-center">
                                                             <div className="text-[10px] text-gray-400 uppercase font-bold">{size}</div>
                                                             <div className={`text-sm font-bold ${qty > 0 ? 'text-gray-800 dark:text-white' : 'text-red-400'}`}>{qty}</div>
                                                         </div>
                                                     )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                
    </div>
  );
};