import React from 'react';
import { Order } from '../types';
import { CheckCircle, Printer, Download, MapPin, Mail, Phone, Calendar, ArrowRight, Info } from 'lucide-react';
import { formatCurrency } from '../constants';
import { APP_LOGO_URL } from '../lib/supabaseClient';

interface OrderSuccessProps {
  order: Order | null;
  onReset: () => void;
}

export const OrderSuccess: React.FC<OrderSuccessProps> = ({ order, onReset }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto p-6 animate-fade-in print:max-w-full print:p-0">
      {/* Success Message - Hidden on Print */}
      <div className="text-center mb-10 print:hidden">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-300">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-4xl font-black mb-4 text-gray-900 dark:text-white">¡Pedido Confirmado!</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto mb-6">
          Gracias por tu compra. Hemos enviado un correo de confirmación a <span className="font-bold text-gray-900 dark:text-gray-200">{order.email}</span>.
        </p>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-xl max-w-xl mx-auto flex gap-3 text-left mb-8">
            <Info className="w-6 h-6 text-blue-500 shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                El equipo de Inkfluencia se pondrá en contacto contigo al número <strong>{order.phone}</strong> para confirmar el pedido, verificar los archivos de diseño y ultimar detalles de entrega.
            </p>
        </div>
        
        <div className="flex justify-center gap-4">
            <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
                <Printer className="w-5 h-5" />
                Imprimir Recibo
            </button>
            <button 
                onClick={onReset}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-pink-600 to-orange-500 text-white rounded-full font-bold shadow-lg hover:shadow-pink-500/30 transition-all"
            >
                Crear Nuevo
                <ArrowRight className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Receipt Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden print:shadow-none print:border print:border-gray-300 print:text-black print:dark:bg-white print:dark:text-black print:w-full">
        {/* Receipt Header */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start print:bg-gray-100">
            <div className="flex items-center gap-3">
                <img 
                    src={`${APP_LOGO_URL}?t=${new Date().getHours()}`} 
                    alt="Logo" 
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none'; 
                    }}
                />
                <div>
                    <h3 className="text-xl font-bold tracking-tight text-pink-600">INKFLUENCIA</h3>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Comprobante de Pedido</p>
                </div>
            </div>
            <div className="text-right">
                <div className="font-mono font-bold text-lg">#{order.id}</div>
                <div className="text-sm text-gray-500 flex items-center justify-end gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(order.date).toLocaleDateString()}
                </div>
            </div>
        </div>

        {/* Receipt Body */}
        <div className="p-8 space-y-8">
            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2">
                <div>
                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">Cliente</h4>
                    <p className="font-bold text-lg mb-1">{order.customerName}</p>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300 print:text-gray-700">
                        <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3" /> {order.email}
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3" /> {order.phone}
                        </div>
                    </div>
                </div>
                <div>
                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">Dirección de Envío</h4>
                    <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-300 print:text-gray-700">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                        <p className="max-w-xs">{order.address}</p>
                    </div>
                </div>
            </div>

            <div className="border-t border-dashed border-gray-200 dark:border-gray-700 my-4"></div>

            {/* Product Details */}
            <div>
                <h4 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-wider">Detalles del Producto</h4>
                <div className="flex gap-6 items-start">
                    {order.config.snapshotUrl && (
                        <div className="w-24 h-24 bg-gray-50 rounded-lg border border-gray-100 p-2 shrink-0">
                            <img src={order.config.snapshotUrl} className="w-full h-full object-contain" alt="Producto" />
                        </div>
                    )}
                    <div className="flex-1">
                        <h5 className="font-bold text-lg">Camiseta Personalizada</h5>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-2 text-sm">
                             <div className="flex justify-between">
                                <span className="text-gray-500">Talla:</span>
                                <span className="font-medium">{order.size}</span>
                             </div>
                             <div className="flex justify-between">
                                <span className="text-gray-500">Color:</span>
                                <span className="font-medium capitalize">{order.config.color === 'white' ? 'Blanca' : 'Negra'}</span>
                             </div>
                             <div className="flex justify-between">
                                <span className="text-gray-500">Gramaje:</span>
                                <span className="font-medium">{order.grammage}</span>
                             </div>
                             <div className="flex justify-between">
                                <span className="text-gray-500">Diseños:</span>
                                <span className="font-medium">{order.config.layers.length}</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* Totals */}
            <div className="flex flex-col items-end gap-2">
                <div className="w-full md:w-1/2 print:w-1/2 space-y-2">
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>Envío</span>
                        <span className="line-through">{(10000).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                        <span>Promoción Envío Gratis</span>
                        <span>-{(10000).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-black text-gray-900 dark:text-white pt-4 border-t border-gray-100 dark:border-gray-700">
                        <span>Total Pagado</span>
                        <span>{formatCurrency(order.total)}</span>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 text-center text-xs text-gray-400 border-t border-gray-100 dark:border-gray-800 print:bg-gray-100 print:text-gray-500">
            Gracias por comprar en Inkfluencia. Para soporte contacte a soporte@inkfluencia.com
        </div>
      </div>
    </div>
  );
};