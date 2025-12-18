import { supabase } from '../lib/supabaseClient';
import { Customer } from '../types';

export const getCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('last_order_at', { ascending: false });

  if (error) {
    console.error('Error fetching customers:', error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    name: item.name,
    email: item.email,
    phone: item.phone,
    address: item.address,
    lastOrderAt: item.last_order_at,
    createdAt: item.created_at
  }));
};

export const saveOrUpdateCustomer = async (
  name: string,
  email: string,
  phone: string,
  address: string
): Promise<void> => {
  // Upsert: If email exists, update info. If not, insert new.
  const { error } = await supabase
    .from('customers')
    .upsert({
      name,
      email,
      phone,
      address,
      last_order_at: new Date().toISOString()
    }, { onConflict: 'email' });

  if (error) {
    console.error('Error saving customer:', error);
  }
};