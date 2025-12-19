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

export const adjustInventoryQuantity = async (color: 'white' | 'black', size: string, amount: number): Promise<boolean> => {
  try {
    // 1. Obtener el ítem actual para saber su ID y cantidad actual
    const { data: item, error: fetchError } = await supabase
      .from('inventory')
      .select('*')
      .eq('color', color)
      .eq('size', size)
      .single();

    if (fetchError || !item) {
       console.error("No se encontró el ítem de inventario para ajustar", fetchError);
       return false;
    }

    // 2. Calcular nueva cantidad
    const newQuantity = item.quantity + amount;

    // 3. Actualizar
    const { error: updateError } = await supabase
      .from('inventory')
      .update({ quantity: newQuantity })
      .eq('id', item.id);

    if (updateError) {
        console.error("Error actualizando cantidad de inventario", updateError);
        return false;
    }

    return true;
  } catch (e) {
    console.error("Excepción al ajustar inventario", e);
    return false;
  }
};