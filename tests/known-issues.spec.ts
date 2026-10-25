import { expect, SIGNED_OUT, test } from '../src/fixtures';
import { ALL_PRODUCTS, CUSTOMER, PRODUCTS } from '../src/data/products';
import { USERS, type Username } from '../src/data/users';

/**
 * saucedemo ships accounts with deliberate bugs. Each test below asserts the CORRECT
 * behaviour and is marked test.fail() with the defect it documents, so:
 *   - the suite stays green while the bug exists (reported as "expected to fail"), and
 *   - it turns red the day the bug is fixed, prompting removal of the marker.
 */
test.use({ storageState: SIGNED_OUT });

const signInAs = (username: Username) =>
  test.beforeEach(async ({ loginPage, inventoryPage }) => {
    await loginPage.goto();
    await loginPage.login(username);
    await inventoryPage.expectLoaded();
  });

function knownDefect(description: string) {
  test.info().annotations.push({ type: 'known defect', description });
  test.fail();
}

test.describe('problem_user', () => {
  signInAs(USERS.problem);

  test('every product has its own image', async ({ inventoryPage }) => {
    knownDefect('All products show the same placeholder image');
    const sources = await inventoryPage.itemImages.evaluateAll((imgs) =>
      imgs.map((img) => (img as HTMLImageElement).src),
    );
    expect(new Set(sources).size).toBe(ALL_PRODUCTS.length);
  });

  test('sorting Z to A reorders the list', async ({ inventoryPage }) => {
    knownDefect('Choosing "Name (Z to A)" leaves the list in its original order');
    await inventoryPage.sortBy('za');
    await expect(inventoryPage.itemNames.first()).toHaveText(PRODUCTS.redTShirt.name);
  });

  test('every product can be added to the cart', async ({ inventoryPage }) => {
    knownDefect('"Add to cart" does nothing for some products (e.g. Bolt T-Shirt)');
    await inventoryPage.add(PRODUCTS.backpack, PRODUCTS.boltTShirt);
    await inventoryPage.header.expectCartCount(2);
  });

  test('the last name field keeps what is typed', async ({ inventoryPage, cartPage, checkoutInfoPage }) => {
    knownDefect('Typing a last name overwrites the first name, so checkout cannot continue');
    await inventoryPage.add(PRODUCTS.backpack);
    await cartPage.goto();
    await cartPage.checkout();

    await checkoutInfoPage.enterDetails(CUSTOMER);

    await expect(checkoutInfoPage.firstName).toHaveValue(CUSTOMER.firstName);
    await expect(checkoutInfoPage.lastName).toHaveValue(CUSTOMER.lastName);
  });
});

test.describe('error_user', () => {
  signInAs(USERS.error);

  test('sorting works without an error popup', async ({ page, inventoryPage }) => {
    knownDefect('Sorting opens an alert "Sorting is broken!" and the order does not change');
    const dialogs: string[] = [];
    page.on('dialog', async (dialog) => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });

    await inventoryPage.sortBy('za');

    expect(dialogs).toEqual([]);
    await expect(inventoryPage.itemNames.first()).toHaveText(PRODUCTS.redTShirt.name);
  });

  test('a purchase can be completed', async ({
    inventoryPage,
    cartPage,
    checkoutInfoPage,
    checkoutOverviewPage,
    checkoutCompletePage,
  }) => {
    knownDefect('The Finish button does nothing, so the order is never placed');
    await inventoryPage.add(PRODUCTS.backpack);
    await cartPage.goto();
    await cartPage.checkout();
    await checkoutInfoPage.submit(CUSTOMER);

    await checkoutOverviewPage.finishButton.click();

    await expect(checkoutCompletePage.header).toHaveText('Thank you for your order!', { timeout: 3_000 });
  });
});
