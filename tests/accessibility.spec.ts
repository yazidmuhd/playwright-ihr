import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from '../src/fixtures';

/**
 * WCAG 2.1 A/AA scans with axe-core, used as a ratchet: i-HR's current serious and
 * critical issues are listed below (they are real, and reported in the README), and a
 * test fails if a page gains a NEW one. When an issue is fixed, remove it from the list.
 */
/** Low text contrast appears across i-HR wherever coloured badges and hints are shown */
const SITE_WIDE = ['color-contrast'];

const KNOWN: Record<string, string[]> = {
  '/login': ['button-name'], // show-password button has no label
  '/register': ['button-name'],
  '/jobs': ['select-name'], // filter drop-downs have no label
  '/jobs/1': [],
  '/hr/dashboard': ['document-title'],
  '/hr/vacancies': ['select-name'],
  '/hr/interviews': [],
};

const isKnown = (path: string, id: string) => SITE_WIDE.includes(id) || KNOWN[path]!.includes(id);

async function seriousIssues(page: Page): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  await test.info().attach('axe-violations.json', {
    body: JSON.stringify(violations, null, 2),
    contentType: 'application/json',
  });

  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => v.id)
    .sort();
}

test.describe('Accessibility', () => {
  for (const path of ['/login', '/register', '/jobs', '/jobs/1']) {
    test(`public page ${path} has no new serious issues`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('main, body').first()).toBeVisible();

      const found = await seriousIssues(page);
      expect(found.filter((id) => !isKnown(path, id))).toEqual([]);
    });
  }

  for (const path of ['/hr/dashboard', '/hr/vacancies', '/hr/interviews']) {
    test(`HR page ${path} has no new serious issues`, async ({ hr }) => {
      await hr.page.goto(path);
      await expect(hr.page.getByRole('main')).toBeVisible();

      const found = await seriousIssues(hr.page);
      expect(found.filter((id) => !isKnown(path, id))).toEqual([]);
    });
  }
});
