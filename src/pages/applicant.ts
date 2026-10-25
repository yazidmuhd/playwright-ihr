import { expect, type Locator, type Page } from '@playwright/test';
import { confirmDialog } from '../support/dialogs';

/** Public job board (/jobs): open to everyone, signed in or not */
export class JobBoardPage {
  readonly heading: Locator;
  readonly search: Locator;
  readonly applyFilters: Locator;
  readonly jobs: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Find Your Next Role' });
    this.search = page.getByRole('textbox', { name: 'Search jobs' });
    this.applyFilters = page.getByRole('button', { name: 'Apply', exact: true });
    this.jobs = page.getByRole('main').getByRole('listitem');
  }

  async goto(): Promise<void> {
    await this.page.goto('/jobs');
    await expect(this.heading).toBeVisible();
  }

  async searchFor(text: string): Promise<void> {
    await this.search.fill(text);
    await this.applyFilters.click();
    // The list reloads in place; wait for it, or a click could land on the old list
    await expect(this.page).toHaveURL(/[?&]q=/);
  }

  job(title: string): Locator {
    return this.jobs.filter({ has: this.page.getByRole('heading', { name: title }) });
  }

  async open(title: string): Promise<void> {
    await this.searchFor(title);
    await this.job(title).getByRole('link', { name: 'View Details' }).click();
  }
}

/** One vacancy (/jobs/{id}) with the Apply button */
export class JobPage {
  readonly title: Locator;
  readonly applyButton: Locator;
  readonly submittedButton: Locator;
  readonly requiredSkills: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByRole('main').getByRole('heading', { level: 1 });
    this.applyButton = page.getByRole('button', { name: 'Apply Now' });
    this.submittedButton = page.getByRole('button', { name: 'Application Submitted' });
    this.requiredSkills = page.getByRole('heading', { name: 'Required Skills' }).locator('..');
  }

  async apply(): Promise<void> {
    await this.applyButton.click();
    await confirmDialog(this.page, 'Confirm Application', 'Confirm Application');
  }

  /** Withdrawing asks with the browser's own confirm box */
  async withdraw(): Promise<void> {
    this.page.once('dialog', async (dialog) => {
      expect(dialog.message()).toBe('Withdraw this application?');
      await dialog.accept();
    });
    await this.page.getByRole('button', { name: 'Withdraw Application' }).click();
    await expect(this.page.getByRole('button', { name: /Re-apply for this Role/ })).toBeVisible();
  }
}

export class ResumePage {
  readonly heading: Locator;
  readonly fileInput: Locator;
  readonly resumes: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'My Resumes' });
    this.fileInput = page.locator('input[type="file"]');
    this.resumes = page.getByRole('main').getByRole('article');
  }

  async goto(): Promise<void> {
    // The page keeps a status poll open, so wait for content rather than the load event
    await this.page.goto('/app/resume', { waitUntil: 'domcontentloaded' });
    await expect(this.heading).toBeVisible();
  }

  /** Uploads a résumé and waits until i-HR has read it (parsing runs during the request in tests) */
  async upload(file: string): Promise<Locator> {
    await this.goto();
    await this.fileInput.setInputFiles(file);
    const card = this.resumes.filter({ hasText: file.split('/').pop()! });
    // Reading the résumé is the slowest step in i-HR (an AI call), so allow it more time
    await expect(card).toContainText('AI Parsed Successfully', { timeout: 30_000 });
    return card;
  }
}

export class MyApplicationsPage {
  readonly applications: Locator;

  constructor(private readonly page: Page) {
    this.applications = page.getByRole('main').getByRole('article');
  }

  async goto(): Promise<void> {
    await this.page.goto('/applications');
    await expect(this.page.getByRole('heading', { name: 'My Applications' })).toBeVisible();
  }

  application(vacancyTitle: string): Locator {
    return this.applications.filter({ hasText: vacancyTitle });
  }
}

export class MyInterviewsPage {
  readonly interviews: Locator;

  constructor(private readonly page: Page) {
    this.interviews = page.getByRole('main').getByRole('article');
  }

  async goto(): Promise<void> {
    await this.page.goto('/app/interviews');
    await expect(this.page.getByRole('heading', { name: 'My Interview Schedule' })).toBeVisible();
  }

  interview(vacancyTitle: string): Locator {
    return this.interviews.filter({ hasText: vacancyTitle });
  }

  async confirmAttendance(vacancyTitle: string): Promise<void> {
    const card = this.interview(vacancyTitle);
    await card.getByRole('button', { name: 'Confirm Attendance' }).click();
    await expect(card.getByRole('button', { name: 'Response Recorded' })).toBeDisabled();
  }
}
