import { expect } from '@playwright/test';
import type { Applicant, Hr } from './fixtures';

/**
 * Multi-step journeys shared by several specs. Every step goes through the UI,
 * exactly as a person would.
 */

export async function applyFor(applicant: Applicant, vacancyTitle: string): Promise<void> {
  await applicant.jobBoard.goto();
  await applicant.jobBoard.open(vacancyTitle);
  await applicant.job.apply();
  await expect(applicant.job.submittedButton).toBeDisabled();
}

/** HR shortlists the best-ranked candidate for a vacancy */
export async function shortlistTopCandidate(hr: Hr, vacancyTitle: string): Promise<void> {
  await hr.vacancies.openRanking(vacancyTitle);
  await hr.ranking.shortlist(hr.ranking.candidates.first());
}

/** Opens the vacancy's shortlist and returns its only shortlisted candidate */
export async function theShortlistedCandidate(hr: Hr, vacancyTitle: string) {
  await hr.shortlist.openVacancy(vacancyTitle);
  await expect(hr.shortlist.candidates).toHaveCount(1);
  return hr.shortlist.candidates.first();
}
