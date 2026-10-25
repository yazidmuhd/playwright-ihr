import AxeBuilder from '@axe-core/playwright';
import type { Page, TestInfo } from '@playwright/test';
import { expect, SIGNED_OUT, test } from '../src/fixtures';
import { PRODUCTS } from '../src/data/products';

/**
 * Automated WCAG 2.1 A/AA checks with axe-core. The build fails on serious or critical
 * issues; every finding (including minor ones) is attached to the HTML report.
 */
async function scan(page: Page, testInfo: TestInfo) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  await testInfo.attach('axe-results.json', {
    body: JSON.stringify(results.violations, null, 2),
    contentType: 'application/json',
  });

  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} element(s)`);
}

test.describe('Accessibility', () => {
  test.describe('signed out', () => {
    test.use({ storageState: SIGNED_OUT });

    test('login page has no serious accessibility issues', async ({ page, loginPage }, testInfo) => {
      await loginPage.goto();
      expect(await scan(page, testInfo)).toEqual([]);
    });
  });

  test('product list has no serious accessibility issues', async ({ page, inventoryPage }, testInfo) => {
    await inventoryPage.goto();
    expect(await scan(page, testInfo)).toEqual([]);
  });

  test('cart has no serious accessibility issues', async ({ page, inventoryPage, cartPage }, testInfo) => {
    await inventoryPage.goto();
    await inventoryPage.add(PRODUCTS.backpack);
    await cartPage.goto();
    expect(await scan(page, testInfo)).toEqual([]);
  });
});
