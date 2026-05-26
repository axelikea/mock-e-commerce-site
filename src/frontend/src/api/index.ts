import type { Product, CartItem } from '../types';

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const BASE_URL = '/api';

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${BASE_URL}/products`);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
}

export async function fetchProductById(id: number): Promise<Product> {
  const response = await fetch(`${BASE_URL}/products/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch product ${id}`);
  return response.json();
}

export async function getCart(): Promise<CartItem[]> {
  const response = await fetch(`${BASE_URL}/cart`);
  if (!response.ok) throw new ApiError(response.status, 'Failed to fetch cart');
  return response.json();
}

export async function addToCart(productId: number, quantity: number): Promise<CartItem> {
  const response = await fetch(`${BASE_URL}/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity }),
  });
  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to add item to cart');
  }
  return response.json();
}

export async function updateCartItem(productId: number, quantity: number): Promise<CartItem> {
  const response = await fetch(`${BASE_URL}/cart/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
  if (!response.ok) throw new ApiError(response.status, 'Failed to update cart item');
  return response.json();
}

export async function removeFromCart(productId: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/cart/${productId}`, { method: 'DELETE' });
  if (!response.ok) throw new ApiError(response.status, 'Failed to remove cart item');
}

export async function clearCart(): Promise<void> {
  const response = await fetch(`${BASE_URL}/cart`, { method: 'DELETE' });
  if (!response.ok) throw new ApiError(response.status, 'Failed to clear cart');
}

