import { expect, test, type Locator, type Page } from '@playwright/test';
import type { VacancyData } from '../data/testData';
import { confirmDialog } from '../support/dialogs';
import { untilSaved } from '../support/saves';

export class HrDashboardPage {
  readonly heading: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: /Command Center/ });
  }

  async goto(): Promise<void> {
    await this.page.goto('/hr/dashboard');
    await expect(this.heading).toBeVisible();
  }

  /** Logout asks with the browser's own confirm box, which Playwright would otherwise dismiss */
  async logout(): Promise<void> {
    this.page.once('dialog', async (dialog) => {
      expect(dialog.message()).toBe('Sign out of i-HR?');
      await dialog.accept();
    });
    await this.page.getByRole('button', { name: 'Logout' }).first().click();
  }
}

export class VacancyFormPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/hr/vacancies/create');
    await expect(this.page.getByRole('heading', { name: 'Create New Vacancy' })).toBeVisible();
  }

  /** i-HR's labels aren't linked to their inputs, so a field is found through its label's group */
  field(label: string): Locator {
    return this.page
      .locator('.field-group')
      .filter({ has: this.page.locator('.field-label', { hasText: label }) })
      .locator('input, select, textarea')
      .first();
  }

  async create(v: VacancyData): Promise<void> {
    await test.step(`HR creates the vacancy ${v.title}`, async () => {
      await this.goto();
      await this.field('Job Title').fill(v.title);
      await this.field('Department').selectOption(v.department);
      await this.field('Work Arrangement').selectOption(v.workArrangement);
      await this.field('Minimum Years').fill(String(v.minYears));
      await this.field('Maximum Years').fill(String(v.maxYears));
      await this.field('Education Requirement').fill(v.education);
      await this.field('Core Skills').fill(v.skills.join(', '));
      await this.page
        .getByPlaceholder('Brief intro, key responsibilities, and requirements...')
        .fill(v.description);
      await this.page.getByRole('button', { name: 'Create Vacancy' }).click();
      await expect(this.page).toHaveURL(/\/hr\/vacancies$/);
    });
  }
}

export class VacanciesPage {
  readonly rows: Locator;

  constructor(private readonly page: Page) {
    this.rows = page.getByRole('main').getByRole('row');
  }

  async goto(): Promise<void> {
    await this.page.goto('/hr/vacancies');
    await expect(this.page.getByRole('heading', { name: 'Vacancies Management' })).toBeVisible();
  }

  row(title: string): Locator {
    return this.rows.filter({ has: this.page.getByRole('link', { name: title, exact: true }) });
  }

  async openRanking(title: string): Promise<void> {
    await this.goto();
    await this.row(title).getByRole('link', { name: 'AI Features' }).click();
    await expect(this.page.getByRole('heading', { name: 'AI-Powered Candidate Ranking' })).toBeVisible();
  }
}

/** AI ranking board for one vacancy: candidates sorted by match score */
export class RankingPage {
  readonly candidates: Locator;

  constructor(private readonly page: Page) {
    this.candidates = page.getByRole('main').getByRole('article');
  }

  async scores(): Promise<number[]> {
    const texts = await this.candidates.allInnerTexts();
    return texts.map((t) => Number(t.match(/MATCH SCORE\s*(\d+(?:\.\d+)?)/i)?.[1] ?? NaN));
  }

  async shortlist(candidate: Locator): Promise<void> {
    await candidate.getByRole('button', { name: 'Shortlist' }).click();
    await confirmDialog(this.page, 'Shortlist Candidate?', 'Shortlist');
    await expect(candidate).toContainText(/shortlisted/i);
  }
}

export class ShortlistPage {
  readonly candidates: Locator;

  constructor(private readonly page: Page) {
    this.candidates = page.getByRole('main').getByRole('article');
  }

  async openVacancy(title: string): Promise<void> {
    await this.page.goto('/hr/shortlist');
    await this.page
      .getByRole('article')
      .filter({ has: this.page.getByRole('heading', { name: title }) })
      .getByRole('link', { name: 'View Shortlisted' })
      .click();
    await expect(
      this.page.getByRole('heading', { name: 'Shortlisted Candidates', exact: true }),
    ).toBeVisible();
  }

  async openInviteForm(candidate: Locator): Promise<void> {
    await candidate.getByRole('button', { name: 'Invite for Interview' }).click();
    await expect(this.page.getByRole('heading', { name: 'Schedule Interview' })).toBeVisible();
  }

  async invite(candidate: Locator, when: string, meetingLink: string): Promise<void> {
    await this.openInviteForm(candidate);
    await this.page.locator('input[type="datetime-local"]').fill(when);
    await this.page.getByPlaceholder('e.g., https://meet.google.com/abc-defg-hij').fill(meetingLink);
    await this.page.getByRole('button', { name: 'Send Invitation' }).click();
    await expect(candidate.getByRole('button', { name: 'Cancel Interview' })).toBeVisible();
  }
}

export class InterviewsPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/hr/interviews');
    await expect(this.page.getByRole('heading', { name: 'Interview Management' })).toBeVisible();
  }

  interview(email: string): Locator {
    return this.page.getByRole('main').getByRole('article').filter({ hasText: email });
  }

  async showAll(): Promise<void> {
    await this.page.getByRole('button', { name: /^All \d+/ }).click();
  }

  async markDone(email: string): Promise<void> {
    await this.goto();
    await this.showAll();
    await this.interview(email).getByRole('button', { name: 'Mark Done' }).click();
    await untilSaved(this.page, /\/status$/, () =>
      confirmDialog(this.page, 'Mark Interview as Done?', 'Mark as Done'),
    );
  }

  async openEvaluation(email: string): Promise<void> {
    await this.goto();
    await this.showAll();
    await this.interview(email).getByRole('button', { name: 'Evaluation', exact: true }).click();
    await expect(this.page.getByRole('heading', { name: 'Interview Evaluation' })).toBeVisible();
  }
}

/** Panel ratings, final score and conversion to an employee */
export class EvaluationPage {
  constructor(private readonly page: Page) {}

  candidate(email: string): Locator {
    return this.page.getByRole('main').getByRole('article').filter({ hasText: email });
  }

  async setPanels(count: number): Promise<void> {
    await this.page.getByRole('button', { name: 'Set Panels' }).first().click();
    await this.page.getByRole('spinbutton').fill(String(count));
    await untilSaved(this.page, /\/panels$/, () =>
      confirmDialog(this.page, 'Set Interview Panels', 'Set Panels'),
    );
    await expect(this.page.locator('.panel-card')).toHaveCount(count);
  }

  /** The stars are unlabelled buttons (see known issues), so the n-th star of a panel card is used.
   *  The rating shows at once but saves in the background, so wait for the save. */
  async rate(panelNo: number, stars: number): Promise<void> {
    const panel = this.page.locator('.panel-card').filter({ hasText: `Panel #${panelNo}` });
    const star = panel.getByRole('button', { name: '★' }).nth(stars - 1);
    await untilSaved(this.page, /\/rate$/, () => star.click());
    await expect(panel).toContainText(`${stars}/5`);
  }

  /** Checks the lasting result (status "scored"), not the success message, which disappears */
  async finalize(email: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Finalize Evaluation' }).click();
    await untilSaved(this.page, /\/finalize$/, () =>
      confirmDialog(this.page, 'Finalize Evaluation?', 'Finalize Now'),
    );
    await expect(this.candidate(email)).toContainText(/Interview:\s*scored/i);
  }

  async scores(email: string): Promise<{ resume: number; interview: number; final: number }> {
    const text = await this.candidate(email).innerText();
    const read = (label: string) => Number(text.match(new RegExp(`${label} Score\\s*(\\d+)`, 'i'))?.[1]);
    return { resume: read('Resume'), interview: read('Interview'), final: read('Final') };
  }

  async convertToEmployee(): Promise<void> {
    await this.page.getByRole('button', { name: 'Convert to Employee' }).click();
    await confirmDialog(this.page, 'Convert to Employee?', 'Convert Now!');
    await expect(this.page).toHaveURL(/\/hr\/employees$/);
  }
}

export class EmployeesPage {
  readonly rows: Locator;

  constructor(private readonly page: Page) {
    this.rows = page.getByRole('main').getByRole('row');
  }

  async goto(): Promise<void> {
    await this.page.goto('/hr/employees');
    await expect(this.page.getByRole('heading', { name: 'Employee Directory' })).toBeVisible();
  }

  row(email: string): Locator {
    return this.rows.filter({ hasText: email });
  }

  async open(email: string): Promise<void> {
    await this.row(email).getByRole('link', { name: 'View' }).click();
    await expect(this.page.getByRole('heading', { name: 'Hiring Timeline' })).toBeVisible();
  }

  /** "Hiring Timeline" entries on the employee page */
  timeline(): Locator {
    return this.page
      .getByRole('heading', { name: 'Hiring Timeline' })
      .locator('xpath=following::ol[1]')
      .getByRole('listitem');
  }
}
