using Microsoft.AspNetCore.Http.HttpResults;
using MockEcommerce.Api.Models;
using MockEcommerce.Api.Services;

namespace MockEcommerce.Api.Endpoints;

/// <summary>
/// Maps shopping cart endpoints under <c>/api/cart</c>.
/// </summary>
public static class CartEndpoints
{
    /// <summary>Registers cart-related routes on the given endpoint route builder.</summary>
    public static void MapCartEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("api/cart")
            .WithTags("Cart");

        group.MapGet("/", GetCart)
            .WithName("GetCart")
            .WithSummary("Returns all items currently in the cart.");

        group.MapPost("/", AddToCart)
            .WithName("AddToCart")
            .WithSummary("Adds a product to the cart or increments quantity if already present.");

        group.MapPut("/{productId:int}", UpdateCartItem)
            .WithName("UpdateCartItem")
            .WithSummary("Updates the quantity of an item already in the cart.");

        group.MapDelete("/{productId:int}", RemoveFromCart)
            .WithName("RemoveFromCart")
            .WithSummary("Removes a single product from the cart by its product ID.");

        group.MapDelete("/", ClearCart)
            .WithName("ClearCart")
            .WithSummary("Removes all items from the cart.");
    }

    /// <summary>Returns all items currently in the cart.</summary>
    internal static Ok<IEnumerable<CartItem>> GetCart(ICartService cartService)
    {
        return TypedResults.Ok(cartService.GetAll());
    }

    /// <summary>Adds a product to the cart or increments quantity if already present.</summary>
    internal static Results<Created<CartItem>, Ok<CartItem>, NotFound<string>, ValidationProblem> AddToCart(
        AddToCartRequest request,
        IProductService productService,
        ICartService cartService)
    {
        if (request.Quantity <= 0 || request.Quantity > 5)
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                { "quantity", ["Quantity must be between 1 and 5."] }
            });
        }

        var product = productService.GetById(request.ProductId);
        if (product == null)
        {
            return TypedResults.NotFound($"Product with ID {request.ProductId} not found.");
        }

        var existing = cartService.GetByProductId(request.ProductId);
        if (existing != null)
        {
            if (existing.Quantity + request.Quantity > 5)
            {
                return TypedResults.ValidationProblem(new Dictionary<string, string[]>
                {
                    { "quantity", [$"Cannot add {request.Quantity} units. Product {request.ProductId} already has {existing.Quantity} in cart. Maximum is 5."] }
                });
            }

            var updated = cartService.Add(new CartItem
            {
                ProductId = request.ProductId,
                ProductName = product.Name,
                UnitPrice = product.Price,
                Quantity = request.Quantity
            });
            return TypedResults.Ok(updated);
        }
        else
        {
            var item = new CartItem
            {
                ProductId = request.ProductId,
                ProductName = product.Name,
                UnitPrice = product.Price,
                Quantity = request.Quantity
            };
            var added = cartService.Add(item);
            return TypedResults.Created("/api/cart", added);
        }
    }

    /// <summary>Updates the quantity of an item already in the cart.</summary>
    internal static Results<Ok<CartItem>, NotFound, ValidationProblem> UpdateCartItem(
        int productId,
        UpdateCartItemRequest request,
        ICartService cartService)
    {
        if (request.Quantity <= 0 || request.Quantity > 5)
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                { "quantity", ["Quantity must be between 1 and 5."] }
            });
        }

        var updated = cartService.Update(productId, request.Quantity);
        if (updated == null)
        {
            return TypedResults.NotFound();
        }
        return TypedResults.Ok(updated);
    }

    /// <summary>Removes a single product from the cart by its product ID.</summary>
    internal static Results<NoContent, NotFound> RemoveFromCart(int productId, ICartService cartService)
    {
        if (!cartService.Remove(productId))
        {
            return TypedResults.NotFound();
        }
        return TypedResults.NoContent();
    }

    /// <summary>Removes all items from the cart.</summary>
    internal static NoContent ClearCart(ICartService cartService)
    {
        cartService.Clear();
        return TypedResults.NoContent();
    }
}

/// <summary>Request body for adding a product to the cart.</summary>
public record AddToCartRequest(int ProductId, int Quantity);

/// <summary>Request body for updating the quantity of a cart item.</summary>
public record UpdateCartItemRequest(int Quantity);

