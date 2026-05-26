using MockEcommerce.Api.Models;
using MockEcommerce.Api.Services;

namespace MockEcommerce.Api.Tests.Services;

public class InMemoryCartServiceTests
{
    private InMemoryCartService CreateService() => new();

    [Fact]
    public void GetAll_WhenEmpty_ReturnsEmptyCollection()
    {
        var service = CreateService();

        var items = service.GetAll().ToList();

        Assert.Empty(items);
    }

    [Fact]
    public void Add_NewItem_ReturnsAddedItem()
    {
        var service = CreateService();
        var item = new CartItem { ProductId = 1, ProductName = "Test", UnitPrice = 10m, Quantity = 2 };

        var result = service.Add(item);

        Assert.Equal(1, result.ProductId);
        Assert.Equal(2, result.Quantity);
    }

    [Fact]
    public void Add_ExistingItem_IncrementsQuantity()
    {
        var service = CreateService();
        service.Add(new CartItem { ProductId = 1, ProductName = "Test", UnitPrice = 10m, Quantity = 2 });

        var result = service.Add(new CartItem { ProductId = 1, ProductName = "Test", UnitPrice = 10m, Quantity = 1 });

        Assert.Equal(3, result.Quantity);
    }

    [Fact]
    public void GetByProductId_WhenItemExists_ReturnsItem()
    {
        var service = CreateService();
        service.Add(new CartItem { ProductId = 1, ProductName = "Test", UnitPrice = 10m, Quantity = 1 });

        var result = service.GetByProductId(1);

        Assert.NotNull(result);
        Assert.Equal(1, result.ProductId);
    }

    [Fact]
    public void GetByProductId_WhenItemNotFound_ReturnsNull()
    {
        var service = CreateService();

        var result = service.GetByProductId(999);

        Assert.Null(result);
    }

    [Fact]
    public void Update_ExistingItem_ReturnsUpdatedItem()
    {
        var service = CreateService();
        service.Add(new CartItem { ProductId = 1, ProductName = "Test", UnitPrice = 10m, Quantity = 1 });

        var result = service.Update(1, 5);

        Assert.NotNull(result);
        Assert.Equal(5, result.Quantity);
    }

    [Fact]
    public void Update_NonExistentItem_ReturnsNull()
    {
        var service = CreateService();

        var result = service.Update(999, 3);

        Assert.Null(result);
    }

    [Fact]
    public void Remove_ExistingItem_ReturnsTrueAndRemovesItem()
    {
        var service = CreateService();
        service.Add(new CartItem { ProductId = 1, ProductName = "Test", UnitPrice = 10m, Quantity = 1 });

        var result = service.Remove(1);

        Assert.True(result);
        Assert.Empty(service.GetAll());
    }

    [Fact]
    public void Remove_NonExistentItem_ReturnsFalse()
    {
        var service = CreateService();

        var result = service.Remove(999);

        Assert.False(result);
    }

    [Fact]
    public void Clear_RemovesAllItems()
    {
        var service = CreateService();
        service.Add(new CartItem { ProductId = 1, ProductName = "Test", UnitPrice = 10m, Quantity = 1 });
        service.Add(new CartItem { ProductId = 2, ProductName = "Test2", UnitPrice = 20m, Quantity = 2 });

        service.Clear();

        Assert.Empty(service.GetAll());
    }

    [Fact]
    public void GetAll_ReturnsAllItems()
    {
        var service = CreateService();
        service.Add(new CartItem { ProductId = 1, ProductName = "Test1", UnitPrice = 10m, Quantity = 1 });
        service.Add(new CartItem { ProductId = 2, ProductName = "Test2", UnitPrice = 20m, Quantity = 2 });

        var items = service.GetAll().ToList();

        Assert.Equal(2, items.Count);
    }
}
