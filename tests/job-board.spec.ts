import { expect, test } from '../src/fixtures';
import { vacancyData } from '../src/data/testData';

// The demo vacancy seeded with every fresh test database
const DEMO_JOB = 'Backend Developer (Laravel)';

test.describe('Public job board', () => {
  test('signed-out visitors can browse open vacancies @smoke', async ({ jobBoard }) => {
    await jobBoard.goto();
    await jobBoard.searchFor(DEMO_JOB);

    const job = jobBoard.job(DEMO_JOB);
    await expect(job).toBeVisible();
    await expect(job).toContainText('Open');
    await expect(job).toContainText('Kuala Lumpur');
  });

  test('a vacancy page lists its requirements', async ({ jobBoard, jobPage }) => {
    await jobBoard.goto();
    await jobBoard.open(DEMO_JOB);

    await expect(jobPage.title).toHaveText(DEMO_JOB);
    for (const skill of ['Laravel', 'PHP', 'PostgreSQL']) {
      await expect(jobPage.requiredSkills).toContainText(skill);
    }
  });

  test('searching narrows the list', async ({ jobBoard }) => {
    await jobBoard.goto();
    await jobBoard.searchFor('no vacancy has this title');
    await expect(jobBoard.jobs).toHaveCount(0);
  });

  test('signed-out visitors must sign in before applying', async ({ page, jobBoard, jobPage }) => {
    await jobBoard.goto();
    await jobBoard.open(DEMO_JOB);
    await jobPage.apply();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('a vacancy HR publishes appears on the board straight away', async ({ hr, jobBoard }) => {
    const vacancy = vacancyData();
    await hr.vacancyForm.create(vacancy);

    await jobBoard.goto();
    await jobBoard.searchFor(vacancy.title);
    await expect(jobBoard.job(vacancy.title)).toBeVisible();
  });
});
