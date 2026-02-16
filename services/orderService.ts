import { supabase, uploadBase64Image } from '../lib/supabaseClient';
import { Order, OrderStatus } from '../types';
import { saveOrUpdateCustomer } from './customerService';
import { adjustInventoryQuantity } from './inventoryService';
import { WHATSAPP_PHONE, formatCurrency } from '../constants';

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
  const currentOrder = await getOrderById(orderId);
  if (!currentOrder) return false;

  const oldStatus = currentOrder.status;
  const isConsumedState = (status: OrderStatus) => status === 'processing' || status === 'shipped';
  const wasConsumed = isConsumedState(oldStatus);
  const willBeConsumed = isConsumedState(newStatus);

  if (!wasConsumed && willBeConsumed) {
      await adjustInventoryQuantity(
          currentOrder.gender, 
          currentOrder.config.color, 
          currentOrder.size, 
          currentOrder.grammage, 
          -1
      );
  } else if (wasConsumed && !willBeConsumed) {
      await adjustInventoryQuantity(
          currentOrder.gender, 
          currentOrder.config.color, 
          currentOrder.size, 
          currentOrder.grammage, 
          1
      );
  }

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

/**
 * Elimina un pedido y devuelve el stock si el pedido ya estaba descontado.
 */
export const deleteOrder = async (orderId: string): Promise<boolean> => {
    try {
        // 1. Obtener detalles del pedido EN MEMORIA antes de borrarlo
        const order = await getOrderById(orderId);
        if (!order) {
            console.error('No se pudo encontrar el pedido en la DB');
            return false;
        }

        // 2. Ejecutar el borrado real en Supabase PRIMERO
        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', orderId);

        if (error) {
            console.error('🚨 SUPABASE DELETE ERROR:', error.message, error.details, error.hint);
            return false;
        }

        console.log('✅ Registro eliminado de Supabase exitosamente');

        // 3. Solo si se borró con éxito de la DB, devolvemos el stock (usando el objeto 'order' que guardamos en el paso 1)
        const isConsumedState = (status: OrderStatus) => status === 'processing' || status === 'shipped';
        if (isConsumedState(order.status)) {
            console.log(`📦 Devolviendo stock al inventario para pedido eliminado: ${orderId}`);
            await adjustInventoryQuantity(
                order.gender, 
                order.config.color, 
                order.size, 
                order.grammage, 
                1
            );
        }

        return true;
    } catch (e) {
        console.error('Excepción crítica en deleteOrder:', e);
        return false;
    }
};

export const toggleOrderDiscount = async (orderId: string, currentTotal: number, shouldApply: boolean): Promise<boolean> => {
    const DISCOUNT_AMOUNT = 5000;
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

export const generateWhatsAppLink = (order: Order) => {
    const message = `¡Hola *Inkfluencia*! 👋 Acabo de realizar un nuevo pedido.\n\n` +
                    `📦 *ID del Pedido:* #${order.id}\n` +
                    `👤 *Cliente:* ${order.customerName}\n` +
                    `👕 *Prenda:* Camiseta ${order.config.color === 'white' ? 'Blanca' : 'Negra'} (${order.gender === 'male' ? 'Hombre' : 'Mujer'})\n` +
                    `📏 *Talla:* ${order.size}\n` +
                    `🧶 *Gramaje:* ${order.grammage}\n` +
                    `📍 *Dirección:* ${order.address}\n` +
                    `💰 *Total:* ${formatCurrency(order.total)}`;
    
    return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
};

export const submitOrder = async (orderData: Omit<Order, 'id' | 'date' | 'status'>): Promise<Order> => {
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

    await saveOrUpdateCustomer(
        orderData.customerName,
        orderData.email,
        orderData.phone,
        orderData.address
    );

    const newOrderId = Math.random().toString(36).substr(2, 9).toUpperCase();

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