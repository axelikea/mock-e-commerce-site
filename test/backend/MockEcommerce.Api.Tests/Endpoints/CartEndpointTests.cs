using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using MockEcommerce.Api.Endpoints;
using MockEcommerce.Api.Models;

namespace MockEcommerce.Api.Tests.Endpoints;

public class CartEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public CartEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    // Helper: clear cart between tests
    private async Task ClearCartAsync() => await _client.DeleteAsync("/api/cart");

    [Fact]
    public async Task GetCart_WhenEmpty_ReturnsOkWithEmptyArray()
    {
        await ClearCartAsync();
        var response = await _client.GetAsync("/api/cart");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var items = await response.Content.ReadFromJsonAsync<List<CartItem>>();
        Assert.NotNull(items);
        Assert.Empty(items);
    }

    [Fact]
    public async Task AddToCart_NewItem_Returns201WithCartItem()
    {
        await ClearCartAsync();
        var request = new AddToCartRequest(1, 2);

        var response = await _client.PostAsJsonAsync("/api/cart", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<CartItem>();
        Assert.NotNull(item);
        Assert.Equal(1, item.ProductId);
        Assert.Equal(2, item.Quantity);
        Assert.True(item.UnitPrice > 0);
    }

    [Fact]
    public async Task AddToCart_ExistingItem_Returns200AndIncrementsQuantity()
    {
        await ClearCartAsync();
        await _client.PostAsJsonAsync("/api/cart", new AddToCartRequest(1, 2));

        var response = await _client.PostAsJsonAsync("/api/cart", new AddToCartRequest(1, 1));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<CartItem>();
        Assert.NotNull(item);
        Assert.Equal(3, item.Quantity);
    }

    [Fact]
    public async Task AddToCart_QuantityZero_Returns400WithValidationProblem()
    {
        await ClearCartAsync();
        var response = await _client.PostAsJsonAsync("/api/cart", new AddToCartRequest(1, 0));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AddToCart_QuantityFive_Returns201()
    {
        await ClearCartAsync();
        var response = await _client.PostAsJsonAsync("/api/cart", new AddToCartRequest(2, 5));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<CartItem>();
        Assert.NotNull(item);
        Assert.Equal(5, item.Quantity);
    }

    [Fact]
    public async Task AddToCart_QuantitySix_Returns400()
    {
        await ClearCartAsync();
        var response = await _client.PostAsJsonAsync("/api/cart", new AddToCartRequest(1, 6));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AddToCart_ExceedingMaxWithIncrement_Returns400()
    {
        await ClearCartAsync();
        await _client.PostAsJsonAsync("/api/cart", new AddToCartRequest(1, 3));

        var response = await _client.PostAsJsonAsync("/api/cart", new AddToCartRequest(1, 3));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AddToCart_NonExistentProduct_Returns404()
    {
        await ClearCartAsync();
        var response = await _client.PostAsJsonAsync("/api/cart", new AddToCartRequest(9999, 1));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateCartItem_ExistingItem_Returns200WithUpdatedQuantity()
    {
        await ClearCartAsync();
        await _client.PostAsJsonAsync("/api/cart", new AddToCartRequest(1, 1));

        var response = await _client.PutAsJsonAsync("/api/cart/1", new UpdateCartItemRequest(4));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<CartItem>();
        Assert.NotNull(item);
        Assert.Equal(4, item.Quantity);
    }

    [Fact]
    public async Task UpdateCartItem_ItemNotInCart_Returns404()
    {
        await ClearCartAsync();

        var response = await _client.PutAsJsonAsync("/api/cart/1", new UpdateCartItemRequest(3));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateCartItem_QuantityZero_Returns400()
    {
        await ClearCartAsync();
        await _client.PostAsJsonAsync("/api/cart", new AddToCartRequest(1, 1));

        var response = await _client.PutAsJsonAsync("/api/cart/1", new UpdateCartItemRequest(0));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateCartItem_QuantityFive_Returns200()
    {
        await ClearCartAsync();
        await _client.PostAsJsonAsync("/api/cart", new AddToCartRequest(1, 1));

        var response = await _client.PutAsJsonAsync("/api/cart/1", new UpdateCartItemRequest(5));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<CartItem>();
        Assert.NotNull(item);
        Assert.Equal(5, item.Quantity);
    }

    [Fact]
    public async Task UpdateCartItem_QuantitySix_Returns400()
    {
        await ClearCartAsync();
        await _client.PostAsJsonAsync("/api/cart", new AddToCartRequest(1, 1));

        var response = await _client.PutAsJsonAsync("/api/cart/1", new UpdateCartItemRequest(6));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task RemoveFromCart_ExistingItem_Returns204()
    {
        await ClearCartAsync();
        await _client.PostAsJsonAsync("/api/cart", new AddToCartRequest(1, 1));

        var response = await _client.DeleteAsync("/api/cart/1");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task RemoveFromCart_NonExistentItem_Returns404()
    {
        await ClearCartAsync();

        var response = await _client.DeleteAsync("/api/cart/9999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ClearCart_Returns204()
    {
        await _client.PostAsJsonAsync("/api/cart", new AddToCartRequest(1, 1));

        var response = await _client.DeleteAsync("/api/cart");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task ClearCart_WhenAlreadyEmpty_Returns204()
    {
        await ClearCartAsync();

        var response = await _client.DeleteAsync("/api/cart");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task GetCart_AfterAddingItem_ReturnsItem()
    {
        await ClearCartAsync();
        await _client.PostAsJsonAsync("/api/cart", new AddToCartRequest(3, 2));

        var response = await _client.GetAsync("/api/cart");
        var items = await response.Content.ReadFromJsonAsync<List<CartItem>>();

        Assert.NotNull(items);
        Assert.Single(items);
        Assert.Equal(3, items[0].ProductId);
        Assert.Equal(2, items[0].Quantity);
    }

    [Fact]
    public async Task AddToCart_TotalPriceIsComputed()
    {
        await ClearCartAsync();
        var response = await _client.PostAsJsonAsync("/api/cart", new AddToCartRequest(1, 2));
        var item = await response.Content.ReadFromJsonAsync<CartItem>();

        Assert.NotNull(item);
        Assert.Equal(item.UnitPrice * item.Quantity, item.TotalPrice);
    }
}
