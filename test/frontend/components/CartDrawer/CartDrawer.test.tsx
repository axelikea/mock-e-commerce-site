import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartDrawer } from '../../../../src/frontend/src/components/CartDrawer';
import type { CartItem } from '../../../../src/frontend/src/types';

const mockItem: CartItem = {
  productId: 1,
  productName: 'Wireless Headphones',
  unitPrice: 79.99,
  quantity: 2,
  totalPrice: 159.98,
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  cartItems: [],
  loading: false,
  error: null,
  onUpdateItem: vi.fn(),
  onRemoveItem: vi.fn(),
  onClearCart: vi.fn(),
};

describe('CartDrawer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows empty state when cart has no items', () => {
    render(<CartDrawer {...defaultProps} cartItems={[]} />);
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it('renders cart items when present', () => {
    render(<CartDrawer {...defaultProps} cartItems={[mockItem]} />);
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
  });

  it('shows the product total price', () => {
    render(<CartDrawer {...defaultProps} cartItems={[mockItem]} />);
    // totalPrice appears in both the item row and the order summary
    const totals = screen.getAllByText('$159.98');
    expect(totals.length).toBeGreaterThan(0);
  });

  it('shows the order total', () => {
    render(<CartDrawer {...defaultProps} cartItems={[mockItem]} />);
    expect(screen.getByText('Order total:')).toBeInTheDocument();
  });

  it('disables decrement button when quantity is 1', () => {
    const item = { ...mockItem, quantity: 1, totalPrice: 79.99 };
    render(<CartDrawer {...defaultProps} cartItems={[item]} />);
    const decrementBtn = screen.getByRole('button', { name: /decrease quantity of wireless headphones/i });
    expect(decrementBtn).toBeDisabled();
  });

  it('enables decrement button when quantity is above 1', () => {
    render(<CartDrawer {...defaultProps} cartItems={[mockItem]} />);
    const decrementBtn = screen.getByRole('button', { name: /decrease quantity of wireless headphones/i });
    expect(decrementBtn).not.toBeDisabled();
  });

  it('disables increment button when quantity is 5', () => {
    const item = { ...mockItem, quantity: 5, totalPrice: 399.95 };
    render(<CartDrawer {...defaultProps} cartItems={[item]} />);
    const incrementBtn = screen.getByRole('button', { name: /increase quantity of wireless headphones/i });
    expect(incrementBtn).toBeDisabled();
  });

  it('enables increment button when quantity is below 5', () => {
    render(<CartDrawer {...defaultProps} cartItems={[mockItem]} />);
    const incrementBtn = screen.getByRole('button', { name: /increase quantity of wireless headphones/i });
    expect(incrementBtn).not.toBeDisabled();
  });

  it('calls onUpdateItem with incremented quantity when + clicked', async () => {
    const onUpdateItem = vi.fn();
    render(<CartDrawer {...defaultProps} cartItems={[mockItem]} onUpdateItem={onUpdateItem} />);
    await userEvent.click(screen.getByRole('button', { name: /increase quantity of wireless headphones/i }));
    expect(onUpdateItem).toHaveBeenCalledWith(1, 3);
  });

  it('calls onUpdateItem with decremented quantity when - clicked', async () => {
    const onUpdateItem = vi.fn();
    render(<CartDrawer {...defaultProps} cartItems={[mockItem]} onUpdateItem={onUpdateItem} />);
    await userEvent.click(screen.getByRole('button', { name: /decrease quantity of wireless headphones/i }));
    expect(onUpdateItem).toHaveBeenCalledWith(1, 1);
  });

  it('calls onRemoveItem when remove button clicked', async () => {
    const onRemoveItem = vi.fn();
    render(<CartDrawer {...defaultProps} cartItems={[mockItem]} onRemoveItem={onRemoveItem} />);
    await userEvent.click(screen.getByRole('button', { name: /remove wireless headphones from cart/i }));
    expect(onRemoveItem).toHaveBeenCalledWith(1);
  });

  it('calls onClearCart when clear cart button clicked', async () => {
    const onClearCart = vi.fn();
    render(<CartDrawer {...defaultProps} cartItems={[mockItem]} onClearCart={onClearCart} />);
    await userEvent.click(screen.getByRole('button', { name: /clear cart/i }));
    expect(onClearCart).toHaveBeenCalled();
  });

  it('disables clear cart button when cart is empty', () => {
    render(<CartDrawer {...defaultProps} cartItems={[]} />);
    expect(screen.getByRole('button', { name: /clear cart/i })).toBeDisabled();
  });

  it('calls onClose when backdrop clicked', async () => {
    const onClose = vi.fn();
    const { container } = render(<CartDrawer {...defaultProps} onClose={onClose} />);
    const backdrop = container.querySelector('.cart-drawer__backdrop');
    expect(backdrop).toBeTruthy();
    await userEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn();
    render(<CartDrawer {...defaultProps} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /close cart/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows loading state when loading', () => {
    render(<CartDrawer {...defaultProps} loading={true} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error message when error occurs', () => {
    render(<CartDrawer {...defaultProps} error="Failed to load cart." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load cart.');
  });

  it('renders multiple items', () => {
    const item2: CartItem = {
      productId: 2,
      productName: 'Running Shoes',
      unitPrice: 59.99,
      quantity: 1,
      totalPrice: 59.99,
    };
    render(<CartDrawer {...defaultProps} cartItems={[mockItem, item2]} />);
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('Running Shoes')).toBeInTheDocument();
  });
});
