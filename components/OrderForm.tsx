import React, { useState } from 'react';
import { SIZES, PRICES, SHIPPING, formatCurrency } from '../constants';
import { TShirtConfig } from '../types';
import { submitOrder } from '../services/orderService';
import { CheckCircle2, Loader2, AlertCircle, Weight, Truck } from 'lucide-react';

interface OrderFormProps {
  config: TShirtConfig;
  onSuccess: () => void;
  onBack: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({ config, onSuccess, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    size: 'M',
    grammage: '200g' as '150g' | '200g'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGrammageSelect = (g: '150g' | '200g') => {
    setFormData(prev => ({ ...prev, grammage: g }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await submitOrder({
        customerName: formData.name,
        email: formData.email,
        address: formData.address,
        size: formData.size,
        grammage: formData.grammage,
        config: config,
        total: total
      });
      onSuccess();
    } catch (err) {
      setError('Hubo un error al procesar el pedido. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const basePrice = PRICES[formData.grammage];
  const total = basePrice + SHIPPING;

  // Use snapshot if available, otherwise fall back to texture or color placeholder
  const displayImage = config.snapshotUrl || config.textureUrl;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl mt-4 border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-8">
      
      {/* Left Column: Summary */}
      <div className="md:w-1/3 space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CheckCircle2 className="text-pink-500" />
          Resumen
        </h2>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
            {displayImage ? (
            <img 
                src={displayImage} 
                alt="Preview" 
                className="w-full aspect-square object-contain rounded-lg bg-white shadow-sm border border-gray-200 mb-4"
            />
            ) : (
            <div className={`w-full aspect-square rounded-lg border border-gray-200 mb-4 ${config.color === 'white' ? 'bg-white' : 'bg-black'}`} />
            )}
            
            <div className="space-y-2">
                <h3 className="font-bold text-lg">Camiseta Inkfluencia</h3>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>Color Base:</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{config.color === 'white' ? 'Blanca' : 'Negra'}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>Talla:</span>
                    <span className="font-medium text-gray-900 dark:text-white font-mono">{formData.size}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>Gramaje:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.grammage}</span>
                </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(basePrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Envío</span>
                    <span>{formatCurrency(SHIPPING)}</span>
                </div>
                <div className="flex justify-between text-xl font-black text-pink-600 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700 mt-2">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="md:w-2/3">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-4">
                <h3 className="text-lg font-bold border-b border-gray-100 dark:border-gray-800 pb-2">1. Detalles de la Prenda</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Talla</label>
                        <select
                            name="size"
                            value={formData.size}
                            onChange={handleChange}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                        >
                            {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                        <Weight className="w-4 h-4" /> Gramaje de la Tela
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div 
                            onClick={() => handleGrammageSelect('150g')}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all relative ${
                                formData.grammage === '150g' 
                                ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-900/20' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                            }`}
                        >
                            <div className="font-bold flex justify-between">
                                <span>Estándar (150g)</span>
                                <span className="text-pink-600">{formatCurrency(PRICES['150g'])}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Fresca y ligera. Ideal para climas cálidos.</p>
                        </div>

                        <div 
                            onClick={() => handleGrammageSelect('200g')}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all relative ${
                                formData.grammage === '200g' 
                                ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-900/20' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                            }`}
                        >
                            {formData.grammage === '200g' && (
                                <span className="absolute -top-3 right-4 bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Recomendado</span>
                            )}
                            <div className="font-bold flex justify-between">
                                <span>Premium (200g)</span>
                                <span className="text-pink-600">{formatCurrency(PRICES['200g'])}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Mayor espesor y durabilidad. Acabado superior.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-bold border-b border-gray-100 dark:border-gray-800 pb-2 mt-8">2. Datos de Envío</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                        <input 
                        required
                        name="name"
                        type="text" 
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                        placeholder="Juan Pérez"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input 
                        required
                        name="email"
                        type="email" 
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                        placeholder="juan@ejemplo.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Dirección Completa</label>
                    <textarea 
                        required
                        name="address"
                        rows={3}
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                        placeholder="Calle 123 # 45-67, Ciudad, Departamento"
                    />
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            )}

            <div className="flex gap-4 pt-4">
                <button 
                    type="button" 
                    onClick={onBack}
                    className="w-1/3 py-4 px-4 border border-gray-300 dark:border-gray-600 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    Volver
                </button>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-2/3 py-4 px-4 bg-gradient-to-r from-pink-600 to-orange-500 text-white rounded-xl font-bold hover:shadow-lg hover:from-pink-500 hover:to-orange-400 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pagar ${formatCurrency(total)}`}
                </button>
            </div>
          </form>
      </div>
    </div>
  );
};