import { useState, useEffect, useCallback } from 'react';
import {
  getOrders,
  updateOrderStatus,
  toggleOrderDiscount,
  deleteOrder,
} from '../services/orderService';
import { Order, OrderStatus } from '../types';

interface UseOrdersResult {
  orders: Order[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  updateStatus: (orderId: string, newStatus: OrderStatus) => Promise<boolean>;
  toggleDiscount: (orderId: string, currentTotal: number, shouldApply: boolean) => Promise<boolean>;
  removeOrder: (orderId: string) => Promise<boolean>;
}

export const useOrders = (): UseOrdersResult => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar pedidos';
      setError(message);
      console.error('[useOrders]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Actualiza el estado de un pedido y sincroniza la lista local
  const updateStatus = useCallback(
    async (orderId: string, newStatus: OrderStatus): Promise<boolean> => {
      const success = await updateOrderStatus(orderId, newStatus);
      if (success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
      return success;
    },
    []
  );

  // Aplica o revierte el descuento de admin y actualiza el total localmente
  const toggleDiscount = useCallback(
    async (orderId: string, currentTotal: number, shouldApply: boolean): Promise<boolean> => {
      const DISCOUNT_AMOUNT = 5000;
      const success = await toggleOrderDiscount(orderId, currentTotal, shouldApply);
      if (success) {
        const newTotal = shouldApply ? currentTotal - DISCOUNT_AMOUNT : currentTotal + DISCOUNT_AMOUNT;
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, total: newTotal, adminDiscountApplied: shouldApply } : o
          )
        );
      }
      return success;
    },
    []
  );

  // Elimina un pedido y lo quita de la lista local
  const removeOrder = useCallback(async (orderId: string): Promise<boolean> => {
    const success = await deleteOrder(orderId);
    if (success) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    }
    return success;
  }, []);

  return { orders, loading, error, refresh, updateStatus, toggleDiscount, removeOrder };
};
