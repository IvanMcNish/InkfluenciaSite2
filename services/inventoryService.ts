
import { supabase } from '../lib/supabaseClient';
import { InventoryItem, Gender } from '../types';

export const getInventory = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase
    .from('inventory')
    .select('*');

  if (error) {
    if (error.code === 'PGRST205') {
      console.warn('Tabla de inventario no encontrada. Usa el script SQL en Configuración.');
      return [];
    }
    console.error('Error fetching inventory:', error);
    return [];
  }

  return data as InventoryItem[];
};

export const adjustInventoryQuantity = async (gender: Gender, color: 'white' | 'black', size: string, grammage: string = '150g', amount: number): Promise<boolean> => {
  try {
    // 1. Obtener el ítem actual
    const { data: item, error: fetchError } = await supabase
      .from('inventory')
      .select('*')
      .eq('gender', gender)
      .eq('color', color)
      .eq('size', size)
      .eq('grammage', grammage)
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

export const upsertInventoryBatch = async (items: {gender: Gender, color: string, size: string, grammage: string, quantity: number}[]): Promise<{ success: boolean, error?: any }> => {
    try {
        // Upsert using the composite unique key constraint (gender, grammage, color, size)
        const { error } = await supabase
            .from('inventory')
            .upsert(items, { onConflict: 'gender, grammage, color, size' });

        if (error) {
            console.error("Error upserting inventory:", error);
            return { success: false, error };
        }

        return { success: true };
    } catch (e) {
        console.error("Exception upserting inventory:", e);
        return { success: false, error: e };
    }
};
