/**
 * saucedemo's demo accounts. They are printed on the site's login page, so the
 * password is not a secret; it can still be overridden with SAUCE_PASSWORD.
 */
export const PASSWORD = process.env.SAUCE_PASSWORD ?? 'secret_sauce';

export const USERS = {
  standard: 'standard_user',
  lockedOut: 'locked_out_user',
  problem: 'problem_user',
  performanceGlitch: 'performance_glitch_user',
  error: 'error_user',
  visual: 'visual_user',
} as const;

export type Username = (typeof USERS)[keyof typeof USERS];

/** Signed-in session saved by tests/auth.setup.ts and reused by the browser projects */
export const STORAGE_STATE = '.auth/standard-user.json';
