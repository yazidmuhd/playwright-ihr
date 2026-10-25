import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

/** Short unique suffix so parallel tests never share records */
export const uid = () => randomUUID().slice(0, 8);

export const RESUMES = {
  /** Laravel, PHP, PostgreSQL, Vue, REST API, Git, Docker · 4 years · Bachelor's in Computer Science */
  strongMatch: resolve('fixtures/resume-strong-match.pdf'),
  /** Photoshop, Illustrator, Branding · 1 year · Diploma in Graphic Design */
  weakMatch: resolve('fixtures/resume-weak-match.pdf'),
};

export type NewApplicant = { name: string; email: string };

export function applicantData(name = 'Aina Rahman'): NewApplicant {
  return { name, email: `applicant.${uid()}@e2e.test` };
}

export type VacancyData = {
  title: string;
  department: string;
  workArrangement: string;
  minYears: number;
  maxYears: number;
  education: string;
  skills: string[];
  description: string;
};

/** A vacancy the strong-match résumé fits well and the weak-match résumé does not */
export function vacancyData(): VacancyData {
  return {
    title: `Backend Developer ${uid()}`,
    department: 'IT / Digitalization',
    workArrangement: 'Hybrid (Gebeng + Remote)',
    minYears: 2,
    maxYears: 5,
    education: "Bachelor's Degree in Computer Science",
    skills: ['Laravel', 'PHP', 'PostgreSQL', 'Vue'],
    description: 'Build and maintain internal HR systems. Created by an automated end-to-end test.',
  };
}

/** Interview slot a few weeks ahead, as the datetime-local input expects it */
export function interviewSlot(): string {
  const date = new Date(Date.now() + 21 * 24 * 3600 * 1000);
  date.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T10:00`;
}
