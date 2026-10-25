import { expect, test } from '../src/fixtures';
import { CUSTOMER, PRODUCTS, TAX_RATE } from '../src/data/products';
import { roundCents } from '../src/utils/money';

test.describe('Checkout', () => {
  test('completes a purchase end to end with correct totals @smoke', async ({
    page,
    inventoryPage,
    cartPage,
    checkoutInfoPage,
    checkoutOverviewPage,
    checkoutCompletePage,
  }) => {
    const order = [PRODUCTS.backpack, PRODUCTS.boltTShirt, PRODUCTS.onesie];
    const subtotal = roundCents(order.reduce((sum, p) => sum + p.price, 0));
    const tax = roundCents(subtotal * TAX_RATE);

    await test.step('add products and open the cart', async () => {
      await inventoryPage.goto();
      await inventoryPage.add(...order);
      await inventoryPage.header.openCart();
      await cartPage.expectProducts(order);
    });

    await test.step('enter customer details', async () => {
      await cartPage.checkout();
      await expect(page).toHaveURL(/checkout-step-one\.html$/);
      await checkoutInfoPage.submit(CUSTOMER);
    });

    await test.step('check the order summary', async () => {
      await expect(page).toHaveURL(/checkout-step-two\.html$/);
      await expect(checkoutOverviewPage.itemNames).toHaveText(order.map((p) => p.name));
      expect(await checkoutOverviewPage.amounts()).toEqual({
        subtotal,
        tax,
        total: roundCents(subtotal + tax),
      });
    });

    await test.step('finish and see the confirmation', async () => {
      await checkoutOverviewPage.finishButton.click();
      await expect(checkoutCompletePage.header).toHaveText('Thank you for your order!');
      await inventoryPage.header.expectCartCount(0);

      await checkoutCompletePage.backHomeButton.click();
      await inventoryPage.expectLoaded();
    });
  });

  test.describe('customer details form', () => {
    test.beforeEach(async ({ inventoryPage, cartPage }) => {
      await inventoryPage.goto();
      await inventoryPage.add(PRODUCTS.bikeLight);
      await cartPage.goto();
      await cartPage.checkout();
    });

    const missing = [
      {
        field: 'first name',
        customer: { ...CUSTOMER, firstName: '' },
        error: 'Error: First Name is required',
      },
      { field: 'last name', customer: { ...CUSTOMER, lastName: '' }, error: 'Error: Last Name is required' },
      {
        field: 'postal code',
        customer: { ...CUSTOMER, postalCode: '' },
        error: 'Error: Postal Code is required',
      },
    ];

    for (const { field, customer, error } of missing) {
      test(`requires the ${field}`, async ({ page, checkoutInfoPage }) => {
        await checkoutInfoPage.submit(customer);
        await expect(checkoutInfoPage.error).toHaveText(error);
        await expect(page).toHaveURL(/checkout-step-one\.html$/);
      });
    }

    test('cancel goes back to the cart and keeps its contents', async ({ checkoutInfoPage, cartPage }) => {
      await checkoutInfoPage.cancelButton.click();
      await expect(cartPage.title).toHaveText('Your Cart');
      await cartPage.expectProducts([PRODUCTS.bikeLight]);
    });
  });

  test('cancelling on the summary page keeps the cart', async ({
    inventoryPage,
    cartPage,
    checkoutInfoPage,
    checkoutOverviewPage,
  }) => {
    await inventoryPage.goto();
    await inventoryPage.add(PRODUCTS.onesie);
    await cartPage.goto();
    await cartPage.checkout();
    await checkoutInfoPage.submit(CUSTOMER);

    await checkoutOverviewPage.cancelButton.click();

    await inventoryPage.expectLoaded();
    await inventoryPage.header.expectCartCount(1);
  });
});
