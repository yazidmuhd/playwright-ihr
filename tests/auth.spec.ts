import { expect, test } from '../src/fixtures';
import { APPLICANT_PASSWORD, HR } from '../src/data/accounts';
import { applicantData } from '../src/data/testData';

test.describe('Sign in', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('HR administrator signs in to the HR console @smoke', async ({ page, loginPage, hrDashboard }) => {
    await loginPage.signIn(HR.username, HR.password);
    await expect(page).toHaveURL(/\/hr\/dashboard$/);
    await expect(hrDashboard.heading).toBeVisible();
  });

  test('a wrong password is refused', async ({ page, loginPage }) => {
    await loginPage.signIn(HR.username, 'not-the-password');
    await loginPage.expectError('These credentials do not match our records.');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('the password field hides what is typed', async ({ loginPage }) => {
    await expect(loginPage.password).toHaveAttribute('type', 'password');
  });
});

test.describe('Applicant registration', () => {
  test('a new applicant registers and reaches their dashboard @smoke', async ({
    page,
    registerPage,
    loginPage,
  }) => {
    const applicant = applicantData('Nur Aisyah');

    await registerPage.goto();
    await registerPage.register(applicant.name, applicant.email, APPLICANT_PASSWORD);
    await expect(registerPage.successHeading).toBeVisible();

    await registerPage.continueToLogin.click();
    await loginPage.signIn(applicant.email, APPLICANT_PASSWORD);

    await expect(page).toHaveURL(/\/applicant\/dashboard$/);
    await expect(page.getByRole('heading', { name: `Welcome back, ${applicant.name}!` })).toBeVisible();
  });

  const weakPasswords = [
    { password: 'Short1a', reason: 'shorter than 12 characters', error: /at least 12 characters/ },
    { password: 'alllowercase2026', reason: 'no capital letter', error: /uppercase and one lowercase/ },
    { password: 'No-Numbers-Here', reason: 'no number', error: /at least one number/ },
  ];

  for (const { password, reason, error } of weakPasswords) {
    test(`a weak password is refused: ${reason}`, async ({ registerPage }) => {
      const applicant = applicantData();
      await registerPage.goto();
      await registerPage.register(applicant.name, applicant.email, password);

      await registerPage.expectFieldError(error);
      await expect(registerPage.successHeading).toBeHidden();
    });
  }

  test('an e-mail address can only be registered once', async ({ registerPage, newApplicant }) => {
    const existing = await newApplicant();

    await registerPage.goto();
    await registerPage.register('Someone Else', existing.email, APPLICANT_PASSWORD);

    await registerPage.expectFieldError('The email has already been taken.');
  });

  test('the two passwords must match', async ({ registerPage }) => {
    const applicant = applicantData();
    await registerPage.goto();
    await registerPage.register(applicant.name, applicant.email, APPLICANT_PASSWORD, 'Different-Pass2026');

    await registerPage.expectFieldError('The password field confirmation does not match.');
  });
});

test.describe('Access control', () => {
  test('signed-out visitors are sent to the login page', async ({ page }) => {
    await page.goto('/hr/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('an applicant cannot open the HR console', async ({ newApplicant }) => {
    const applicant = await newApplicant();
    const response = await applicant.page.goto('/hr/dashboard');
    expect(response?.status()).toBe(403);
  });

  // Signs in with its own session: logging out the shared saved HR session would
  // sign out every other HR test running in parallel
  test('logging out ends the HR session', async ({ page, loginPage, hrDashboard }) => {
    await loginPage.goto();
    await loginPage.signIn(HR.username, HR.password);
    await expect(hrDashboard.heading).toBeVisible();

    await hrDashboard.logout();
    await expect(loginPage.signInButton).toBeVisible();

    await page.goto('/hr/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });
});
