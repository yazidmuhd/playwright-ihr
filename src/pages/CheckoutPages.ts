import { expect, type Locator, type Page } from '@playwright/test';
import { parsePrice } from '../utils/money';

/** Step one: customer details (checkout-step-one.html) */
export class CheckoutInfoPage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.cancelButton = page.getByTestId('cancel');
    this.error = page.getByTestId('error');
  }

  async enterDetails(customer: { firstName: string; lastName: string; postalCode: string }): Promise<void> {
    await this.firstName.fill(customer.firstName);
    await this.lastName.fill(customer.lastName);
    await this.postalCode.fill(customer.postalCode);
  }

  async submit(customer: { firstName: string; lastName: string; postalCode: string }): Promise<void> {
    await this.enterDetails(customer);
    await this.continueButton.click();
  }
}

/** Step two: order summary with totals (checkout-step-two.html) */
export class CheckoutOverviewPage {
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly subtotal: Locator;
  readonly tax: Locator;
  readonly total: Locator;
  readonly finishButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.subtotal = page.getByTestId('subtotal-label');
    this.tax = page.getByTestId('tax-label');
    this.total = page.getByTestId('total-label');
    this.finishButton = page.getByTestId('finish');
    this.cancelButton = page.getByTestId('cancel');
  }

  async amounts(): Promise<{ subtotal: number; tax: number; total: number }> {
    await expect(this.total).toBeVisible();
    return {
      subtotal: parsePrice(await this.subtotal.innerText()),
      tax: parsePrice(await this.tax.innerText()),
      total: parsePrice(await this.total.innerText()),
    };
  }
}

/** Confirmation (checkout-complete.html) */
export class CheckoutCompletePage {
  readonly header: Locator;
  readonly backHomeButton: Locator;

  constructor(page: Page) {
    this.header = page.getByTestId('complete-header');
    this.backHomeButton = page.getByTestId('back-to-products');
  }
}
