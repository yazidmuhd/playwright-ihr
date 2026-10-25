import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly login: Locator;
  readonly password: Locator;
  readonly signInButton: Locator;

  constructor(private readonly page: Page) {
    this.login = page.getByPlaceholder('Enter your username or email');
    this.password = page.getByPlaceholder('Enter your password');
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async signIn(login: string, password: string): Promise<void> {
    await this.login.fill(login);
    await this.password.fill(password);
    await this.signInButton.click();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.page.getByText(message)).toBeVisible();
  }
}

export class RegisterPage {
  readonly fullName: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly confirmPassword: Locator;
  readonly createButton: Locator;
  readonly successHeading: Locator;
  readonly continueToLogin: Locator;

  constructor(private readonly page: Page) {
    this.fullName = page.getByPlaceholder('Enter your full name');
    this.email = page.getByPlaceholder('Enter your email address');
    this.password = page.getByPlaceholder('Create a strong password');
    this.confirmPassword = page.getByPlaceholder('Confirm your password');
    this.createButton = page.getByRole('button', { name: 'Create Account' });
    this.successHeading = page.getByRole('heading', { name: 'Account Created Successfully!' });
    this.continueToLogin = page.getByRole('button', { name: 'Continue to Login' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/register');
  }

  async register(name: string, email: string, password: string, confirm = password): Promise<void> {
    await this.fullName.fill(name);
    await this.email.fill(email);
    await this.password.fill(password);
    await this.confirmPassword.fill(confirm);
    await this.createButton.click();
  }

  async expectFieldError(message: string | RegExp): Promise<void> {
    await expect(this.page.locator('.form-error').filter({ hasText: message })).toBeVisible();
  }
}
