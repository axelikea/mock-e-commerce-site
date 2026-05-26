---
applyTo: "src/frontend/**,test/frontend/**"
---

# Frontend Instructions

## Stack & Versions

- **React 19** with functional components and hooks only — no class components
- **TypeScript ~6.0** in strict mode (`"strict": true` in tsconfig)
- **Vite 8** as dev server and bundler
- **Vitest 4** + **Testing Library** (React, user-event, jest-dom) for tests

## Key File Locations

| Path | Purpose |
|------|---------|
| `src/frontend/src/App.tsx` | Root component — orchestrates product listing and cart notifications |
| `src/frontend/src/api/index.ts` | All `fetch` calls — `fetchProducts()`, `fetchProductById()`, `addToCart()` |
| `src/frontend/src/hooks/useProducts.ts` | Custom hook returning `{ products, loading, error }` |
| `src/frontend/src/types/index.ts` | `Product` and `AddToCartRequest` interfaces |
| `src/frontend/src/components/Header/` | Displays shop name and cart item count |
| `src/frontend/src/components/HeroBanner/` | Static hero section |
| `src/frontend/src/components/ProductCard/ProductCard.tsx` | Card with add-to-cart button; disabled when `product.stock === 0` |
| `src/frontend/src/components/ProductList/` | Renders a grid of `ProductCard` components |
| `src/frontend/src/test-setup.ts` | Vitest global setup (imported via `vitest.config.ts`) |
| `test/frontend/App.test.tsx` | Integration-style tests for the root `App` component |
| `test/frontend/components/` | Component-level tests |

## Testing

Tests live in `test/frontend/` (not inside `src/frontend/`). They are discovered by the **root** `vitest.config.ts`.

```bash
# Run all frontend tests (from repo root)
npm test

# Run with coverage
npx vitest run --coverage
```

**Import paths in test files** must be relative to the test file location, e.g.:
```ts
import { App } from '../../src/frontend/src/App';
import type { Product } from '../../src/frontend/src/types';
```

**Mocking pattern** used in tests:
```ts
vi.mock('../../src/frontend/src/hooks/useProducts');
import { useProducts } from '../../src/frontend/src/hooks/useProducts';
const mockedUseProducts = vi.mocked(useProducts);
mockedUseProducts.mockReturnValue({ products: [], loading: false, error: null });
```

Always call `vi.restoreAllMocks()` in `afterEach`.

## Linting

```bash
cd src/frontend && npm run lint
```

ESLint config is at `src/frontend/eslint.config.js`. Applies to all `**/*.{ts,tsx}` files. Key plugins: `typescript-eslint`, `react-hooks`, `react-refresh`.

## Conventions

- Components are co-located with an `index.ts` re-export (barrel file).
- CSS uses BEM-style class names (`product-card__button`, `app__notification`).
- API base URL is always `/api` (proxied by Vite in dev to avoid CORS issues).
- Cart state (item count, notification message) is managed locally in `App.tsx` with `useState`.
- Notification auto-clears after 3 000 ms using a `useRef<ReturnType<typeof setTimeout>>` ref to avoid stale closure bugs.
- The add-to-cart button `aria-label` follows: `Add ${product.name} to cart` (used in tests to query buttons).

## `Product` Interface

```ts
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
}
```
