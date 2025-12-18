import { Order, OrderStatus } from '../types';

const STORAGE_KEY = 'inkfluencia_orders';

// Fetch orders from local storage
export const getOrders = (): Order[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

// Update an order's status
export const updateOrderStatus = (orderId: string, newStatus: OrderStatus): Order[] => {
  const currentOrders = getOrders();
  const updatedOrders = currentOrders.map(order => 
    order.id === orderId ? { ...order, status: newStatus } : order
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
  return updatedOrders;
};

// Mock backend service with LocalStorage persistence
export const submitOrder = async (orderData: Omit<Order, 'id' | 'date' | 'status'>): Promise<Order> => {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      const newOrder: Order = {
        ...orderData,
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        date: new Date().toISOString(),
        status: 'pending'
      };
      
      // Save to local storage for the admin panel
      const currentOrders = getOrders();
      const updatedOrders = [newOrder, ...currentOrders];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
      
      console.log('Order processed and saved:', newOrder);
      
      resolve(newOrder);
    }, 1500);
  });
};