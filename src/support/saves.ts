import { expect, type Page } from '@playwright/test';

/**
 * Runs an action and waits until the save it triggers has fully finished.
 *
 * Some i-HR screens update immediately and save in the background (e.g. star ratings),
 * and every save is answered with a redirect that reloads the page's data. Acting before
 * that reload lands can cancel the save, or have the reload close a dialog just opened.
 * So this waits for the final response of the save: the reloaded page after the redirect,
 * or the save's own response when there is no redirect.
 */
export async function untilSaved(page: Page, path: RegExp, action: () => Promise<void>): Promise<void> {
  const finished = page.waitForResponse((response) => {
    const request = response.request();
    const save = request.redirectedFrom() ?? request;
    const isSave = save.method() !== 'GET' && path.test(new URL(save.url()).pathname);
    const isRedirect = response.status() >= 300 && response.status() < 400;
    return isSave && !isRedirect;
  });
  await action();
  expect((await finished).status(), `save to ${path} failed`).toBeLessThan(400);
}
