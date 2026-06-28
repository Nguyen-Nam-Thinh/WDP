import { useState, useEffect, useCallback } from 'react';
import { userApi } from '../api/user';
import { useAuth } from './useAuth';

export function useWallet() {
  const { token, updateUser } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWallet = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await userApi.getMyWallet(token);
      const raw: number = data?.balance ?? 0;
      setBalance(raw);
      updateUser({ balance: `${raw.toLocaleString('vi-VN')} coins` });
    } catch {
      // silently ignore — show last known value
    } finally {
      setLoading(false);
    }
  }, [token, updateUser]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const formatted = balance !== null ? `${balance.toLocaleString('vi-VN')} coins` : null;

  const adjustBalance = useCallback((delta: number) => {
    setBalance((prev) => {
      if (prev === null) return prev;
      const next = Math.max(0, prev + delta);
      updateUser({ balance: `${next.toLocaleString('vi-VN')} coins` });
      return next;
    });
  }, [updateUser]);

  return { balance, formatted, loading, refetch: fetchWallet, adjustBalance };
}
