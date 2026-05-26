import type { CartItem } from '../../types';
import { CartItemRow } from './CartItemRow';
import './CartDrawer.css';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  loading: boolean;
  error: string | null;
  onUpdateItem: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  loading,
  error,
  onUpdateItem,
  onRemoveItem,
  onClearCart,
}: CartDrawerProps) {
  const cartTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const isEmpty = cartItems.length === 0;

  return (
    <>
      {isOpen && (
        <div
          className="cart-drawer__backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={`cart-drawer ${isOpen ? 'cart-drawer--open' : ''}`}
        aria-label="Shopping cart"
        role="dialog"
        aria-modal="true"
      >
        <div className="cart-drawer__header">
          <h2 className="cart-drawer__title">Your Cart</h2>
          <button
            className="cart-drawer__close"
            aria-label="Close cart"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="cart-drawer__content">
          {loading && (
            <p className="cart-drawer__loading" role="status">
              Loading cart…
            </p>
          )}

          {error && !loading && (
            <p className="cart-drawer__error" role="alert">
              {error}
            </p>
          )}

          {!loading && !error && isEmpty && (
            <p className="cart-drawer__empty">Your cart is empty</p>
          )}

          {!loading && !error && !isEmpty && (
            <ul className="cart-drawer__items" aria-label="Cart items">
              {cartItems.map((item) => (
                <CartItemRow
                  key={item.productId}
                  item={item}
                  onUpdateItem={onUpdateItem}
                  onRemoveItem={onRemoveItem}
                />
              ))}
            </ul>
          )}
        </div>

        {!isEmpty && (
          <div className="cart-drawer__summary">
            <div className="cart-drawer__total">
              <span>Order total:</span>
              <span className="cart-drawer__total-amount">${cartTotal.toFixed(2)}</span>
            </div>
            <button
              className="cart-drawer__clear"
              onClick={onClearCart}
              disabled={isEmpty}
            >
              Clear cart
            </button>
          </div>
        )}

        {isEmpty && (
          <div className="cart-drawer__summary">
            <button
              className="cart-drawer__clear"
              onClick={onClearCart}
              disabled={true}
            >
              Clear cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
