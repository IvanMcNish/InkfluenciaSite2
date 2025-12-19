import React, { useState } from 'react';
import { Order } from '../types';
import { CheckCircle, Printer, Download, MapPin, Mail, Phone, Calendar, ArrowRight, Info, X, FileText } from 'lucide-react';
import { formatCurrency } from '../constants';
import { APP_LOGO_URL } from '../lib/supabaseClient';

interface OrderSuccessProps {
  order: Order | null;
  onReset: () => void;
}

export const OrderSuccess: React.FC<OrderSuccessProps> = ({ order, onReset }) => {
  const [showModal, setShowModal] = useState(false);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  // The Receipt Component (Reusable for Inline and Modal)
  const ReceiptCard = ({ isModal = false }: { isModal?: boolean }) => (
    <div 
        id={isModal ? "printable-area" : undefined}
        className={`bg-white text-gray-900 w-full rounded-2xl overflow-hidden flex flex-col ${isModal ? 'shadow-none' : 'shadow-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100'}`}
    >
        {/* Receipt Header */}
        <div className={`p-8 border-b-2 border-gray-900 dark:border-gray-700 flex justify-between items-center ${!isModal && 'bg-gray-50 dark:bg-gray-800/50'}`}>
            <div className="flex items-center gap-4">
                <img 
                    src={`${APP_LOGO_URL}?t=${new Date().getHours()}`} 
                    alt="Logo" 
                    className="w-16 h-16 object-contain"
                />
                <div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase mb-1">INKFLUENCIA</h2>
                    <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">Comprobante de Pago</p>
                </div>
            </div>
            <div className="text-right">
                <div className="text-xs text-gray-500 uppercase font-bold mb-1">ID PEDIDO</div>
                <div className="font-mono font-bold text-xl tracking-widest">{order.id}</div>
            </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {/* Customer Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">Cliente</h4>
                    <div className="font-bold text-lg">{order.customerName}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{order.email}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{order.phone}</div>
                </div>
                <div>
                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">Detalles de Entrega</h4>
                    <div className="text-sm font-medium mb-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(order.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
                        <span className="max-w-[200px]">{order.address}</span>
                    </div>
                </div>
            </div>

            {/* Item Details */}
            <div className="border rounded-lg border-gray-100 dark:border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr className="text-left">
                            <th className="py-3 px-4 font-bold uppercase text-gray-400 text-xs">Descripción</th>
                            <th className="py-3 px-4 font-bold uppercase text-gray-400 text-xs text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        <tr>
                            <td className="py-4 px-4">
                                <div className="font-bold text-base">Camiseta Personalizada Inkfluencia</div>
                                <div className="text-gray-500 text-xs mt-1">
                                    Talla: {order.size} | {order.grammage} | {order.config.color === 'white' ? 'Blanca' : 'Negra'}
                                </div>
                            </td>
                            <td className="py-4 px-4 text-right font-medium">
                                {formatCurrency(order.total)} 
                            </td>
                        </tr>
                        {/* Static Discount Row for Visuals based on context */}
                        <tr>
                            <td className="py-2 px-4 text-gray-500 italic">Envío Estándar</td>
                            <td className="py-2 px-4 text-right text-gray-500 line-through">
                                {(10000).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                            </td>
                        </tr>
                        <tr>
                            <td className="py-2 px-4 text-green-600 font-medium">Descuento Promocional</td>
                            <td className="py-2 px-4 text-right text-green-600">
                                -{(10000).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Total Footer */}
            <div className="flex justify-end pt-4 border-t-2 border-gray-900 dark:border-gray-700">
                <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase mb-1">Total Pagado</div>
                    <div className="text-3xl font-black">{formatCurrency(order.total)}</div>
                </div>
            </div>

            {/* Footer Text */}
            <div className="text-center text-xs text-gray-400 mt-8 pt-8 border-t border-dashed border-gray-200 dark:border-gray-800">
                <p>Gracias por tu compra. | www.inkfluencia.com</p>
            </div>
        </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      
      {/* CSS for printing: Hides everything except the modal content if open, or hides non-printable if closed */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-area, #printable-area * {
              visibility: visible;
            }
            #printable-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
              box-shadow: none !important;
              border: none !important;
              background: white !important;
              color: black !important;
            }
            /* Force light mode colors for print inside the area */
            #printable-area .dark\:text-gray-100 { color: black !important; }
            #printable-area .dark\:bg-gray-900 { background: white !important; }
            #printable-area .dark\:border-gray-700 { border-color: black !important; }
            
            .no-print {
                display: none !important;
            }
          }
        `}
      </style>

      {/* Main Success Screen */}
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow text-green-600 dark:text-green-300">
          <CheckCircle className="w-10 h-10" />
        </div>
        
        <h2 className="text-4xl font-black mb-4 text-gray-900 dark:text-white tracking-tight">¡Pedido Exitoso!</h2>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg mx-auto leading-relaxed mb-8">
          Tu diseño ha sido procesado correctamente. Hemos enviado los detalles a <span className="font-bold text-gray-900 dark:text-white">{order.email}</span>.
        </p>
      </div>

      {/* INLINE RECEIPT (Visual Summary on Page) */}
      <div className="mb-8">
         <ReceiptCard isModal={false} />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <button 
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-pink-300 transition-all shadow-sm"
            >
                <Printer className="w-5 h-5" />
                Imprimir Comprobante
            </button>
            <button 
                onClick={onReset}
                className="flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-pink-600 to-orange-500 text-white rounded-xl font-bold shadow-xl shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-105 transition-all"
            >
                Crear Nuevo Diseño
                <ArrowRight className="w-5 h-5" />
            </button>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh]">
                
                {/* Modal Header (No Print) */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 no-print">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-pink-500" />
                        Vista de Impresión
                    </h3>
                    <button 
                        onClick={() => setShowModal(false)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Inside Modal */}
                <div className="p-6 overflow-y-auto bg-gray-100 dark:bg-black/50">
                    <ReceiptCard isModal={true} />
                </div>

                {/* Modal Actions (No Print) */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 no-print">
                    <button 
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cerrar
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-bold shadow-lg shadow-pink-500/30 flex items-center gap-2 transition-transform active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        Imprimir / Guardar PDF
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};