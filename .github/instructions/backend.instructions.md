---
applyTo: "src/backend/**,test/backend/**"
---

# Backend Instructions

## Stack & Versions

- **.NET 10** (`net10.0` target framework)
- **ASP.NET Core Minimal APIs** — no controllers, no MVC
- **xUnit 2.9** + **Microsoft.AspNetCore.Mvc.Testing 10** for integration tests
- **coverlet** for coverage collection

## Key File Locations

| Path | Purpose |
|------|---------|
| `src/backend/MockEcommerce.slnx` | Solution file |
| `src/backend/MockEcommerce.Api/MockEcommerce.Api.csproj` | Web project (TargetFramework: net10.0) |
| `src/backend/MockEcommerce.Api/Program.cs` | App bootstrap — DI registration, CORS, endpoint mapping |
| `src/backend/MockEcommerce.Api/Endpoints/ProductEndpoints.cs` | ✅ Product routes under `/api/products` |
| `src/backend/MockEcommerce.Api/Endpoints/CartEndpoints.cs` | ❌ Cart routes under `/api/cart` — **all handlers throw NotImplementedException** |
| `src/backend/MockEcommerce.Api/Services/IProductService.cs` | Product service interface |
| `src/backend/MockEcommerce.Api/Services/MockProductService.cs` | ✅ Returns 5 hardcoded products |
| `src/backend/MockEcommerce.Api/Services/ICartService.cs` | Cart service interface |
| `src/backend/MockEcommerce.Api/Services/InMemoryCartService.cs` | ❌ Thread-safe list + Lock; **all methods throw NotImplementedException** |
| `src/backend/MockEcommerce.Api/Models/Product.cs` | `Product` model |
| `src/backend/MockEcommerce.Api/Models/CartItem.cs` | `CartItem` model — `TotalPrice` is a computed property (no setter) |
| `test/backend/MockEcommerce.Api.Tests/MockEcommerce.Api.Tests.csproj` | Test project (net10.0, xUnit) |
| `test/backend/MockEcommerce.Api.Tests/Endpoints/ProductEndpointTests.cs` | Integration tests for product endpoints |
| `test/backend/MockEcommerce.Api.Tests/Services/MockProductServiceTests.cs` | Unit tests for MockProductService |

## API Endpoints

| Method | Route | Status | Handler |
|--------|-------|--------|---------|
| GET | `/api/products` | ✅ | `ProductEndpoints.GetAll` |
| GET | `/api/products/{id:int}` | ✅ | `ProductEndpoints.GetById` |
| GET | `/api/cart` | ❌ NotImplementedException | `CartEndpoints.GetCart` |
| POST | `/api/cart` | ❌ NotImplementedException | `CartEndpoints.AddToCart` |
| DELETE | `/api/cart/{productId:int}` | ❌ NotImplementedException | `CartEndpoints.RemoveFromCart` |
| DELETE | `/api/cart` | ❌ NotImplementedException | `CartEndpoints.ClearCart` |

`CartEndpoints.AddToCart` request body is `AddToCartRequest(int ProductId, int Quantity)` (record, defined at the bottom of `CartEndpoints.cs`).

## Models

```csharp
// Product.cs
public class Product {
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public decimal Price { get; set; }       // USD
    public string Category { get; set; }
    public int Stock { get; set; }
    public string ImageUrl { get; set; }
}

// CartItem.cs
public class CartItem {
    public int ProductId { get; set; }
    public string ProductName { get; set; }  // snapshot at time of add
    public decimal UnitPrice { get; set; }   // snapshot at time of add
    public int Quantity { get; set; }
    public decimal TotalPrice => UnitPrice * Quantity;  // computed — no setter
}
```

## `ICartService` Interface

```csharp
IEnumerable<CartItem> GetAll();
CartItem Add(CartItem item);                  // adds or increments quantity
CartItem? GetByProductId(int productId);
bool Remove(int productId);                   // true if found and removed
void Clear();
```

`InMemoryCartService` has `private readonly List<CartItem> _cart = []` and `private readonly Lock _lock = new()` already declared — implement methods inside the existing class using these fields.

## Build & Test Commands

```bash
# Run all backend tests (from repo root)
dotnet test test/backend/MockEcommerce.Api.Tests/

# Run backend dev server (from repo root)
dotnet run --project src/backend/MockEcommerce.Api

# Build solution
dotnet build src/backend/MockEcommerce.slnx
```

## Testing Patterns

Integration tests use `WebApplicationFactory<Program>`:
```csharp
public class MyTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    public MyTests(WebApplicationFactory<Program> factory)
        => _client = factory.CreateClient();
}
```

`Program` is declared as `public partial class Program { }` at the bottom of `Program.cs` — this is required for `WebApplicationFactory` and must not be removed.

## DI & CORS

Services are registered as singletons in `Program.cs`:
- `IProductService → MockProductService`
- `ICartService → InMemoryCartService`

CORS allows `http://localhost:5173` (Vite dev server) with any header and method. The policy is applied globally via `app.UseCors()`.

## Conventions

- All endpoints use **typed results** (`TypedResults.Ok(...)`, `TypedResults.NotFound()`, etc.).
- Handler methods are `internal static` and are tested directly via `WebApplicationFactory`.
- Nullable reference types are enabled (`<Nullable>enable</Nullable>`).
- Implicit usings are enabled — no need to add `using System;` etc. manually.
- XML doc comments (`/// <summary>`) are used on public/internal members.
