import { expect, test } from '../src/fixtures';
import { PRODUCTS } from '../src/data/products';

test.describe('Cart', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  test('adding and removing products updates the badge and buttons @smoke', async ({ inventoryPage }) => {
    const { backpack, onesie } = PRODUCTS;

    await inventoryPage.add(backpack, onesie);
    await inventoryPage.header.expectCartCount(2);
    await expect(inventoryPage.removeButton(backpack)).toBeVisible();

    await inventoryPage.remove(backpack);
    await inventoryPage.header.expectCartCount(1);
    await expect(inventoryPage.addButton(backpack)).toBeVisible();
  });

  test('cart lists the chosen products in the order they were added', async ({ inventoryPage, cartPage }) => {
    const chosen = [PRODUCTS.bikeLight, PRODUCTS.redTShirt, PRODUCTS.fleeceJacket];

    await inventoryPage.add(...chosen);
    await inventoryPage.header.openCart();

    await cartPage.expectProducts(chosen);
  });

  test('cart survives navigating away and reloading', async ({
    page,
    inventoryPage,
    productPage,
    cartPage,
  }) => {
    await inventoryPage.add(PRODUCTS.backpack);
    await inventoryPage.openProduct(PRODUCTS.onesie);
    await productPage.expectLoaded();
    await productPage.addButton.click();
    await page.reload();

    await productPage.header.expectCartCount(2);
    await cartPage.goto();
    await cartPage.expectProducts([PRODUCTS.backpack, PRODUCTS.onesie]);
  });

  test('removing an item from the cart page', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.add(PRODUCTS.backpack, PRODUCTS.bikeLight);
    await cartPage.goto();

    await cartPage.remove(PRODUCTS.backpack);

    await cartPage.expectProducts([PRODUCTS.bikeLight]);
    await cartPage.header.expectCartCount(1);
  });

  test('continue shopping returns to the product list', async ({ cartPage, inventoryPage }) => {
    await cartPage.goto();
    await cartPage.continueShoppingButton.click();
    await inventoryPage.expectLoaded();
  });

  test('reset app state empties the cart', async ({ inventoryPage }) => {
    await inventoryPage.add(PRODUCTS.backpack, PRODUCTS.onesie);
    await inventoryPage.header.resetAppState();
    await inventoryPage.header.expectCartCount(0);
  });
});
