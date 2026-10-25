import { expect, type Locator, type Page } from '@playwright/test';
import { Header } from '../components/Header';

/** Single product view (inventory-item.html?id=…) */
export class ProductPage {
  readonly header: Header;
  readonly name: Locator;
  readonly description: Locator;
  readonly price: Locator;
  readonly addButton: Locator;
  readonly removeButton: Locator;
  readonly backButton: Locator;

  constructor(private readonly page: Page) {
    this.header = new Header(page);
    this.name = page.getByTestId('inventory-item-name');
    this.description = page.getByTestId('inventory-item-desc');
    this.price = page.getByTestId('inventory-item-price');
    this.addButton = page.getByTestId('add-to-cart');
    this.removeButton = page.getByTestId('remove');
    this.backButton = page.getByTestId('back-to-products');
  }

  /** The page is a client-side view: wait for it to replace the list before reading it */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/inventory-item\.html\?id=\d+/);
    await expect(this.backButton).toBeVisible();
  }
}
