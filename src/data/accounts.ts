/**
 * The HR administrator seeded into the test database by e2e-server/start.mjs.
 * Override both places with E2E_HR_USERNAME / E2E_HR_PASSWORD if needed.
 */
export const HR = {
  username: process.env.E2E_HR_USERNAME ?? 'humanres',
  password: process.env.E2E_HR_PASSWORD ?? 'E2e-Hr-Password-2026',
  displayName: 'HR Administrator',
};

/** Signed-in HR session saved by tests/hr.setup.ts */
export const HR_STATE = '.auth/hr.json';

/** Meets i-HR's password policy: 12+ characters, upper and lower case, a number */
export const APPLICANT_PASSWORD = 'Kuala-Lumpur2026';

/** Starts every test signed out */
export const SIGNED_OUT = { cookies: [], origins: [] };
