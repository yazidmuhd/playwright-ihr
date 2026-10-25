import { test as setup, expect } from '../src/fixtures';
import { HR, HR_STATE } from '../src/data/accounts';

// Runs once before the browser projects: sign the HR administrator in through the
// login form and save the session, so HR tests start signed in.
setup('sign in as the HR administrator', async ({ page, loginPage, hrDashboard }) => {
  await loginPage.goto();
  await loginPage.signIn(HR.username, HR.password);
  await expect(hrDashboard.heading).toBeVisible();
  await page.context().storageState({ path: HR_STATE });
});
