// Captures portfolio screenshots of the published Playwright report and the CI run.
//   npm run screenshots                 → from https://yazidmuhd.github.io/playwright-ihr/
//   REPORT_URL=http://127.0.0.1:9323/ npm run screenshots   → from a local `npx playwright show-report`
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const REPORT = process.env.REPORT_URL ?? 'https://yazidmuhd.github.io/playwright-ihr/';
const REPO = 'yazidmuhd/playwright-ihr';
const OUT = 'docs/screenshots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });

async function openReport(query = '', waitForText = 'hiring-pipeline.spec.ts') {
  await page.goto(REPORT + query);
  await page.getByText(waitForText).first().waitFor();
}

async function openTest(title, project) {
  await openReport();
  const row = page.getByRole('listitem').filter({ hasText: title }).filter({ hasText: project }).first();
  await row.getByRole('link', { name: title }).first().click();
  await page.getByText('Test Steps').waitFor();
}

async function shot(name) {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`saved ${OUT}/${name}.png`);
}

// 1. Overview: every test, all passed
await openReport();
await shot('01-report-summary');

// 2. The full hiring journey as named steps
await openTest('hiring pipeline: from vacancy to employee', 'chromium');
await shot('02-hiring-pipeline-steps');

// 3. A defect found in i-HR, tracked as an expected failure
await openTest('the interview invitation can be sent from a laptop-sized screen', 'chromium');
await shot('03-known-defect');

// 4. Cross-browser: the same tests in WebKit (Safari)
await openReport('#?q=p:webkit', 'auth.spec.ts');
await shot('04-webkit-results');

// 5. Security tests
await openReport('#?q=security.spec.ts p:chromium', 'security.spec.ts');
await shot('05-security-tests');

// 6. The CI run that produced the report
const runs = await (
  await fetch(`https://api.github.com/repos/${REPO}/actions/runs?status=success&per_page=1`)
).json();
const runUrl = runs.workflow_runs?.[0]?.html_url;
if (runUrl) {
  await page.goto(runUrl);
  await page.getByText('Publish report to GitHub Pages').first().waitFor();
  await shot('06-github-actions-run');
}

await browser.close();
