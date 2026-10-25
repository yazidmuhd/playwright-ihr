import {
  test as base,
  expect,
  type Browser,
  type BrowserContext,
  type BrowserContextOptions,
  type Page,
  type TestInfo,
} from '@playwright/test';
import { APPLICANT_PASSWORD, HR_STATE } from './data/accounts';
import { applicantData, type NewApplicant } from './data/testData';
import { JobBoardPage, JobPage, MyApplicationsPage, MyInterviewsPage, ResumePage } from './pages/applicant';
import { LoginPage, RegisterPage } from './pages/auth';
import {
  EmployeesPage,
  EvaluationPage,
  HrDashboardPage,
  InterviewsPage,
  RankingPage,
  ShortlistPage,
  VacanciesPage,
  VacancyFormPage,
} from './pages/hr';
import { officeIp } from './support/network';

/** The HR administrator, signed in, in a browser window of their own */
export type Hr = {
  page: Page;
  dashboard: HrDashboardPage;
  vacancyForm: VacancyFormPage;
  vacancies: VacanciesPage;
  ranking: RankingPage;
  shortlist: ShortlistPage;
  interviews: InterviewsPage;
  evaluation: EvaluationPage;
  employees: EmployeesPage;
};

/** A newly registered, signed-in applicant in a browser window of their own */
export type Applicant = NewApplicant & {
  page: Page;
  jobBoard: JobBoardPage;
  job: JobPage;
  resume: ResumePage;
  applications: MyApplicationsPage;
  interviews: MyInterviewsPage;
};

type Fixtures = {
  /** Pages for the test's own (signed-out) browser window */
  loginPage: LoginPage;
  registerPage: RegisterPage;
  jobBoard: JobBoardPage;
  jobPage: JobPage;
  hrDashboard: HrDashboardPage;
  hr: Hr;
  /** Registers a new applicant through the sign-up form and signs them in */
  newApplicant: (options?: { name?: string; resume?: string }) => Promise<Applicant>;
};

/** A browser context with the current project's device settings and its own office IP */
async function newActorContext(
  browser: Browser,
  baseURL: string | undefined,
  testInfo: TestInfo,
  storageState?: string,
): Promise<BrowserContext> {
  const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = testInfo.project
    .use as BrowserContextOptions;
  return browser.newContext({
    baseURL,
    viewport,
    userAgent,
    deviceScaleFactor,
    isMobile,
    hasTouch,
    storageState,
    extraHTTPHeaders: { 'X-Real-IP': officeIp() },
  });
}

export async function registerAndSignIn(page: Page, data: NewApplicant): Promise<void> {
  const register = new RegisterPage(page);
  await register.goto();
  await register.register(data.name, data.email, APPLICANT_PASSWORD);
  await register.continueToLogin.click();

  await new LoginPage(page).signIn(data.email, APPLICANT_PASSWORD);
  await expect(page).toHaveURL(/\/applicant\/dashboard$/);
}

export const test = base.extend<Fixtures>({
  // The test's own window also presents a unique office-network IP (see src/support/network.ts)
  // eslint-disable-next-line no-empty-pattern -- Playwright fixtures must destructure their first argument
  extraHTTPHeaders: async ({}, use) => {
    await use({ 'X-Real-IP': officeIp() });
  },

  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  registerPage: async ({ page }, use) => use(new RegisterPage(page)),
  jobBoard: async ({ page }, use) => use(new JobBoardPage(page)),
  jobPage: async ({ page }, use) => use(new JobPage(page)),
  hrDashboard: async ({ page }, use) => use(new HrDashboardPage(page)),

  hr: async ({ browser, baseURL }, use, testInfo) => {
    const context = await newActorContext(browser, baseURL, testInfo, HR_STATE);
    const page = await context.newPage();
    await use({
      page,
      dashboard: new HrDashboardPage(page),
      vacancyForm: new VacancyFormPage(page),
      vacancies: new VacanciesPage(page),
      ranking: new RankingPage(page),
      shortlist: new ShortlistPage(page),
      interviews: new InterviewsPage(page),
      evaluation: new EvaluationPage(page),
      employees: new EmployeesPage(page),
    });
    await context.close();
  },

  newApplicant: async ({ browser, baseURL }, use, testInfo) => {
    const contexts: BrowserContext[] = [];

    await use(async ({ name, resume } = {}) => {
      const context = await newActorContext(browser, baseURL, testInfo);
      contexts.push(context);
      const page = await context.newPage();
      const data = applicantData(name);

      await registerAndSignIn(page, data);
      const applicant: Applicant = {
        ...data,
        page,
        jobBoard: new JobBoardPage(page),
        job: new JobPage(page),
        resume: new ResumePage(page),
        applications: new MyApplicationsPage(page),
        interviews: new MyInterviewsPage(page),
      };
      if (resume) await applicant.resume.upload(resume);
      return applicant;
    });

    await Promise.all(contexts.map((c) => c.close()));
  },
});

export { expect };
