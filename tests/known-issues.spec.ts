import { expect, test } from '../src/fixtures';
import { interviewSlot, RESUMES, vacancyData } from '../src/data/testData';
import { confirmDialog } from '../src/support/dialogs';
import { applyFor, shortlistTopCandidate, theShortlistedCandidate } from '../src/flows';

/**
 * Defects these tests found in i-HR. Each test asserts the CORRECT behaviour and is
 * marked test.fail() with a description, so the suite stays green while the bug exists
 * and turns red once it is fixed (then remove the marker). Details are in the README.
 */
function knownDefect(description: string) {
  test.info().annotations.push({ type: 'known defect', description });
  test.fail();
}

test('the interview invitation can be sent from a laptop-sized screen', async ({ hr, newApplicant }) => {
  test.slow(); // builds a shortlisted candidate first
  knownDefect(
    'The "Schedule Interview" pop-up is taller than a 1366×768 laptop window and cannot scroll, ' +
      'so the "Send Invitation" button is unreachable',
  );
  const vacancy = vacancyData();
  await hr.vacancyForm.create(vacancy);
  const applicant = await newApplicant({ resume: RESUMES.strongMatch });
  await applyFor(applicant, vacancy.title);
  await shortlistTopCandidate(hr, vacancy.title);
  const candidate = await theShortlistedCandidate(hr, vacancy.title);

  await hr.page.setViewportSize({ width: 1366, height: 657 }); // 768 px screen minus browser bars
  await hr.shortlist.openInviteForm(candidate);

  await expect(hr.page.getByRole('button', { name: 'Send Invitation' })).toBeInViewport({ timeout: 3_000 });
});

test('the employee list shows the employee number and department', async ({ hr, newApplicant }) => {
  test.slow(); // builds a shortlisted candidate first
  knownDefect('Employees list shows "-" for Employee No and Department: the query never selects them');
  const vacancy = vacancyData();
  await hr.vacancyForm.create(vacancy);
  const applicant = await newApplicant({ resume: RESUMES.strongMatch });
  await applyFor(applicant, vacancy.title);
  await shortlistTopCandidate(hr, vacancy.title);

  // Invite, then hire straight from the shortlist
  const candidate = await theShortlistedCandidate(hr, vacancy.title);
  await hr.shortlist.invite(candidate, interviewSlot(), 'https://meet.google.com/abc-defg-hij');
  await candidate.getByRole('button', { name: 'Hire' }).click();
  await confirmDialog(hr.page, 'Hire Candidate?', 'Hire Now!');
  await hr.employees.goto();

  const row = hr.employees.row(applicant.email);
  await expect(row.getByRole('cell').first()).toHaveText(/^EMP\d{8}-/, { timeout: 3_000 });
  await expect(row).toContainText(vacancy.department, { timeout: 3_000 });
});

test('signed-out visitors are not offered a Logout button', async ({ page, jobBoard }) => {
  knownDefect('The public job board shows the applicant menu and a Logout button to signed-out visitors');
  await jobBoard.goto();
  await expect(page.getByRole('button', { name: 'Logout' })).toBeHidden({ timeout: 3_000 });
});

test('confirmation pop-ups are announced as dialogs', async ({ newApplicant }) => {
  knownDefect('Pop-ups have no role="dialog", so screen readers do not announce them');
  const applicant = await newApplicant();
  await applicant.jobBoard.goto();
  await applicant.jobBoard.open('Backend Developer (Laravel)');

  await applicant.job.applyButton.click();

  await expect(applicant.page.getByRole('dialog')).toBeVisible({ timeout: 3_000 });
});
