import { expect, test } from '../src/fixtures';
import { RESUMES } from '../src/data/testData';
import { applyFor } from '../src/flows';

const DEMO_JOB = 'Backend Developer (Laravel)';

test.describe('Résumé', () => {
  test('an uploaded résumé is read by the AI and summarised', async ({ newApplicant }) => {
    const applicant = await newApplicant();

    const card = await applicant.resume.upload(RESUMES.strongMatch);

    await expect(card).toContainText('Active Resume');
    await expect(card).toContainText('Laravel');
    await expect(card).toContainText('4 years');
    await expect(card).toContainText("Bachelor's Degree in Computer Science");
  });

  test('applying without a résumé leads to the résumé page', async ({ newApplicant }) => {
    const applicant = await newApplicant();

    await applicant.jobBoard.goto();
    await applicant.jobBoard.open(DEMO_JOB);
    await applicant.job.apply();

    await expect(applicant.page).toHaveURL(/\/app\/resume$/);
  });
});

test.describe('Applying', () => {
  test('an applicant applies and sees the application with its match score @smoke', async ({
    newApplicant,
  }) => {
    const applicant = await newApplicant({ resume: RESUMES.strongMatch });

    await applyFor(applicant, DEMO_JOB);

    await applicant.applications.goto();
    const application = applicant.applications.application(DEMO_JOB);
    await expect(application).toContainText(/submitted/i);
    await expect(application).toContainText(/Match Score/i);
  });

  test('the same vacancy cannot be applied for twice', async ({ newApplicant }) => {
    const applicant = await newApplicant({ resume: RESUMES.strongMatch });
    await applyFor(applicant, DEMO_JOB);

    await applicant.page.reload();

    await expect(applicant.job.submittedButton).toBeDisabled();
    await expect(applicant.job.applyButton).toBeHidden();
  });

  test('an application can be withdrawn', async ({ newApplicant }) => {
    const applicant = await newApplicant({ resume: RESUMES.strongMatch });
    await applyFor(applicant, DEMO_JOB);

    await applicant.job.withdraw();

    await applicant.applications.goto();
    await expect(applicant.applications.application(DEMO_JOB)).toContainText(/withdrawn/i);
  });
});
