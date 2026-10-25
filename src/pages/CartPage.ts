import { expect, type Locator, type Page } from '@playwright/test';
import { Header } from '../components/Header';
import type { Product } from '../data/products';

export class CartPage {
  readonly header: Header;
  readonly title: Locator;
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(private readonly page: Page) {
    this.header = new Header(page);
    this.title = page.getByTestId('title');
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.checkoutButton = page.getByTestId('checkout');
    this.continueShoppingButton = page.getByTestId('continue-shopping');
  }

  async goto(): Promise<void> {
    await this.page.goto('/cart.html');
    await expect(this.title).toHaveText('Your Cart');
  }

  async remove(product: Product): Promise<void> {
    await this.page.getByTestId(`remove-${product.id}`).click();
  }

  async expectProducts(products: Product[]): Promise<void> {
    await expect(this.itemNames).toHaveText(products.map((p) => p.name));
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
