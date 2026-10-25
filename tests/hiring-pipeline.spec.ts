import { expect, test } from '../src/fixtures';
import { HR } from '../src/data/accounts';
import { interviewSlot, RESUMES, vacancyData } from '../src/data/testData';
import { applyFor, theShortlistedCandidate } from '../src/flows';

/**
 * The whole recruitment journey, end to end, with HR and two applicants in separate
 * browsers: post a vacancy → apply → AI ranking → shortlist → interview → panel
 * scoring → hire → audit trail.
 */
test('hiring pipeline: from vacancy to employee', async ({ hr, newApplicant }) => {
  test.slow(); // three users and about 40 page interactions
  const vacancy = vacancyData();

  await test.step('HR posts a vacancy', async () => {
    await hr.vacancyForm.create(vacancy);
    await expect(hr.vacancies.row(vacancy.title)).toContainText('Open');
  });

  const strong = await newApplicant({ name: 'Aina Rahman', resume: RESUMES.strongMatch });
  const weak = await newApplicant({ name: 'Daniel Wong', resume: RESUMES.weakMatch });

  await test.step('two applicants apply', async () => {
    await applyFor(strong, vacancy.title);
    await applyFor(weak, vacancy.title);
  });

  await test.step('the AI ranking puts the better-matching candidate first', async () => {
    await hr.vacancies.openRanking(vacancy.title);
    await expect(hr.ranking.candidates).toHaveCount(2);

    const [first, second] = await hr.ranking.scores();
    expect(first).toBeGreaterThan(second!);
    await expect(hr.ranking.candidates.first()).toContainText(/laravel/i);
  });

  await test.step('HR shortlists the top candidate and invites them to an interview', async () => {
    await hr.ranking.shortlist(hr.ranking.candidates.first());

    const candidate = await theShortlistedCandidate(hr, vacancy.title);
    await hr.shortlist.invite(candidate, interviewSlot(), 'https://meet.google.com/abc-defg-hij');
  });

  await test.step('the candidate sees the invitation and confirms', async () => {
    await strong.interviews.goto();
    await expect(strong.interviews.interview(vacancy.title)).toContainText('Join Online Meeting');
    await strong.interviews.confirmAttendance(vacancy.title);
  });

  await test.step('HR marks the interview done and two panels rate it', async () => {
    await hr.interviews.markDone(strong.email);
    await hr.interviews.openEvaluation(strong.email);

    await hr.evaluation.setPanels(2);
    await hr.evaluation.rate(1, 5);
    await hr.evaluation.rate(2, 4);
    await hr.evaluation.finalize(strong.email);
  });

  await test.step('the final score combines 60% résumé match and 40% interview', async () => {
    const { resume, interview, final } = await hr.evaluation.scores(strong.email);
    expect(interview).toBe(90); // (5 + 4) / 2 stars = 4.5 / 5
    expect(final).toBe(Math.round(resume * 0.6 + interview * 0.4));
  });

  await test.step('HR converts the candidate into an employee', async () => {
    await hr.evaluation.convertToEmployee();
    await expect(hr.employees.row(strong.email)).toContainText(vacancy.title);
  });

  await test.step('the hiring timeline records who did what', async () => {
    await hr.employees.open(strong.email);
    const timeline = hr.employees.timeline();
    await expect(timeline).toHaveCount(3);
    await expect(timeline.nth(0)).toContainText(new RegExp(`applied · ${strong.name}`, 'i'));
    await expect(timeline.nth(1)).toContainText(
      new RegExp(`submitted → shortlisted · ${HR.displayName}`, 'i'),
    );
    await expect(timeline.nth(2)).toContainText(new RegExp(`shortlisted → hired · ${HR.displayName}`, 'i'));
  });
});
