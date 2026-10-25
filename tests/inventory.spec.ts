import { expect, test } from '../src/fixtures';
import { ALL_PRODUCTS, PRODUCTS } from '../src/data/products';
import type { SortOption } from '../src/pages/InventoryPage';

test.describe('Product list', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  test('shows the full catalogue with names and prices @smoke', async ({ inventoryPage }) => {
    await expect(inventoryPage.items).toHaveCount(ALL_PRODUCTS.length);
    expect((await inventoryPage.names()).sort()).toEqual(ALL_PRODUCTS.map((p) => p.name).sort());
    expect((await inventoryPage.prices()).sort()).toEqual(ALL_PRODUCTS.map((p) => p.price).sort());
  });

  test('every product has its own image', async ({ inventoryPage }) => {
    const sources = await inventoryPage.itemImages.evaluateAll((imgs) =>
      imgs.map((img) => (img as HTMLImageElement).src),
    );
    expect(new Set(sources).size).toBe(ALL_PRODUCTS.length);
  });

  // Expected orders come from the catalogue data, not from re-sorting what the page shows
  const names = ALL_PRODUCTS.map((p) => p.name).sort((a, b) => a.localeCompare(b));
  const prices = ALL_PRODUCTS.map((p) => p.price).sort((a, b) => a - b);
  const sorts: {
    option: SortOption;
    label: string;
    field: 'names' | 'prices';
    expected: (string | number)[];
  }[] = [
    { option: 'az', label: 'name A to Z', field: 'names', expected: names },
    { option: 'za', label: 'name Z to A', field: 'names', expected: [...names].reverse() },
    { option: 'lohi', label: 'price low to high', field: 'prices', expected: prices },
    { option: 'hilo', label: 'price high to low', field: 'prices', expected: [...prices].reverse() },
  ];

  for (const { option, label, field, expected } of sorts) {
    test(`sorts by ${label}`, async ({ inventoryPage }) => {
      await inventoryPage.sortBy(option);
      await expect(inventoryPage.sortSelect).toHaveValue(option);
      expect(field === 'names' ? await inventoryPage.names() : await inventoryPage.prices()).toEqual(
        expected,
      );
    });
  }

  test('opens a product page with matching details', async ({ inventoryPage, productPage }) => {
    const product = PRODUCTS.fleeceJacket;
    await inventoryPage.openProduct(product);

    await productPage.expectLoaded();
    await expect(productPage.name).toHaveText(product.name);
    await expect(productPage.price).toHaveText(`$${product.price}`);
    await expect(productPage.description).not.toBeEmpty();

    await productPage.backButton.click();
    await inventoryPage.expectLoaded();
  });
});
