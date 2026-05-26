import { useState, useRef, useEffect } from 'react';
import type { Product } from './types';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { ProductList } from './components/ProductList';
import { CartDrawer } from './components/CartDrawer';
import { useProducts } from './hooks/useProducts';
import { useCart } from './hooks/useCart';
import { ApiError } from './api';
import './App.css';

export function App() {
  const { products, loading, error } = useProducts();
  const { cartItems, cartItemCount, loading: cartLoading, error: cartError, addItem, updateItem, removeItem, clearCart } = useCart();
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function showMessage(message: string) {
    setCartMessage(message);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCartMessage(null), 3000);
  }

  async function handleAddToCart(product: Product) {
    try {
      await addItem(product.id, 1);
      showMessage(`"${product.name}" added to cart!`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        showMessage('Maximum quantity reached');
      } else {
        showMessage('Failed to add item to cart.');
      }
    }
  }

  async function handleUpdateItem(productId: number, quantity: number) {
    try {
      await updateItem(productId, quantity);
    } catch {
      showMessage('Failed to update item.');
    }
  }

  async function handleRemoveItem(productId: number) {
    try {
      await removeItem(productId);
    } catch {
      showMessage('Failed to remove item.');
    }
  }

  async function handleClearCart() {
    try {
      await clearCart();
    } catch {
      showMessage('Failed to clear cart.');
    }
  }

  return (
    <div className="app">
      <Header
        cartItemCount={cartItemCount}
        onCartClick={() => setIsCartOpen((open) => !open)}
      />
      <HeroBanner />

      <main className="app__main">
        <h1 className="app__section-heading">Our products</h1>

        {cartMessage && (
          <div className="app__notification" role="status">
            {cartMessage}
          </div>
        )}

        {loading && <p className="app__loading">Loading products…</p>}
        {error && <p className="app__error">Error: {error}</p>}
        {!loading && !error && (
          <ProductList products={products} onAddToCart={handleAddToCart} />
        )}
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        loading={cartLoading}
        error={cartError}
        onUpdateItem={handleUpdateItem}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />
    </div>
  );
}
