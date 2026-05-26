# Copilot Instructions — mock-e-commerce-site

## Project Overview

This is a mock e-commerce application built for educational purposes. It consists of a React/TypeScript frontend and an ASP.NET Core (.NET 10) backend. The core teaching goal is for students to implement the shopping cart feature, which is intentionally left incomplete.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript ~6.0, Vite 8 |
| Frontend testing | Vitest 4, Testing Library (React, user-event, jest-dom) |
| Frontend linting | ESLint 9 with typescript-eslint, react-hooks, react-refresh plugins |
| Backend | .NET 10, ASP.NET Core Minimal APIs |
| Backend testing | xUnit 2.9, Microsoft.AspNetCore.Mvc.Testing 10 |
| Package management | npm workspaces (root + `src/frontend`) |

## Repository Layout

```
/
├── .github/
│   ├── CODEOWNERS
│   └── instructions/           # path-specific Copilot instructions
├── src/
│   ├── frontend/               # npm workspace "frontend" — React/TS Vite app
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── eslint.config.js
│   │   ├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
│   │   └── src/
│   │       ├── App.tsx                    # root component
│   │       ├── App.css
│   │       ├── main.tsx
│   │       ├── index.css
│   │       ├── test-setup.ts              # Vitest global setup
│   │       ├── api/index.ts               # fetch wrappers (BASE_URL = '/api')
│   │       ├── hooks/useProducts.ts       # data-fetching hook
│   │       ├── types/index.ts             # Product, AddToCartRequest interfaces
│   │       └── components/
│   │           ├── Header/
│   │           ├── HeroBanner/
│   │           ├── ProductCard/ProductCard.tsx
│   │           └── ProductList/
│   └── backend/
│       ├── MockEcommerce.slnx             # solution file
│       └── MockEcommerce.Api/             # .NET 10 web project
│           ├── MockEcommerce.Api.csproj
│           ├── Program.cs                 # service registration, CORS, endpoint mapping
│           ├── appsettings.json / appsettings.Development.json
│           ├── Endpoints/
│           │   ├── ProductEndpoints.cs    # ✅ fully implemented
│           │   └── CartEndpoints.cs       # ❌ all methods throw NotImplementedException
│           ├── Services/
│           │   ├── IProductService.cs
│           │   ├── MockProductService.cs  # ✅ fully implemented — 5 hardcoded products
│           │   ├── ICartService.cs
│           │   └── InMemoryCartService.cs # ❌ all methods throw NotImplementedException
│           └── Models/
│               ├── Product.cs
│               └── CartItem.cs
├── test/
│   ├── frontend/               # Vitest tests (discovered by root vitest.config.ts)
│   │   ├── App.test.tsx
│   │   └── components/
│   │       ├── Header/
│   │       ├── HeroBanner/
│   │       ├── ProductCard/
│   │       └── ProductList/
│   └── backend/
│       └── MockEcommerce.Api.Tests/       # xUnit integration test project
│           ├── MockEcommerce.Api.Tests.csproj
│           ├── Endpoints/ProductEndpointTests.cs
│           └── Services/MockProductServiceTests.cs
├── package.json                # root — workspaces config, `npm test` runs vitest
├── vitest.config.ts            # test env: jsdom, includes test/frontend/**/*.{test,spec}.{ts,tsx}
└── tsconfig.json               # root TS config (covers test/frontend + src/frontend/src)
```

## Build & Test Commands

### Frontend

```bash
# Install dependencies (always run after cloning or changing package.json)
npm install

# Run all frontend tests (from repo root)
npm test
# or
npm run test:frontend

# Run frontend dev server (http://localhost:5173)
cd src/frontend && npm run dev

# Build for production
cd src/frontend && npm run build

# Lint
cd src/frontend && npm run lint
```

### Backend

```bash
# Run backend dev server (from repo root)
dotnet run --project src/backend/MockEcommerce.Api

# Run all backend tests (from repo root)
dotnet test test/backend/MockEcommerce.Api.Tests/

# Build backend
dotnet build src/backend/MockEcommerce.slnx
```

## Implementation State

The **product catalog** is fully implemented end-to-end. The **shopping cart** is the intentional student exercise — do not treat `NotImplementedException` as a bug.

| Feature | Status |
|---------|--------|
| `GET /api/products` | ✅ Implemented |
| `GET /api/products/{id}` | ✅ Implemented |
| `MockProductService` | ✅ Implemented |
| `GET /api/cart` | ❌ `NotImplementedException` |
| `POST /api/cart` | ❌ `NotImplementedException` |
| `DELETE /api/cart/{productId}` | ❌ `NotImplementedException` |
| `DELETE /api/cart` | ❌ `NotImplementedException` |
| `InMemoryCartService` (all methods) | ❌ `NotImplementedException` |
| React frontend (product listing + cart UI) | ✅ Implemented |

## Product Data

`MockProductService` returns these 5 hardcoded products (IDs 1–5):

| ID | Name | Price | Category | Stock |
|----|------|-------|----------|-------|
| 1 | Wireless Headphones | $79.99 | Electronics | 25 |
| 2 | Running Shoes | $59.99 | Footwear | 40 |
| 3 | Stainless Steel Water Bottle | $24.99 | Accessories | 100 |
| 4 | Mechanical Keyboard | $109.99 | Electronics | 15 |
| 5 | Yoga Mat | $34.99 | Sports | 60 |

## Architecture Notes

- The frontend API client (`src/frontend/src/api/index.ts`) calls all endpoints under `BASE_URL = '/api'`.
- CORS in `Program.cs` allows origin `http://localhost:5173` (Vite dev server).
- Services are registered as singletons in `Program.cs`: `IProductService → MockProductService`, `ICartService → InMemoryCartService`.
- Frontend tests live outside the `src/frontend` directory; they are discovered by the root `vitest.config.ts`. Import paths in test files use `../../src/frontend/src/...`.
- Backend integration tests use `WebApplicationFactory<Program>` — `Program` is declared as `public partial class` in `Program.cs` to enable this.
- `CartItem.TotalPrice` is a computed property (`UnitPrice × Quantity`); do not serialize a setter for it.
