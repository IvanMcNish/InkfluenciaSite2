import { supabase } from '../lib/supabaseClient';
import { InventoryItem } from '../types';

export const getInventory = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase
    .from('inventory')
    .select('*');

  if (error) {
    // Si el error es que la tabla no existe (PGRST205), retornamos array vacío silenciosamente
    // para que la UI no falle mientras el usuario crea la tabla.
    if (error.code === 'PGRST205') {
      console.warn('Tabla de inventario no encontrada. Usa el script SQL en Configuración.');
      return [];
    }
    console.error('Error fetching inventory:', error);
    return [];
  }

  return data as InventoryItem[];
};