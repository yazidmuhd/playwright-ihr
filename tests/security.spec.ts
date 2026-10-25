import { expect, test } from '../src/fixtures';
import { HR_STATE } from '../src/data/accounts';
import { RESUMES } from '../src/data/testData';
import { applyFor } from '../src/flows';
import { OUTSIDE_IP } from '../src/support/network';

const DEMO_JOB = 'Backend Developer (Laravel)';

test.describe('Office-network restriction', () => {
  test.describe('HR signed in from outside the office network', () => {
    test.use({ storageState: HR_STATE, extraHTTPHeaders: { 'X-Real-IP': OUTSIDE_IP } });

    test('the HR console is refused and explains why', async ({ page }) => {
      const response = await page.goto('/hr/dashboard');

      expect(response?.status()).toBe(403);
      await expect(
        page.getByRole('heading', { name: 'i-HR is only available on the company network' }),
      ).toBeVisible();
      await expect(page.getByRole('code')).toHaveText(OUTSIDE_IP);
    });
  });

  test.describe('applicant outside the office network', () => {
    test.use({ extraHTTPHeaders: { 'X-Real-IP': OUTSIDE_IP } });

    test('can still browse jobs and register', async ({ jobBoard, registerPage }) => {
      await jobBoard.goto();
      await expect(jobBoard.jobs.first()).toBeVisible();

      await registerPage.goto();
      await expect(registerPage.createButton).toBeVisible();
    });
  });
});

test.describe('Browser protections', () => {
  test('pages send security headers', async ({ page }) => {
    const response = await page.goto('/login');
    const headers = response!.headers();

    expect(headers['content-security-policy']).toContain("script-src 'self'");
    expect(headers['content-security-policy']).toContain("object-src 'none'");
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['x-powered-by']).toBeUndefined();
  });

  test('forms cannot be submitted without the CSRF token', async ({ request }) => {
    const response = await request.post('/login', {
      form: { login: 'humanres', password: 'whatever' },
      headers: { Accept: 'text/html' },
    });
    expect(response.status()).toBe(419);
  });

  test('a résumé upload must be a PDF or Word file', async ({ newApplicant }) => {
    const applicant = await newApplicant();
    await applicant.resume.goto();

    await applicant.resume.fileInput.setInputFiles({
      name: 'not-a-resume.exe',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('MZ fake executable'),
    });

    await expect(applicant.page.getByText('Please upload PDF or DOCX files only')).toBeVisible();
    await expect(applicant.resume.resumes).toHaveCount(0);
  });

  test('the server refuses a file that only pretends to be a PDF', async ({ newApplicant }) => {
    const applicant = await newApplicant();
    await applicant.resume.goto();

    // Passes the browser's extension check, but the content is not a PDF
    await applicant.resume.fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('MZ this is an executable, not a PDF'),
    });

    await expect(applicant.page.getByText('Failed to upload resume')).toBeVisible();
    await applicant.resume.goto();
    await expect(applicant.resume.resumes).toHaveCount(0);
  });
});

test.describe('Stored cross-site scripting', () => {
  const PAYLOAD = '<img src=x onerror="window.__xss = true">';

  test('an applicant name containing HTML is shown as text to HR', async ({ hr, newApplicant }) => {
    const attacker = await newApplicant({ name: PAYLOAD, resume: RESUMES.strongMatch });
    await applyFor(attacker, DEMO_JOB);

    const alerts: string[] = [];
    hr.page.on('dialog', async (dialog) => {
      alerts.push(dialog.message());
      await dialog.dismiss();
    });

    // The HR dashboard lists the latest applicants by name
    await hr.dashboard.goto();
    await expect(hr.page.getByText(PAYLOAD).first()).toBeVisible();

    expect(await hr.page.evaluate(() => (window as unknown as { __xss?: boolean }).__xss)).toBeUndefined();
    expect(alerts).toEqual([]);
  });
});
