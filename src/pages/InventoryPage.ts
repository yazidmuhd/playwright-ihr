import { expect, type Locator, type Page } from '@playwright/test';
import { Header } from '../components/Header';
import type { Product } from '../data/products';
import { parsePrice } from '../utils/money';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

export class InventoryPage {
  readonly header: Header;
  readonly title: Locator;
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly itemImages: Locator;
  readonly sortSelect: Locator;

  constructor(private readonly page: Page) {
    this.header = new Header(page);
    this.title = page.getByTestId('title');
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.itemImages = this.items.locator('img.inventory_item_img');
    this.sortSelect = page.getByTestId('product-sort-container');
  }

  async goto(): Promise<void> {
    await this.page.goto('/inventory.html');
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/inventory\.html$/);
    await expect(this.title).toHaveText('Products');
  }

  addButton(product: Product): Locator {
    return this.page.getByTestId(`add-to-cart-${product.id}`);
  }

  removeButton(product: Product): Locator {
    return this.page.getByTestId(`remove-${product.id}`);
  }

  async add(...products: Product[]): Promise<void> {
    for (const product of products) await this.addButton(product).click();
  }

  async remove(...products: Product[]): Promise<void> {
    for (const product of products) await this.removeButton(product).click();
  }

  async openProduct(product: Product): Promise<void> {
    await this.itemNames.filter({ hasText: product.name }).click();
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortSelect.selectOption(option);
  }

  async names(): Promise<string[]> {
    return this.itemNames.allTextContents();
  }

  async prices(): Promise<number[]> {
    return (await this.itemPrices.allTextContents()).map(parsePrice);
  }
}
