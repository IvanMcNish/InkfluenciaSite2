import { useState, useEffect, useCallback } from 'react';
import { getCustomers } from '../services/customerService';
import { Customer } from '../types';

interface UseCustomersResult {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useCustomers = (): UseCustomersResult => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar clientes';
      setError(message);
      console.error('[useCustomers]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { customers, loading, error, refresh };
};
