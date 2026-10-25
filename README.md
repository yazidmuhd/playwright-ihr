# Playwright end-to-end tests for Sauce Demo

[![Playwright tests](https://github.com/yazidmuhd/playwright-ihr/actions/workflows/playwright.yml/badge.svg)](https://github.com/yazidmuhd/playwright-ihr/actions/workflows/playwright.yml)

An automated test suite for [saucedemo.com](https://www.saucedemo.com), a public demo online shop, built with **Playwright** and **TypeScript**. It tests what a real customer does: signing in, browsing and sorting products, filling a cart and checking out. It runs on Chromium, Firefox, WebKit (Safari) and a mobile viewport.

**[View the latest test report →](https://yazidmuhd.github.io/playwright-ihr/)**, published automatically after every run on `main`.

## Highlights

- **Page Object Model.** Each screen is a class (`LoginPage`, `InventoryPage`, `CartPage`, …), so tests read like user steps and selectors live in one place.
- **Custom fixtures.** Tests receive ready-made page objects (`async ({ cartPage }) => …`) instead of constructing them.
- **Log in once, reuse the session.** A setup project signs in through the UI and saves the session; other tests start signed in. They stay fast and independent of each other.
- **Data-driven tests.** Login errors, sort orders and checkout form validation are each one test template looping over a table of cases.
- **Business-rule checks.** The checkout test recalculates subtotal, 8% tax and total from the catalogue data, rather than only checking that some numbers appear.
- **Known defects tracked, not ignored.** Sauce Demo has accounts with deliberate bugs. Each bug has a test asserting the _correct_ behaviour, marked `test.fail()` with a description. The suite stays green while the bug exists and turns red when it's fixed. See [Defects found](#defects-found).
- **Accessibility.** [axe-core](https://github.com/dequelabs/axe-core) scans key pages against WCAG 2.1 A/AA. The run fails on serious or critical issues, and every finding is attached to the report.
- **CI/CD.**
  - GitHub Actions runs each browser in parallel.
  - The results are merged into one HTML report and published to GitHub Pages.
  - It also runs daily, to catch changes on the live site.
  - Lint and type checks run on every push.
- **Debuggable failures.** Screenshots, videos and Playwright traces are recorded for failed tests.

## Test coverage

| Area              | File                                                   | Tests | What is checked                                                                                                                                            |
| ----------------- | ------------------------------------------------------ | ----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login and session | [`auth.spec.ts`](tests/auth.spec.ts)                   |    10 | Valid login, locked-out user, wrong/unknown/empty credentials, dismissing errors, masked password, access blocked when signed out, logout ends the session |
| Product list      | [`inventory.spec.ts`](tests/inventory.spec.ts)         |     7 | Full catalogue with prices, unique images, four sort orders, product detail page                                                                           |
| Cart              | [`cart.spec.ts`](tests/cart.spec.ts)                   |     6 | Badge and button states, order of items, cart kept across pages and reloads, removing items, reset app state                                               |
| Checkout          | [`checkout.spec.ts`](tests/checkout.spec.ts)           |     6 | Full purchase with totals and tax, required fields, cancel from each step keeps the cart                                                                   |
| Known defects     | [`known-issues.spec.ts`](tests/known-issues.spec.ts)   |     6 | Bugs in `problem_user` and `error_user`, tracked as expected failures                                                                                      |
| Accessibility     | [`accessibility.spec.ts`](tests/accessibility.spec.ts) |     3 | WCAG 2.1 A/AA scan of login, product list and cart                                                                                                         |

That's 38 tests per desktop browser, plus the `@smoke` tests on a mobile viewport: **120 test runs** in total.

## Defects found

These bugs are deliberate in Sauce Demo, and the suite documents them.

| User           | Defect                                                          | Test                                      |
| -------------- | --------------------------------------------------------------- | ----------------------------------------- |
| `problem_user` | All products show the same image                                | `every product has its own image`         |
| `problem_user` | "Name (Z to A)" sort does nothing                               | `sorting Z to A reorders the list`        |
| `problem_user` | "Add to cart" does nothing for some products                    | `every product can be added to the cart`  |
| `problem_user` | Typing a last name overwrites the first name, blocking checkout | `the last name field keeps what is typed` |
| `error_user`   | Sorting shows an alert "Sorting is broken!"                     | `sorting works without an error popup`    |
| `error_user`   | The Finish button never places the order                        | `a purchase can be completed`             |

The accessibility scan also reports two **moderate** findings, which don't fail the build: the pages have no main heading (`page-has-heading-one`), and some content sits outside a landmark region (`region`).

## Project structure

```
src/
  pages/          one class per screen: LoginPage, InventoryPage, ProductPage, CartPage, CheckoutPages
  components/     Header (cart badge, menu, logout), shared by every signed-in page
  data/           users, product catalogue (names, prices) and the test customer
  utils/          price parsing and rounding
  fixtures.ts     extends Playwright's `test` with the page objects
tests/
  auth.setup.ts   signs in once and saves the session for the other tests
  *.spec.ts       the tests
playwright.config.ts   browsers, retries, tracing, reporters
.github/workflows/     CI: lint, test matrix, merged report, GitHub Pages
```

## Running locally

Requires Node.js 20 or newer.

```bash
npm ci
npx playwright install          # downloads Chromium, Firefox and WebKit

npm test                        # everything, all browsers
npm run test:chromium           # one browser
npm run test:smoke              # only the @smoke tests
npm run test:headed             # watch it run in a real browser window
npm run test:ui                 # Playwright's interactive UI mode
npm run report                  # open the last HTML report

npm run lint && npm run typecheck && npm run format:check
```

Sauce Demo's demo accounts and password are printed on its login page, so no setup is needed. `BASE_URL` and `SAUCE_PASSWORD` can be overridden (see `.env.example`).

## Design decisions

- **`data-test` selectors.** The site marks elements with `data-test` attributes, and `testIdAttribute: 'data-test'` makes `getByTestId()` use them. They don't change when styling or wording does. Role-based locators are used where they read better (e.g. the menu button).
- **Web-first assertions only.** No fixed waits (`waitForTimeout`). Every check uses Playwright's auto-retrying `expect`, so tests wait exactly as long as the page needs.
- **Independent tests.** Every test opens a fresh browser context, so tests can run in parallel and in any order. The Chromium suite was run three times in a row with no flaky results.
- **Expected values come from data, not from the page.** Sort orders and totals are compared with the catalogue in `src/data/products.ts`. A test that only re-sorts what the page shows would pass even if prices were wrong.
- **Lint rules for tests.** `eslint-plugin-playwright` catches common mistakes, such as a test without assertions or a missing `await`.

## Tech stack

Playwright · TypeScript · axe-core · ESLint (typescript-eslint, eslint-plugin-playwright) · Prettier · GitHub Actions · GitHub Pages

---

Built by [Muhammad Yazid](https://github.com/yazidmuhd) as a test automation portfolio project. Sauce Demo is a public practice site by Sauce Labs; this project isn't affiliated with them.
