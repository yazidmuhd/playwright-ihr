import { expect, type Page } from '@playwright/test';

/**
 * i-HR asks for confirmation in custom pop-ups that have no role="dialog", so a dialog is
 * found by its heading: the innermost element that contains both the heading and the button.
 */
export async function confirmDialog(page: Page, title: string, button: string): Promise<void> {
  const heading = page.getByRole('heading', { name: title });
  const action = page.getByRole('button', { name: button, exact: true });
  const dialog = page.locator('div').filter({ has: heading }).filter({ has: action }).last();

  await dialog.getByRole('button', { name: button, exact: true }).click();
  await expect(heading).toBeHidden();
}
