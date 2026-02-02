
import React, { useState } from 'react';
import { Layers, DollarSign, PlusCircle, Save, Loader2, Database, Shirt, TrendingUp, User } from 'lucide-react';
import { upsertInventoryBatch } from '../../services/inventoryService';
import { addToHistoricalInvestment } from '../../services/settingsService';
import { useInventory } from '../../hooks/useInventory';
import { formatCurrency, SIZES, getItemCost } from '../../constants';
import { Gender } from '../../types';

export const AdminInventory: React.FC = () => {
  const { metrics, loading, refreshInventory, getQuantity } = useInventory();

  // Unified Global State
  const [selectedGender, setSelectedGender] = useState<Gender>('male');
  
  // Management State (Color & Grammage still specific to the operation focus, but determine the view)
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
      
      let totalCostAdded = 0;
      
      const updates = SIZES.map(size => {
          const currentQty = getQuantity(selectedGender, mgmtColor, size, mgmtGrammage);
          const qtyToAdd = stockInputs[size] || 0;
          
          // Calculate cost for this specific addition
          if (qtyToAdd > 0) {
              const unitCost = getItemCost(selectedGender, size, mgmtGrammage);
              totalCostAdded += (unitCost * qtyToAdd);
          }

          const newTotal = currentQty + qtyToAdd;

          return {
              gender: selectedGender,
              color: mgmtColor,
              size: size,
              grammage: mgmtGrammage,
              quantity: newTotal
          };
      });

      // 1. Update Inventory Quantities
      const result = await upsertInventoryBatch(updates);
      
      // 2. Update Historical Financial Accumulator
      let financialUpdateSuccess = true;
      if (totalCostAdded > 0) {
          financialUpdateSuccess = await addToHistoricalInvestment(totalCostAdded);
      }
      
      if (result.success && financialUpdateSuccess) {
          await refreshInventory();
          setStockInputs({}); 
          alert(`¡Stock actualizado! Se agregó ${formatCurrency(totalCostAdded)} a la Inversión Histórica.`);
      } else {
          alert("Hubo un error al actualizar el inventario o las finanzas.");
      }
      setIsSavingStock(false);
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto"/></div>;

  return (
    <div className="animate-fade-in space-y-6 pb-20">
        {/* 1. Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg text-indigo-600">
                        <Layers className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Stock Total</h3>
                </div>
                <div className="text-3xl font-black text-gray-900 dark:text-white">{metrics.totalStock}</div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 relative overflow-hidden">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg text-green-600">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Valor Inventario</h3>
                </div>
                <div className="text-xl font-black text-gray-900 dark:text-white">{formatCurrency(metrics.estimatedValue)}</div>
                <p className="text-[10px] text-gray-400 mt-1">Valor actual en bodega</p>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Blancas</h3>
                <div className="text-2xl font-black text-gray-900 dark:text-white mb-1">{metrics.whiteTotal}</div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Negras</h3>
                <div className="text-2xl font-black text-gray-900 dark:text-white mb-1">{metrics.blackTotal}</div>
            </div>
        </div>

        {/* GLOBAL GENDER SELECTOR */}
        <div className="flex justify-center">
            <div className="bg-white dark:bg-gray-900 p-1.5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex gap-2">
                <button 
                    onClick={() => setSelectedGender('male')}
                    className={`px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                        selectedGender === 'male' 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                        : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                    <User className="w-4 h-4" />
                    Inventario Hombre
                </button>
                <button 
                    onClick={() => setSelectedGender('female')}
                    className={`px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                        selectedGender === 'female' 
                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg' 
                        : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                    <User className="w-4 h-4" />
                    Inventario Mujer
                </button>
            </div>
        </div>

        {/* 2. ADD STOCK FORM */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className={`p-6 border-b border-gray-100 dark:border-gray-800 transition-colors ${selectedGender === 'male' ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-pink-50/50 dark:bg-pink-900/10'}`}>
                <h3 className="font-bold text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                    <PlusCircle className={`w-5 h-5 ${selectedGender === 'male' ? 'text-blue-500' : 'text-pink-500'}`} />
                    Gestión de Stock: <span className="uppercase">{selectedGender === 'male' ? 'Hombre' : 'Mujer'}</span>
                </h3>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-6">
                    {/* Gender selector removed from here, now global */}

                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-2">1. Seleccionar Gramaje</label>
                        <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
                            <button onClick={() => setMgmtGrammage('150g')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mgmtGrammage === '150g' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>150g</button>
                            <button onClick={() => setMgmtGrammage('200g')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mgmtGrammage === '200g' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>200g</button>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-2">2. Seleccionar Color</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setMgmtColor('white')} className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${mgmtColor === 'white' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-700'}`}>
                                <div className="w-3 h-3 rounded-full bg-white border border-gray-300"></div>
                                <span className="font-bold text-sm">Blanco</span>
                            </button>
                            <button onClick={() => setMgmtColor('black')} className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${mgmtColor === 'black' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-700'}`}>
                                <div className="w-3 h-3 rounded-full bg-black border border-gray-600"></div>
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
                                    className="w-full pt-8 pb-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none text-2xl font-black text-center"
                                />
                            </div>
                        ))}
                    </div>
                    
                    <div className="pt-4 flex justify-end">
                        <button 
                            onClick={saveStockUpdates}
                            disabled={isSavingStock}
                            className={`text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all flex items-center gap-2 ${
                                selectedGender === 'male' 
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/30' 
                                : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 hover:shadow-pink-500/30'
                            }`}
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
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h3 className="font-bold text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                        <Database className="w-5 h-5 text-gray-400" />
                        Vista Previa del Stock
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Mostrando para: <strong className="capitalize text-indigo-600 dark:text-indigo-400">{selectedGender === 'male' ? 'Hombre' : 'Mujer'}</strong> - <strong className="capitalize">{mgmtColor === 'white' ? 'Blanco' : 'Negro'}</strong> - <strong>{mgmtGrammage}</strong>
                    </p>
                </div>
                
                {/* Visual indicator (Read-only as it's controlled globally now) */}
                <div className="flex bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                     <span className="text-xs font-bold uppercase text-gray-400 mr-2 flex items-center">Filtro Activo:</span>
                     <span className={`px-3 py-1 rounded text-xs font-bold capitalize ${selectedGender === 'male' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'}`}>
                        {selectedGender === 'male' ? 'Hombre' : 'Mujer'}
                     </span>
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    {SIZES.map(size => {
                        // Uses unified selectedGender
                        const qty = getQuantity(selectedGender, mgmtColor, size, mgmtGrammage);

                        return (
                            <div key={`current-${size}`} className="relative group">
                                <div className="absolute top-0 left-0 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-br-lg text-xs font-bold text-gray-600 dark:text-gray-300 z-10">
                                    {size}
                                </div>
                                <div className={`w-full pt-8 pb-3 px-4 rounded-xl border-2 bg-gray-50 dark:bg-gray-800/50 text-2xl font-black text-center ${qty > 0 ? 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300' : 'border-red-200 dark:border-red-900/30 text-red-400'}`}>
                                    {qty}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    </div>
  );
};
