import type { CartItem } from '../../types';

interface CartItemRowProps {
  item: CartItem;
  onUpdateItem: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
}

export function CartItemRow({ item, onUpdateItem, onRemoveItem }: CartItemRowProps) {
  return (
    <li className="cart-item-row">
      <div className="cart-item-row__info">
        <span className="cart-item-row__name">{item.productName}</span>
        <span className="cart-item-row__unit-price">${item.unitPrice.toFixed(2)} each</span>
      </div>
      <div className="cart-item-row__controls">
        <button
          className="cart-item-row__qty-btn"
          aria-label={`Decrease quantity of ${item.productName}`}
          disabled={item.quantity <= 1}
          onClick={() => onUpdateItem(item.productId, item.quantity - 1)}
        >
          −
        </button>
        <span className="cart-item-row__qty" aria-label={`Quantity: ${item.quantity}`}>
          {item.quantity}
        </span>
        <button
          className="cart-item-row__qty-btn"
          aria-label={`Increase quantity of ${item.productName}`}
          disabled={item.quantity >= 5}
          onClick={() => onUpdateItem(item.productId, item.quantity + 1)}
        >
          +
        </button>
      </div>
      <span className="cart-item-row__total">${item.totalPrice.toFixed(2)}</span>
      <button
        className="cart-item-row__remove"
        aria-label={`Remove ${item.productName} from cart`}
        onClick={() => onRemoveItem(item.productId)}
      >
        ✕
      </button>
    </li>
  );
}
