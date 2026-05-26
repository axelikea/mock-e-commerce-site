import { useState, useEffect, useCallback } from 'react';
import type { CartItem } from '../types';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart as clearCartApi } from '../api';

interface UseCartResult {
  cartItems: CartItem[];
  cartItemCount: number;
  cartTotal: number;
  loading: boolean;
  error: string | null;
  addItem: (productId: number, quantity: number) => Promise<void>;
  updateItem: (productId: number, quantity: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

export function useCart(): UseCartResult {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await getCart();
      setCartItems(Array.isArray(items) ? items : []);
    } catch {
      setError('Failed to load cart.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = useCallback(async (productId: number, quantity: number) => {
    await addToCart(productId, quantity);
    await refreshCart();
  }, [refreshCart]);

  const updateItem = useCallback(async (productId: number, quantity: number) => {
    await updateCartItem(productId, quantity);
    await refreshCart();
  }, [refreshCart]);

  const removeItem = useCallback(async (productId: number) => {
    await removeFromCart(productId);
    await refreshCart();
  }, [refreshCart]);

  const clearCart = useCallback(async () => {
    await clearCartApi();
    await refreshCart();
  }, [refreshCart]);

  const cartItemCount = cartItems.length;
  const cartTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

  return {
    cartItems,
    cartItemCount,
    cartTotal,
    loading,
    error,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    refreshCart,
  };
}
