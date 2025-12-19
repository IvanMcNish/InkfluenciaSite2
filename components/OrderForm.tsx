import React, { useState, useEffect, useMemo } from 'react';
import { SIZES, PRICES, SHIPPING, formatCurrency } from '../constants';
import { TShirtConfig, Order, InventoryItem } from '../types';
import { submitOrder } from '../services/orderService';
import { getInventory } from '../services/inventoryService';
import { CheckCircle2, Loader2, AlertCircle, Weight, Truck, Phone, Tag, MapPin } from 'lucide-react';

interface OrderFormProps {
  config: TShirtConfig;
  onSuccess: (order: Order) => void;
  onBack: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({ config, onSuccess, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryLoaded, setInventoryLoaded] = useState(false);

  // Address sub-state for structured input
  const [addressParts, setAddressParts] = useState({
    type: 'Calle',
    n1: '',
    n2: '',
    n3: '',
    city: '',
    details: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '', // Will be auto-generated
    size: '', 
    grammage: '200g' as '150g' | '200g'
  });

  // 1. Fetch Inventory on Mount
  useEffect(() => {
    const loadInventory = async () => {
        const data = await getInventory();
        setInventory(data);
        setInventoryLoaded(true);
    };
    loadInventory();
  }, []);

  // 2. Calculate Available Sizes based on Config(Color) + Grammage + Inventory Quantity
  const availableSizes = useMemo(() => {
    if (!inventoryLoaded) return [];

    return SIZES.filter(size => {
        const item = inventory.find(i => 
            i.color === config.color && 
            i.size === size && 
            (i.grammage === formData.grammage || (!i.grammage && formData.grammage === '150g'))
        );
        return item ? item.quantity > 0 : false;
    });
  }, [inventory, inventoryLoaded, config.color, formData.grammage]);

  // 3. Auto-select logic: If current size is invalid/unavailable, switch to first available
  useEffect(() => {
    if (inventoryLoaded) {
        if (availableSizes.length > 0) {
            // If currently selected size is not in available list, pick the first one
            if (!availableSizes.includes(formData.size)) {
                setFormData(prev => ({ ...prev, size: availableSizes[0] }));
            }
        } else {
            // No sizes available at all
            setFormData(prev => ({ ...prev, size: '' }));
        }
    }
  }, [availableSizes, formData.size, inventoryLoaded]);

  // 4. Update Full Address String when parts change
  useEffect(() => {
    const { type, n1, n2, n3, city, details } = addressParts;
    // Format: Calle 123 # 45 - 67, Apto 101, Ciudad
    // Only build string if we have at least n1 and city to maintain cleanness
    const mainAddress = `${type} ${n1} # ${n2} - ${n3}`.trim();
    const fullAddress = `${mainAddress}${details ? `, ${details}` : ''}${city ? `, ${city}` : ''}`;
    
    setFormData(prev => ({ ...prev, address: fullAddress }));
  }, [addressParts]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setAddressParts({ ...addressParts, [e.target.name]: e.target.value });
  };

  const handleGrammageSelect = (g: '150g' | '200g') => {
    setFormData(prev => ({ ...prev, grammage: g }));
  };

  const basePrice = PRICES[formData.grammage];
  // Promotion: Free Shipping
  const shippingCost = SHIPPING;
  const shippingDiscount = SHIPPING; 
  const total = basePrice + shippingCost - shippingDiscount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.size) {
        setError("Por favor selecciona una talla disponible.");
        return;
    }

    if (!addressParts.n1 || !addressParts.n2 || !addressParts.city) {
        setError("Por favor completa los campos obligatorios de la dirección (Vía, Números y Ciudad).");
        return;
    }

    setLoading(true);
    setError(null);

    try {
      const newOrder = await submitOrder({
        customerName: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        size: formData.size,
        grammage: formData.grammage,
        config: config,
        total: total
      });
      onSuccess(newOrder);
    } catch (err) {
      setError('Hubo un error al procesar el pedido. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Use snapshot if available, otherwise fall back to first layer or placeholder
  const displayImage = config.snapshotUrl || (config.layers.length > 0 ? config.layers[0].textureUrl : null);

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
                    <span>Diseños:</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{config.layers.length} imagen(es)</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>Color Base:</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{config.color === 'white' ? 'Blanca' : 'Negra'}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>Talla:</span>
                    <span className="font-medium text-gray-900 dark:text-white font-mono">
                        {formData.size || <span className="text-red-500 italic">Sin Stock</span>}
                    </span>
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
                <div className="flex justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Envío</span>
                    <span className="line-through">{formatCurrency(shippingCost)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Promoción Envío</span>
                    <span>-{formatCurrency(shippingDiscount)}</span>
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
                
                {/* LOGIC CHANGE: Size selector dependent on Inventory */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Talla {availableSizes.length === 0 && inventoryLoaded && <span className="text-red-500 text-xs ml-2">(Agotado en este gramaje)</span>}
                        </label>
                        <select
                            name="size"
                            value={formData.size}
                            onChange={handleChange}
                            disabled={availableSizes.length === 0}
                            className={`w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 outline-none transition-all ${availableSizes.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {availableSizes.length > 0 ? (
                                availableSizes.map(s => <option key={s} value={s}>{s}</option>)
                            ) : (
                                <option value="">Sin Stock</option>
                            )}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Teléfono</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                required
                                name="phone"
                                type="tel" 
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                                placeholder="300 123 4567"
                            />
                        </div>
                    </div>
                </div>

                {/* STRUCTURED ADDRESS FIELDS */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                    <label className="block text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-200">
                        <MapPin className="w-4 h-4 text-pink-500" /> Dirección de Entrega
                    </label>
                    
                    <div className="grid grid-cols-12 gap-2 items-center">
                         {/* Type */}
                        <div className="col-span-5 sm:col-span-4">
                            <label className="text-[10px] uppercase text-gray-400 font-bold ml-1">Vía</label>
                            <select 
                                name="type" 
                                value={addressParts.type}
                                onChange={handleAddressChange}
                                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-1 focus:ring-pink-500 outline-none text-sm"
                            >
                                <option value="Calle">Calle</option>
                                <option value="Carrera">Carrera</option>
                                <option value="Diagonal">Diagonal</option>
                                <option value="Transversal">Transversal</option>
                                <option value="Avenida">Avenida</option>
                                <option value="Circular">Circular</option>
                            </select>
                        </div>
                        
                        {/* Num 1 */}
                        <div className="col-span-3 sm:col-span-3">
                             <label className="text-[10px] uppercase text-gray-400 font-bold ml-1">Num</label>
                             <input 
                                type="text"
                                name="n1"
                                value={addressParts.n1}
                                onChange={handleAddressChange}
                                placeholder="12A"
                                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-1 focus:ring-pink-500 outline-none text-sm"
                             />
                        </div>

                        <div className="col-span-1 text-center font-bold text-gray-400 mt-4">#</div>

                        {/* Num 2 */}
                        <div className="col-span-3 sm:col-span-4">
                             <label className="text-[10px] uppercase text-gray-400 font-bold ml-1">Num</label>
                             <input 
                                type="text"
                                name="n2"
                                value={addressParts.n2}
                                onChange={handleAddressChange}
                                placeholder="45"
                                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-1 focus:ring-pink-500 outline-none text-sm"
                             />
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-1 text-center font-bold text-gray-400 pt-4">-</div>
                         
                         {/* Num 3 (Plate) */}
                         <div className="col-span-4 sm:col-span-3">
                             <label className="text-[10px] uppercase text-gray-400 font-bold ml-1">Placa</label>
                             <input 
                                type="text"
                                name="n3"
                                value={addressParts.n3}
                                onChange={handleAddressChange}
                                placeholder="67"
                                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-1 focus:ring-pink-500 outline-none text-sm"
                             />
                        </div>

                        {/* City */}
                         <div className="col-span-7 sm:col-span-8">
                             <label className="text-[10px] uppercase text-gray-400 font-bold ml-1">Ciudad / Municipio</label>
                             <input 
                                type="text"
                                name="city"
                                value={addressParts.city}
                                onChange={handleAddressChange}
                                placeholder="Bucaramanga, Santander"
                                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-1 focus:ring-pink-500 outline-none text-sm"
                             />
                        </div>
                    </div>

                    {/* Additional Details */}
                    <div>
                         <label className="text-[10px] uppercase text-gray-400 font-bold ml-1">Complemento (Opcional)</label>
                         <input 
                            type="text"
                            name="details"
                            value={addressParts.details}
                            onChange={handleAddressChange}
                            placeholder="Torre 1 Apto 502, Barrio Centro, Conjunto..."
                            className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-1 focus:ring-pink-500 outline-none text-sm"
                         />
                    </div>
                    
                    {/* Live Preview of Address */}
                    <div className="text-xs text-gray-500 pt-1 px-1">
                        Resultado: <span className="font-medium text-gray-800 dark:text-gray-300">{formData.address || '...'}</span>
                    </div>
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
                    disabled={loading || availableSizes.length === 0}
                    className="w-2/3 py-4 px-4 bg-gradient-to-r from-pink-600 to-orange-500 text-white rounded-xl font-bold hover:shadow-lg hover:from-pink-500 hover:to-orange-400 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : availableSizes.length === 0 ? 'Sin Stock' : `Pagar ${formatCurrency(total)}`}
                </button>
            </div>
          </form>
      </div>
    </div>
  );
};