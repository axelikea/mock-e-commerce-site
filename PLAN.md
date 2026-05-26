# Shopping Cart Implementation Plan

## Design Decisions

### Cart UI approach: Side Drawer

The cart UI is a **side drawer** (not a modal, not a separate page, not a dropdown).

- **Component architecture:** A fixed-position panel that slides in from the right edge of the viewport over the existing page content, with a semi-transparent backdrop overlay.
- **Trigger:** Clicking the existing cart icon in the Header opens/closes the drawer.
- **Rationale:** A side drawer keeps users on the product listing page while managing their cart. Unlike a modal, it doesn't block the viewport center. Unlike a separate page, it doesn't require routing. Unlike a dropdown, it has room for quantity controls and a full item list.
- **Implementation:** Single `CartDrawer` component with CSS `position: fixed; right: 0; transform: translateX(...)` for open/close animation.

### Quantity boundary (max 5, inclusive)

A quantity of exactly 5 is **allowed**. Only quantities **above 5** are rejected. All checks must use `<= 5` (valid) / `> 5` (invalid) — never `< 5`.

---

## Phase 1: Backend — InMemoryCartService

**Goal:** Implement all `ICartService` methods plus add `Update` support.

### Steps

1. **Add `Update` method to `ICartService`:**
   - Signature: `CartItem? Update(int productId, int quantity);`
   - Returns updated `CartItem` or `null` if not found.

2. **Implement `InMemoryCartService`:**
   - Internal storage: `ConcurrentDictionary<int, CartItem>` keyed by `productId`.
   - `GetAll()` → return all values from the dictionary.
   - `GetByProductId(int productId)` → `TryGetValue`, return item or `null`.
   - `Add(CartItem item)` → use `AddOrUpdate`; if key exists, increment quantity on the existing item and return it.
   - `Update(int productId, int quantity)` → look up item, set `Quantity = quantity`, return item. Return `null` if not found.
   - `Remove(int productId)` → `TryRemove`, return `true`/`false`.
   - `Clear()` → `dictionary.Clear()`.
   - Use `lock (_syncLock)` around `Add` to ensure the "check existing + compute new quantity" sequence is atomic.

### Files Modified
- `src/backend/MockEcommerce.Api/Services/ICartService.cs`
- `src/backend/MockEcommerce.Api/Services/InMemoryCartService.cs`

---

## Phase 2: Backend — Cart Endpoints

**Goal:** Implement all endpoint handlers in `CartEndpoints.cs` and add the PUT endpoint.

### Steps

1. **Implement `GetCart` (GET /api/cart):**
   - Call `cartService.GetAll()`, return `Ok(items)`.
   - This is the **foundation endpoint** — used to verify every other cart operation works correctly. Implement and test this first.

2. **Implement `AddToCart`:**
   - Validate `request.Quantity` is between 1–5 **(inclusive on both ends)**; if not, return `ValidationProblem` with error on `"quantity"`.
   - Look up product via `productService.GetById(request.ProductId)`; if null, return `NotFound("Product with ID {id} not found.")`.
   - Check if item exists in cart via `cartService.GetByProductId(request.ProductId)`:
     - If exists: validate `existing.Quantity + request.Quantity <= 5` (exactly 5 is allowed); if exceeds, return `ValidationProblem`. Otherwise, call `Add` (which increments), return `Ok(updatedItem)`.
     - If not exists: create `CartItem` with `ProductName`, `UnitPrice` from product, `Quantity` from request. Call `Add`, return `Created($"/api/cart", item)`.

3. **Add PUT endpoint registration** in `MapCartEndpoints`:
   - `group.MapPut("/{productId:int}", UpdateCartItem)`.

4. **Implement `UpdateCartItem`:**
   - Validate `request.Quantity` is between 1–5; if not, return `ValidationProblem`.
   - Call `cartService.Update(productId, request.Quantity)`.
   - If null, return `NotFound()`. Otherwise return `Ok(updatedItem)`.

5. **Implement `RemoveFromCart`:** Call `cartService.Remove(productId)`. If false, return `NotFound()`. Otherwise `NoContent()`.

6. **Implement `ClearCart`:** Call `cartService.Clear()`, return `NoContent()`.

7. **Add `UpdateCartItemRequest` record:** `public record UpdateCartItemRequest(int Quantity);`

### Files Modified
- `src/backend/MockEcommerce.Api/Endpoints/CartEndpoints.cs`

---

## Phase 3: Backend Tests

**Goal:** Add integration tests for all cart endpoints covering happy paths and edge cases.

### Test Cases

| Test | Endpoint | Assertion |
|------|----------|-----------|
| Get empty cart returns 200 with [] | GET | Status 200, empty array |
| Add new item returns 201 with CartItem | POST | Status 201, correct fields |
| Add existing item increments quantity returns 200 | POST | Status 200, quantity = sum |
| Add with quantity 0 returns 400 | POST | Status 400, errors.quantity |
| Add with quantity 5 returns 201 (boundary) | POST | Status 201, quantity = 5 |
| Add with quantity 6 returns 400 | POST | Status 400, errors.quantity |
| Add exceeding max (3+3) returns 400 | POST | Status 400 |
| Add non-existent product returns 404 | POST | Status 404 |
| Update item returns 200 | PUT | Status 200, new quantity |
| Update item not in cart returns 404 | PUT | Status 404 |
| Update with quantity 0 returns 400 | PUT | Status 400 |
| Update with quantity 5 returns 200 (boundary) | PUT | Status 200, quantity = 5 |
| Update with quantity 6 returns 400 | PUT | Status 400 |
| Remove existing item returns 204 | DELETE /{id} | Status 204 |
| Remove non-existent item returns 404 | DELETE /{id} | Status 404 |
| Clear cart returns 204 | DELETE / | Status 204 |
| Clear empty cart returns 204 | DELETE / | Status 204 |

### Files Created
- `test/backend/MockEcommerce.Api.Tests/Endpoints/CartEndpointTests.cs`
- `test/backend/MockEcommerce.Api.Tests/Services/InMemoryCartServiceTests.cs`

---

## Phase 4: Frontend — Cart State & API

**Goal:** Add cart API functions, cart state hook, and types.

### Steps

1. **Add API functions** in `src/frontend/src/api/index.ts`:
   - `getCart(): Promise<CartItem[]>`
   - `addToCart(productId: number, quantity: number): Promise<CartItem>`
   - `updateCartItem(productId: number, quantity: number): Promise<CartItem>`
   - `removeFromCart(productId: number): Promise<void>`
   - `clearCart(): Promise<void>`

2. **Add `CartItem` type** in `src/frontend/src/types/index.ts`:
   ```ts
   export interface CartItem {
     productId: number;
     productName: string;
     unitPrice: number;
     quantity: number;
     totalPrice: number;
   }
   ```

3. **Create `useCart` hook** in `src/frontend/src/hooks/useCart.ts`:
   - State: `cartItems: CartItem[]`, `loading: boolean`, `error: string | null`.
   - Exposes: `cartItems`, `cartItemCount` (distinct items), `cartTotal` (sum of totalPrice), `addItem`, `updateItem`, `removeItem`, `clearCart`, `refreshCart`.
   - All mutating functions call the API, then refresh the cart from GET on success.

---

## Phase 5: Frontend — Cart UI Components

**Goal:** Build the cart panel/drawer and integrate with header.

### Steps

1. **Create `CartDrawer` component** (`src/frontend/src/components/CartDrawer/`):
   - A **side drawer** that slides in from the right, with a backdrop overlay that closes it on click.
   - List of cart items: name, unit price, quantity controls (−/+), line total, remove button.
   - Disable "+" when quantity = 5 (max allowed), disable "−" when quantity = 1.
   - Order summary: grand total.
   - "Clear cart" button (disabled when empty).
   - Empty state: "Your cart is empty" message.
   - Loading spinner while fetching.
   - Error message display.

2. **Create `CartItemRow` component** (`src/frontend/src/components/CartDrawer/CartItemRow.tsx`):
   - Renders one row with quantity controls.

3. **Update `Header` component — wire cart icon to drawer:**
   - The cart icon **already exists** in the Header component; do NOT create a new one.
   - Add an `onClick` handler to the existing icon that toggles the cart drawer open/closed.
   - Display an item-count badge on the icon showing `cartItemCount` (number of distinct items).

4. **Update `App.tsx`:**
   - Integrate `useCart` hook.
   - Pass `cartItemCount` to Header.
   - Manage cart drawer open/closed state.
   - Pass cart data and handlers to CartDrawer.

5. **Update `ProductCard`:**
   - Add "Add to cart" button calling `POST /api/cart` with `quantity: 1`.
   - Show error message if 400 returned (max quantity reached).

---

## Phase 6: Frontend Tests

**Goal:** Add Vitest tests for new components and hooks.

### Test Cases
- `useCart` hook: fetches cart on mount, adds/updates/removes items.
- `CartDrawer`: renders items, shows empty state, disables buttons at quantity limits (1 min, 5 max).
- `ProductCard`: "Add to cart" button calls API, displays error on 400.
- `Header`: badge shows correct count, clicking cart icon triggers drawer open callback.

### Files Created
- `test/frontend/components/CartDrawer/CartDrawer.test.tsx`
- `test/frontend/hooks/useCart.test.ts`

---

## Execution Order

```
Phase 1 (service) → Phase 2 (endpoints) → Phase 3 (backend tests)
                                         ↘
Phase 4 (frontend API/state) → Phase 5 (UI) → Phase 6 (frontend tests)
```

Phases 1–3 are backend-only and can be validated independently with `dotnet test`.
Phases 4–6 are frontend-only and can be validated with `npm test`.
