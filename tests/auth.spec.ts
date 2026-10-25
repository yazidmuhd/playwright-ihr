import { expect, SIGNED_OUT, test } from '../src/fixtures';
import { PASSWORD, USERS } from '../src/data/users';

test.use({ storageState: SIGNED_OUT });

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('standard user signs in and lands on the product list @smoke', async ({
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.login(USERS.standard);
    await inventoryPage.expectLoaded();
    await expect(inventoryPage.items).toHaveCount(6);
  });

  test('locked-out user is refused with a clear message', async ({ page, loginPage }) => {
    await loginPage.login(USERS.lockedOut);
    await loginPage.expectError('Epic sadface: Sorry, this user has been locked out.');
    await expect(page).toHaveURL('/');
  });

  const invalid = [
    {
      case: 'wrong password',
      username: USERS.standard,
      password: 'not_the_password',
      error: 'Epic sadface: Username and password do not match any user in this service',
    },
    {
      case: 'unknown user',
      username: 'nobody',
      password: PASSWORD,
      error: 'Epic sadface: Username and password do not match any user in this service',
    },
    { case: 'empty username', username: '', password: PASSWORD, error: 'Epic sadface: Username is required' },
    {
      case: 'empty password',
      username: USERS.standard,
      password: '',
      error: 'Epic sadface: Password is required',
    },
  ];

  for (const { case: name, username, password, error } of invalid) {
    test(`shows an error for ${name}`, async ({ loginPage }) => {
      await loginPage.login(username, password);
      await loginPage.expectError(error);
    });
  }

  test('error message can be dismissed', async ({ page, loginPage }) => {
    await loginPage.login('', '');
    await expect(loginPage.error).toBeVisible();
    await page.getByTestId('error-button').click();
    await expect(loginPage.error).toBeHidden();
  });

  test('password field hides what is typed', async ({ loginPage }) => {
    await expect(loginPage.password).toHaveAttribute('type', 'password');
  });
});

test.describe('Session', () => {
  test('signed-out visitors cannot open the product list', async ({ page, loginPage }) => {
    await page.goto('/inventory.html');
    await expect(page).toHaveURL('/');
    await loginPage.expectError(
      "Epic sadface: You can only access '/inventory.html' when you are logged in.",
    );
  });

  test('logout returns to the login page and ends the session @smoke', async ({
    page,
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.goto();
    await loginPage.login(USERS.standard);
    await inventoryPage.header.logout();

    await expect(loginPage.loginButton).toBeVisible();
    await page.goto('/inventory.html');
    await expect(page).toHaveURL('/');
  });
});
