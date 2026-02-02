
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
    gender: item.gender || 'male',
    grammage: item.grammage,
    config: item.config,
    total: item.total,
    status: item.status,
    date: item.created_at,
    adminDiscountApplied: item.admin_discount_applied
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
        gender: data.gender || 'male',
        grammage: data.grammage,
        config: data.config,
        total: data.total,
        status: data.status,
        date: data.created_at,
        adminDiscountApplied: data.admin_discount_applied
    };
};

export const updateOrderStatus = async (orderId: string, newStatus: OrderStatus): Promise<boolean> => {
  // 1. Obtener el pedido actual
  const currentOrder = await getOrderById(orderId);
  if (!currentOrder) return false;

  const oldStatus = currentOrder.status;

  // 2. Lógica de Inventario
  const isConsumedState = (status: OrderStatus) => status === 'processing' || status === 'shipped';

  const wasConsumed = isConsumedState(oldStatus);
  const willBeConsumed = isConsumedState(newStatus);

  // CASO 1: De Pendiente -> (Procesando O Enviado) => Restar
  if (!wasConsumed && willBeConsumed) {
      await adjustInventoryQuantity(
          currentOrder.gender, 
          currentOrder.config.color, 
          currentOrder.size, 
          currentOrder.grammage, 
          -1
      );
  }
  
  // CASO 2: De (Procesando O Enviado) -> Pendiente => Sumar (Devolver)
  else if (wasConsumed && !willBeConsumed) {
      await adjustInventoryQuantity(
          currentOrder.gender, 
          currentOrder.config.color, 
          currentOrder.size, 
          currentOrder.grammage, 
          1
      );
  }

  // 3. Actualizar estado en base de datos
  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  if (error) {
      console.error('Error updating order:', error);
      return false;
  }
  return true;
};

export const toggleOrderDiscount = async (orderId: string, currentTotal: number, shouldApply: boolean): Promise<boolean> => {
    const DISCOUNT_AMOUNT = 5000;
    // If applying: subtract 5000. If removing: add 5000.
    // NOTE: This assumes currentTotal passed is the value BEFORE the change being requested if UI logic is handled separately
    // But to be safe, the service calculates new total based on currentTotal provided.
    // In AdminOrders, we pass the 'total' as it is in state. 
    // If we are checking the box (shouldApply = true), it means current state is unchecked (higher price).
    // If we are unchecking (shouldApply = false), it means current state is checked (lower price).
    const newTotal = shouldApply ? currentTotal - DISCOUNT_AMOUNT : currentTotal + DISCOUNT_AMOUNT;

    const { error } = await supabase
        .from('orders')
        .update({ 
            admin_discount_applied: shouldApply,
            total: newTotal
        })
        .eq('id', orderId);

    if (error) {
        console.error('Error toggling discount:', error);
        return false;
    }
    return true;
};

export const submitOrder = async (orderData: Omit<Order, 'id' | 'date' | 'status'>): Promise<Order> => {
    // 1. Process images
    const processedConfig = { ...orderData.config };
    
    if (processedConfig.snapshotUrl && processedConfig.snapshotUrl.startsWith('data:')) {
      const snapshotUrl = await uploadBase64Image(processedConfig.snapshotUrl, 'renders');
      if (snapshotUrl) processedConfig.snapshotUrl = snapshotUrl;
    }

    const processedLayers = await Promise.all(processedConfig.layers.map(async (layer) => {
      if (layer.textureUrl.startsWith('data:')) {
        const textureUrl = await uploadBase64Image(layer.textureUrl, 'uploads');
        return { ...layer, textureUrl: textureUrl || layer.textureUrl };
      }
      return layer;
    }));
    processedConfig.layers = processedLayers;

    // 2. Save Customer
    await saveOrUpdateCustomer(
        orderData.customerName,
        orderData.email,
        orderData.phone,
        orderData.address
    );

    const newOrderId = Math.random().toString(36).substr(2, 9).toUpperCase();

    // 3. Insert Order
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        id: newOrderId,
        customer_name: orderData.customerName,
        email: orderData.email,
        phone: orderData.phone,
        address: orderData.address,
        size: orderData.size,
        gender: orderData.gender,
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
        gender: data.gender,
        grammage: data.grammage,
        config: data.config,
        total: data.total,
        date: data.created_at,
        status: data.status,
        adminDiscountApplied: false
    };
};
