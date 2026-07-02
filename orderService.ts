
import { Order } from './types';

const STORAGE_KEY = 'custom_tee_orders';

export const saveOrder = (order: Order): void => {
  const existing = getOrders();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, order]));
};

export const getOrders = (): Order[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const updateOrderStatus = (id: string, status: Order['status']): void => {
  const orders = getOrders().map(o => o.id === id ? { ...o, status } : o);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
};
