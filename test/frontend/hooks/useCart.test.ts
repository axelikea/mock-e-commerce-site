import { renderHook, act, waitFor } from '@testing-library/react';
import { useCart } from '../../../src/frontend/src/hooks/useCart';
import type { CartItem } from '../../../src/frontend/src/types';

vi.mock('../../../src/frontend/src/api');

import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../../../src/frontend/src/api';

const mockItem: CartItem = {
  productId: 1,
  productName: 'Wireless Headphones',
  unitPrice: 79.99,
  quantity: 1,
  totalPrice: 79.99,
};

describe('useCart', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches cart on mount', async () => {
    vi.mocked(getCart).mockResolvedValue([mockItem]);

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(vi.mocked(getCart)).toHaveBeenCalledTimes(1);
    });
    expect(result.current.cartItems).toHaveLength(1);
  });

  it('starts with empty cart when getCart returns empty', async () => {
    vi.mocked(getCart).mockResolvedValue([]);

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.cartItems).toHaveLength(0);
    expect(result.current.cartItemCount).toBe(0);
    expect(result.current.cartTotal).toBe(0);
  });

  it('computes cartItemCount as number of distinct items', async () => {
    const items: CartItem[] = [
      { productId: 1, productName: 'A', unitPrice: 10, quantity: 3, totalPrice: 30 },
      { productId: 2, productName: 'B', unitPrice: 20, quantity: 1, totalPrice: 20 },
    ];
    vi.mocked(getCart).mockResolvedValue(items);

    const { result } = renderHook(() => useCart());

    await waitFor(() => expect(result.current.cartItemCount).toBe(2));
  });

  it('computes cartTotal as sum of totalPrice', async () => {
    const items: CartItem[] = [
      { productId: 1, productName: 'A', unitPrice: 10, quantity: 3, totalPrice: 30 },
      { productId: 2, productName: 'B', unitPrice: 20, quantity: 1, totalPrice: 20 },
    ];
    vi.mocked(getCart).mockResolvedValue(items);

    const { result } = renderHook(() => useCart());

    await waitFor(() => expect(result.current.cartTotal).toBe(50));
  });

  it('addItem calls addToCart and refreshes cart', async () => {
    vi.mocked(getCart).mockResolvedValue([]);
    vi.mocked(addToCart).mockResolvedValue(mockItem);

    const { result } = renderHook(() => useCart());
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.mocked(getCart).mockResolvedValue([mockItem]);
    await act(async () => {
      await result.current.addItem(1, 1);
    });

    expect(vi.mocked(addToCart)).toHaveBeenCalledWith(1, 1);
    expect(result.current.cartItems).toHaveLength(1);
  });

  it('updateItem calls updateCartItem and refreshes cart', async () => {
    const updatedItem = { ...mockItem, quantity: 3, totalPrice: 239.97 };
    vi.mocked(getCart).mockResolvedValue([mockItem]);
    vi.mocked(updateCartItem).mockResolvedValue(updatedItem);

    const { result } = renderHook(() => useCart());
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.mocked(getCart).mockResolvedValue([updatedItem]);
    await act(async () => {
      await result.current.updateItem(1, 3);
    });

    expect(vi.mocked(updateCartItem)).toHaveBeenCalledWith(1, 3);
    expect(result.current.cartItems[0].quantity).toBe(3);
  });

  it('removeItem calls removeFromCart and refreshes cart', async () => {
    vi.mocked(getCart).mockResolvedValue([mockItem]);
    vi.mocked(removeFromCart).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCart());
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.mocked(getCart).mockResolvedValue([]);
    await act(async () => {
      await result.current.removeItem(1);
    });

    expect(vi.mocked(removeFromCart)).toHaveBeenCalledWith(1);
    expect(result.current.cartItems).toHaveLength(0);
  });

  it('clearCart calls clearCart API and refreshes cart', async () => {
    vi.mocked(getCart).mockResolvedValue([mockItem]);
    vi.mocked(clearCart).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCart());
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.mocked(getCart).mockResolvedValue([]);
    await act(async () => {
      await result.current.clearCart();
    });

    expect(vi.mocked(clearCart)).toHaveBeenCalled();
    expect(result.current.cartItems).toHaveLength(0);
  });

  it('sets error state when getCart fails', async () => {
    vi.mocked(getCart).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCart());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
  });
});
