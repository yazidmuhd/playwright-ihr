import { test as setup } from '../src/fixtures';
import { STORAGE_STATE, USERS } from '../src/data/users';

// Runs once before the browser projects: sign in through the UI and save the session,
// so the other tests skip the login form and stay fast and independent.
setup('sign in as standard_user', async ({ page, loginPage, inventoryPage }) => {
  await loginPage.goto();
  await loginPage.login(USERS.standard);
  await inventoryPage.expectLoaded();
  await page.context().storageState({ path: STORAGE_STATE });
});
