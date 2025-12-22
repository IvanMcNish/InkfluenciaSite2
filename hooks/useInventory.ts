
import { useState, useEffect, useMemo, useCallback } from 'react';
import { getInventory } from '../services/inventoryService';
import { InventoryItem, Gender } from '../types';
import { PRICES } from '../constants';

export const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshInventory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInventory();
      setInventory(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar inventario');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshInventory();
  }, [refreshInventory]);

  // Centralized Calculations
  const metrics = useMemo(() => {
    const totalStock = inventory.reduce((acc, item) => acc + item.quantity, 0);
    const lowStockItems = inventory.filter(i => i.quantity < 10).length;

    // Aggregates (Summing both genders for top-level stats if needed, or keeping them separate)
    // White Breakdown
    const whiteTotal = inventory.filter(i => i.color === 'white').reduce((acc, i) => acc + i.quantity, 0);
    const white150 = inventory
      .filter(i => i.color === 'white' && i.grammage === '150g')
      .reduce((acc, i) => acc + i.quantity, 0);
    const white200 = inventory
      .filter(i => i.color === 'white' && i.grammage === '200g')
      .reduce((acc, i) => acc + i.quantity, 0);

    // Black Breakdown
    const blackTotal = inventory.filter(i => i.color === 'black').reduce((acc, i) => acc + i.quantity, 0);
    const black150 = inventory
      .filter(i => i.color === 'black' && i.grammage === '150g')
      .reduce((acc, i) => acc + i.quantity, 0);
    const black200 = inventory
      .filter(i => i.color === 'black' && i.grammage === '200g')
      .reduce((acc, i) => acc + i.quantity, 0);

    // Financial Value
    const estimatedValue = inventory.reduce((acc, item) => {
      const price = PRICES[item.grammage || '150g'];
      return acc + (item.quantity * price);
    }, 0);

    return {
      totalStock,
      lowStockItems,
      whiteTotal,
      white150,
      white200,
      blackTotal,
      black150,
      black200,
      estimatedValue
    };
  }, [inventory]);

  // Helper to get specific quantity
  const getQuantity = (gender: Gender, color: string, size: string, grammage: string) => {
      return inventory.find(i => 
        i.gender === gender &&
        i.color === color && 
        i.size === size && 
        i.grammage === grammage
    )?.quantity || 0;
  };

  return {
    inventory,
    metrics,
    loading,
    error,
    refreshInventory,
    getQuantity
  };
};
