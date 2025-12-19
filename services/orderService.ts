import { supabase, uploadBase64Image } from '../lib/supabaseClient';
import { Order, OrderStatus } from '../types';
import { saveOrUpdateCustomer } from './customerService';
import { adjustInventoryQuantity } from './inventoryService';

export const getOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    customerName: item.customer_name,
    email: item.email,
    phone: item.phone,
    address: item.address,
    size: item.size,
    grammage: item.grammage,
    config: item.config,
    total: item.total,
    status: item.status,
    date: item.created_at
  }));
};

export const getOrderById = async (id: string): Promise<Order | null> => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        console.error('Error fetching order by ID:', error);
        return null;
    }

    return {
        id: data.id,
        customerName: data.customer_name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        size: data.size,
        grammage: data.grammage,
        config: data.config,
        total: data.total,
        status: data.status,
        date: data.created_at
    };
};

export const updateOrderStatus = async (orderId: string, newStatus: OrderStatus): Promise<boolean> => {
  // 1. Obtener el pedido actual para saber su estado anterior y configuración (color/talla)
  const currentOrder = await getOrderById(orderId);
  if (!currentOrder) return false;

  const oldStatus = currentOrder.status;

  // 2. Lógica de Inventario
  // Caso A: Si pasa a 'processing' desde cualquier otro estado (ej. pending), DESCONTAMOS inventario.
  if (newStatus === 'processing' && oldStatus !== 'processing') {
      await adjustInventoryQuantity(currentOrder.config.color, currentOrder.size, -1);
  }
  // Caso B: Si estaba en 'processing' y regresa a 'pending' (corrección de error), DEVOLVEMOS inventario.
  // Nota: Si pasa de 'processing' a 'shipped', NO devolvemos ni descontamos más, porque ya se descontó en el paso anterior.
  else if (oldStatus === 'processing' && newStatus === 'pending') {
      await adjustInventoryQuantity(currentOrder.config.color, currentOrder.size, 1);
  }

  // 3. Actualizar estado en base de datos
  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  if (error) {
      console.error('Error updating order:', error);
      // Opcional: Podríamos revertir el inventario aquí si falla, pero mantenemos simple la lógica.
      return false;
  }
  return true;
};

export const submitOrder = async (orderData: Omit<Order, 'id' | 'date' | 'status'>): Promise<Order> => {
    // 1. Process images if they are still base64 (e.g. direct purchase without saving to gallery)
    const processedConfig = { ...orderData.config };
    
    // Upload Snapshot (The 3D Render)
    if (processedConfig.snapshotUrl && processedConfig.snapshotUrl.startsWith('data:')) {
      const snapshotUrl = await uploadBase64Image(processedConfig.snapshotUrl, 'renders'); // Folder: renders
      if (snapshotUrl) processedConfig.snapshotUrl = snapshotUrl;
    }

    // Upload Layers (User uploaded images)
    const processedLayers = await Promise.all(processedConfig.layers.map(async (layer) => {
      if (layer.textureUrl.startsWith('data:')) {
        const textureUrl = await uploadBase64Image(layer.textureUrl, 'uploads'); // Folder: uploads
        return { ...layer, textureUrl: textureUrl || layer.textureUrl };
      }
      return layer;
    }));
    processedConfig.layers = processedLayers;

    // 2. Save or Update Customer Data independently
    await saveOrUpdateCustomer(
        orderData.customerName,
        orderData.email,
        orderData.phone,
        orderData.address
    );

    const newOrderId = Math.random().toString(36).substr(2, 9).toUpperCase();

    // 3. Insert into Supabase Orders Table
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        id: newOrderId,
        customer_name: orderData.customerName,
        email: orderData.email,
        phone: orderData.phone,
        address: orderData.address,
        size: orderData.size,
        grammage: orderData.grammage,
        config: processedConfig,
        total: orderData.total,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
        console.error('Error submitting order:', error);
        throw error;
    }

    return {
        id: data.id,
        customerName: data.customer_name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        size: data.size,
        grammage: data.grammage,
        config: data.config,
        total: data.total,
        date: data.created_at,
        status: data.status
    };
};