import { supabase } from '../lib/supabaseClient';
import { Customer } from '../types';

// --- Tipo interno que representa la fila cruda de Supabase ---
interface DbCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  last_order_at: string;
  created_at: string;
}

const mapDbCustomer = (item: DbCustomer): Customer => ({
  id: item.id,
  name: item.name,
  email: item.email,
  phone: item.phone,
  address: item.address,
  lastOrderAt: item.last_order_at,
  createdAt: item.created_at,
});

// Lanza un Error si la consulta falla (el llamador decide cómo manejarlo)
export const getCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('last_order_at', { ascending: false });

  if (error) throw new Error(`Error fetching customers: ${error.message}`);

  return (data as DbCustomer[]).map(mapDbCustomer);
};

// Recibe un objeto tipado en lugar de 4 strings posicionales.
// Lanza un Error si el upsert falla.
export const saveOrUpdateCustomer = async (
  customer: Pick<Customer, 'name' | 'email' | 'phone' | 'address'>
): Promise<void> => {
  const { error } = await supabase
    .from('customers')
    .upsert(
      {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        last_order_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    );

  if (error) throw new Error(`Error saving customer: ${error.message}`);
};