# Shopping Cart Feature Specification

## Overview

Users should be able to view their cart, see what they're paying, and manage their selections before checkout. The cart is accessible from the existing cart icon in the header. The cart is a single shared cart (no user authentication); there is one global cart per server instance.

---

## Constraints

- **Maximum quantity per item:** 5 units **(inclusive — exactly 5 is allowed; only above 5 is rejected)**. All checks must use `<= 5` (valid) / `> 5` (invalid). Attempts to add or update to more than 5 of any single product return `400 Bad Request` with a ValidationProblem body containing an error on the `"quantity"` key.
- **Minimum quantity:** 1. A quantity of 0 or below on any mutating endpoint returns `400 Bad Request` with a ValidationProblem body. To remove an item, use the DELETE endpoint.
- **Cart scope:** Single global cart (no user/session scoping). The singleton service holds one cart for all requests.

---

## API Endpoints

All endpoints are under `/api/cart`. All request and response bodies use `Content-Type: application/json`.

### GET /api/cart

**Foundation endpoint** — this is the primary way to verify all other cart operations work. Implement and test this first.

Returns all items currently in the cart. Returns an empty array `[]` when the cart has no items (never returns `null`).

**Request:** No body, no query parameters.

**Response:** `200 OK`

```json
[
  {
    "productId": 1,
    "productName": "Wireless Headphones",
    "unitPrice": 79.99,
    "quantity": 2,
    "totalPrice": 159.98
  }
]
```

**Edge cases:**
- Empty cart → returns `200 OK` with `[]`.

---

### POST /api/cart

Adds a product to the cart or increments the quantity if the product is already present.

**Request body:**

```json
{
  "productId": 1,
  "quantity": 1
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `productId` | int | Yes | Must correspond to an existing product. |
| `quantity` | int | Yes | Must be ≥ 1 and ≤ 5. |

**Responses:**

| Status | Condition | Body |
|--------|-----------|------|
| `201 Created` | Product was newly added to the cart. | The created `CartItem`. |
| `200 OK` | Product was already in the cart; quantity incremented. | The updated `CartItem`. |
| `404 Not Found` | The specified `productId` does not exist in the product catalog. | `"Product with ID {id} not found."` |
| `400 Bad Request` (ValidationProblem) | Validation failed. | RFC 7807 problem details (see Error Format below). |

**Validation rules (400 cases):**
- `quantity` ≤ 0 → rejected.
- `quantity` > 5 → rejected.
- Item already in cart and `existingQuantity + requestedQuantity` > 5 → rejected. Error message must indicate the maximum allowed and current quantity (e.g., `"Cannot add {requested} units. Product {id} already has {existing} in cart. Maximum is 5."`).

**Edge cases:**
- Adding the same product twice with quantity 3 each (total 6) → second request returns `400`.
- Adding quantity 5 to an empty cart, then adding quantity 1 of same product → second request returns `400`.
- `productId` is 0 or negative → returns `404` (no product with that ID exists).

---

### PUT /api/cart/{productId}

Updates (replaces) the quantity of an item already in the cart. This is an absolute set, not a relative increment.

**Route parameter:** `productId` (int) — the product whose cart quantity is being set.

**Request body:**

```json
{
  "quantity": 3
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `quantity` | int | Yes | Must be ≥ 1 and ≤ 5. |

**Responses:**

| Status | Condition | Body |
|--------|-----------|------|
| `200 OK` | Quantity updated successfully. | The updated `CartItem`. |
| `404 Not Found` | The product is not currently in the cart. | No body. |
| `400 Bad Request` (ValidationProblem) | Validation failed. | RFC 7807 problem details. |

**Validation rules (400 cases):**
- `quantity` ≤ 0 → rejected.
- `quantity` > 5 → rejected.

**Edge cases:**
- PUT with quantity = 5 on an item already at quantity 5 → returns `200 OK` (idempotent, no change needed).
- PUT on a `productId` that exists in the catalog but is not in the cart → returns `404`.
- PUT with quantity = 0 → returns `400` (use DELETE to remove items).

**Behavior:** Only the `quantity` field is updated. `productName` and `unitPrice` remain as originally captured when the item was first added.

---

### DELETE /api/cart/{productId}

Removes a single product from the cart entirely (regardless of quantity).

**Route parameter:** `productId` (int)

**Request:** No body.

**Responses:**

| Status | Condition | Body |
|--------|-----------|------|
| `204 No Content` | Item removed successfully. | No body. |
| `404 Not Found` | The product was not in the cart. | No body. |

**Edge cases:**
- Deleting an item that was never added → `404`.
- Deleting after already deleting the same item → `404` on second call.

---

### DELETE /api/cart

Removes all items from the cart.

**Request:** No body.

**Response:** `204 No Content` — always, even if the cart was already empty.

**Edge cases:**
- Clearing an already-empty cart → still returns `204` (idempotent).

---

## Error Response Format

All `400 Bad Request` responses use the RFC 7807 `ValidationProblem` format:

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "quantity": ["Quantity must be between 1 and 5."]
  }
}
```

The `errors` object keys correspond to the invalid field name(s). Possible error keys:
- `"quantity"` — when the quantity value is out of range or would exceed the limit.
- `"productId"` — when productId is missing or invalid in the request body (POST only).

---

## Data Model

### CartItem

| Field | Type | Serialized | Description |
|-------|------|------------|-------------|
| `productId` | int | Yes | ID of the associated product. |
| `productName` | string | Yes | Snapshot of the product name at time of first adding. |
| `unitPrice` | decimal | Yes | Price per unit at time of first adding. |
| `quantity` | int | Yes | Number of units in the cart. Valid range: 1–5. |
| `totalPrice` | decimal | Yes (read-only) | Computed: `unitPrice × quantity`. No setter; not accepted as input. |

### AddToCartRequest (POST body)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `productId` | int | Yes | The product to add. |
| `quantity` | int | Yes | How many units to add (1–5). |

### UpdateCartItemRequest (PUT body)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `quantity` | int | Yes | The new absolute quantity to set (1–5). |

---

## Business Rules

1. **Quantity range:** Each cart item's quantity must be between 1 and 5 **(inclusive on both ends — exactly 5 is the maximum allowed value)** at all times. Use `<= 5` checks, never `< 5`.
2. **Add behavior (POST):** When adding a product that already exists in the cart, the requested quantity is *added* to the existing quantity. If the resulting sum exceeds 5, the entire request is rejected — no partial addition occurs.
3. **Update behavior (PUT):** The PUT endpoint *replaces* the current quantity with the provided value (absolute set, not relative increment). The new quantity must be between 1 and 5.
4. **Product validation (POST only):** The `productId` is validated against the product catalog. If the product doesn't exist, return `404`. The PUT and DELETE endpoints only check whether the item exists in the cart, not whether the product exists in the catalog.
5. **Price snapshot:** `unitPrice` and `productName` are captured from the product catalog at the time the item is *first* added to the cart. Subsequent quantity changes (PUT) do not re-fetch the price or name.
6. **Stock is not enforced:** The cart does not check or decrement product stock. Stock validation is deferred to checkout (out of scope for this feature).
7. **Concurrency:** The in-memory cart service must be thread-safe. Use a `ConcurrentDictionary<int, CartItem>` keyed by `productId`, with atomic read-modify-write via `AddOrUpdate` for add operations and a `lock` for compound check-then-act sequences (e.g., validate-then-update).
8. **Idempotency:** PUT is idempotent — setting the same quantity multiple times produces the same result. DELETE /api/cart is idempotent — clearing an empty cart is a no-op that returns 204.

---

## Frontend Behavior

### Cart UI: Side Drawer

The cart is presented as a **side drawer** — a fixed-position panel that slides in from the right edge of the viewport over the existing page content, with a semi-transparent backdrop overlay. It is **not** a modal, a separate page, or a dropdown.

- **Rationale:** A side drawer keeps users on the product listing page while managing their cart. Unlike a modal, it doesn't block the viewport center. Unlike a separate page, it doesn't require routing. Unlike a dropdown, it has room for quantity controls and a full item list.
- **Implementation:** A `CartDrawer` component with CSS `position: fixed; right: 0; top: 0; height: 100vh` and a `transform: translateX(...)` transition for open/close animation. A backdrop `div` covers the rest of the viewport and closes the drawer on click.

### Header Cart Icon Integration

The cart icon **already exists** in the Header component. It must be wired up as follows:
- Add an `onClick` handler to the existing cart icon that toggles the cart drawer open/closed.
- Display a badge on the icon showing the total number of distinct items in the cart (not total units).
- Do **not** create a new icon or button — use the one that's already rendered.

### Detailed Behaviors

1. **Cart view (inside drawer):** Displays each cart item with product name, unit price, quantity selector, and line total (`totalPrice`). Shows an order summary section with the grand total (sum of all `totalPrice` values).
2. **Quantity management:** Users can increase or decrease item quantity (within 1–5 inclusive) from the cart view. Changing the quantity calls `PUT /api/cart/{productId}`. The increment button is disabled when quantity = 5; the decrement button is disabled when quantity = 1.
3. **Remove item:** Each cart item row has a remove/delete button that calls `DELETE /api/cart/{productId}`. The item disappears from the list immediately on success.
4. **Clear cart:** A "Clear cart" button calls `DELETE /api/cart`. Disabled when the cart is empty.
5. **Add to cart (Product card):** Each product card has an "Add to cart" button that calls `POST /api/cart` with `quantity: 1`. If the backend returns a `400` indicating the maximum is reached, the UI displays an inline error message (e.g., "Maximum quantity reached").
6. **Empty state:** When the cart is empty, show a message (e.g., "Your cart is empty") and hide the clear/checkout controls.
7. **Loading & error states:** Show a loading indicator while fetching cart data. Display a user-friendly error message if any cart API call fails unexpectedly (network error, 5xx).
8. **Optimistic updates:** Not required. The UI should wait for the API response before updating the displayed state to ensure consistency.

---

## Edge Cases Summary

| Scenario | Expected Behavior |
|----------|-------------------|
| Add product with quantity 0 | `400` — quantity must be ≥ 1 |
| Add product with quantity 6 | `400` — quantity must be ≤ 5 |
| Add product with quantity -1 | `400` — quantity must be ≥ 1 |
| Add 3 then add 3 of same product | Second call returns `400` (total would be 6) |
| Add 3 then PUT to 5 on same product | `200` — quantity is now 5 (PUT is absolute) |
| PUT quantity 0 | `400` — use DELETE to remove |
| PUT on item not in cart | `404` |
| PUT on item in cart to same quantity | `200` — idempotent, no error |
| DELETE item not in cart | `404` |
| DELETE /api/cart when already empty | `204` — idempotent |
| POST with non-existent productId | `404` |
| POST with missing body fields | `400` — validation problem |
| GET when cart is empty | `200` with `[]` |
| Add product, then product catalog price changes | Cart retains original snapshot price |

---

## Implementation Notes

- The backend uses an in-memory cart (singleton `InMemoryCartService`). Cart state does not persist across server restarts.
- `CartItem.TotalPrice` is a computed property (`get` only) — it must not have a setter or be accepted as input during deserialization.
- The `ICartService` interface needs an `Update(int productId, int quantity)` method (or equivalent) to support the PUT endpoint. It should return the updated `CartItem` or `null` if not found.
- CORS is configured to allow the Vite dev server origin (`http://localhost:5173`).
- All cart service methods that mutate state should use locking (e.g., `lock` statement or `ConcurrentDictionary`) for thread safety.
- The PUT endpoint requires a new request record: `UpdateCartItemRequest(int Quantity)`.
