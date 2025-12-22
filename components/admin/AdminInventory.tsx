import React, { useState } from 'react';
import { Layers, DollarSign, PlusCircle, Save, Loader2, Database, Shirt, TrendingUp, Ruler, Weight } from 'lucide-react';
import { upsertInventoryBatch } from '../../services/inventoryService';
import { useInventory } from '../../hooks/useInventory';
import { formatCurrency, SIZES } from '../../constants';

export const AdminInventory: React.FC = () => {
  // Use the shared hook for data and calculations
  const { inventory, metrics, loading, refreshInventory, getQuantity } = useInventory();

  // Local state for the "Add Stock" form UI
  const [mgmtGrammage, setMgmtGrammage] = useState<'150g' | '200g'>('150g');
  const [mgmtColor, setMgmtColor] = useState<'white' | 'black'>('white');
  const [stockInputs, setStockInputs] = useState<Record<string, number>>({});
  const [isSavingStock, setIsSavingStock] = useState(false);

  const handleStockInputChange = (size: string, value: string) => {
      const numValue = parseInt(value) || 0;
      setStockInputs(prev => ({ ...prev, [size]: Math.max(0, numValue) }));
  };

  const saveStockUpdates = async () => {
      setIsSavingStock(true);
      const updates = SIZES.map(size => {
          // Calculate new total based on current inventory from hook + input
          const currentQty = getQuantity(mgmtColor, size, mgmtGrammage);
          const qtyToAdd = stockInputs[size] || 0;
          const newTotal = currentQty + qtyToAdd;

          return {
              color: mgmtColor,
              size: size,
              grammage: mgmtGrammage,
              quantity: newTotal
          };
      });

      const result = await upsertInventoryBatch(updates);
      
      if (result.success) {
          await refreshInventory(); // Reload data via hook
          setStockInputs({}); 
          alert("¡Stock agregado correctamente!");
      } else {
          alert("Error al actualizar inventario.");
      }
      setIsSavingStock(false);
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto"/></div>;

  return (
    <div className="animate-fade-in space-y-6 pb-20">
        {/* 1. Quick Stats (Using metrics from hook) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <div className="text-3xl font-black text-gray-900 dark:text-white">{metrics.totalStock}</div>
            </div>

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
                <div className="text-xl font-black text-gray-900 dark:text-white">{formatCurrency(metrics.estimatedValue)}</div>
            </div>

            {/* Breakdown Cards */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Blancas</h3>
                <div className="text-2xl font-black text-gray-900 dark:text-white mb-1">{metrics.whiteTotal}</div>
                <div className="text-xs text-gray-500 font-medium flex gap-2">
                    <span className="text-purple-600">150g: {metrics.white150}</span> | <span className="text-pink-600">200g: {metrics.white200}</span>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Negras</h3>
                <div className="text-2xl font-black text-gray-900 dark:text-white mb-1">{metrics.blackTotal}</div>
                <div className="text-xs text-gray-500 font-medium flex gap-2">
                    <span className="text-purple-600">150g: {metrics.black150}</span> | <span className="text-pink-600">200g: {metrics.black200}</span>
                </div>
            </div>
        </div>

        {/* 2. ADD STOCK FORM */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-pink-50 to-transparent dark:from-pink-900/10">
                <h3 className="font-bold text-lg flex items-center gap-2 text-pink-600 dark:text-pink-400">
                    <PlusCircle className="w-5 h-5" />
                    Agregar al Inventario (Sumar)
                </h3>
                <p className="text-sm text-gray-500 mt-1">Ingresa la cantidad que deseas <strong>SUMAR</strong> a la base de datos actual.</p>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-2">1. Seleccionar Gramaje</label>
                        <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
                            <button onClick={() => setMgmtGrammage('150g')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mgmtGrammage === '150g' ? 'bg-white dark:bg-gray-700 shadow-sm text-pink-600' : 'text-gray-500'}`}>150g (Estándar)</button>
                            <button onClick={() => setMgmtGrammage('200g')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mgmtGrammage === '200g' ? 'bg-white dark:bg-gray-700 shadow-sm text-pink-600' : 'text-gray-500'}`}>200g (Premium)</button>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-2">2. Seleccionar Color</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setMgmtColor('white')} className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${mgmtColor === 'white' ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/10 text-pink-700 dark:text-pink-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                                <div className="w-4 h-4 rounded-full bg-white border border-gray-300"></div>
                                <span className="font-bold text-sm">Blanco</span>
                            </button>
                            <button onClick={() => setMgmtColor('black')} className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${mgmtColor === 'black' ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/10 text-pink-700 dark:text-pink-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                                <div className="w-4 h-4 rounded-full bg-black border border-gray-600"></div>
                                <span className="font-bold text-sm">Negro</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <label className="block text-xs font-bold uppercase text-gray-400">3. Ingresar Cantidad a Sumar</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {SIZES.map(size => (
                            <div key={size} className="relative">
                                <div className="absolute top-0 left-0 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-br-lg text-xs font-bold text-gray-500 border-r border-b border-gray-200 dark:border-gray-700">
                                    {size}
                                </div>
                                <input 
                                    type="number"
                                    min="0"
                                    value={stockInputs[size] !== undefined ? stockInputs[size] : ''}
                                    onChange={(e) => handleStockInputChange(size, e.target.value)}
                                    placeholder="0"
                                    className="w-full pt-8 pb-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 outline-none text-2xl font-black text-center text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700"
                                />
                                <div className="text-[10px] text-center text-gray-400 mt-1">Agregar</div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="pt-4 flex justify-end">
                        <button 
                            onClick={saveStockUpdates}
                            disabled={isSavingStock}
                            className="bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-500 hover:to-orange-400 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSavingStock ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {isSavingStock ? 'Guardando...' : 'Guardar y Sumar al Stock'}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* 3. CURRENT STOCK DISPLAY */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden opacity-90">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                    <Database className="w-5 h-5 text-gray-400" />
                    Inventario Actual en Base de Datos
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    Estado actual para <strong>{mgmtGrammage === '150g' ? '150g (Estándar)' : '200g (Premium)'}</strong> en color <strong className="capitalize">{mgmtColor === 'white' ? 'Blanco' : 'Negro'}</strong>.
                </p>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    {SIZES.map(size => {
                        const qty = getQuantity(mgmtColor, size, mgmtGrammage);

                        return (
                            <div key={`current-${size}`} className="relative group">
                                <div className="absolute top-0 left-0 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-br-lg text-xs font-bold text-gray-600 dark:text-gray-300 z-10">
                                    {size}
                                </div>
                                <div className={`w-full pt-8 pb-3 px-4 rounded-xl border-2 bg-gray-50 dark:bg-gray-800/50 text-2xl font-black text-center ${qty > 0 ? 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300' : 'border-red-200 dark:border-red-900/30 text-red-400'}`}>
                                    {qty}
                                </div>
                                <div className="text-[10px] text-center text-gray-400 mt-1">Disponibles</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    </div>
  );
};