import { Page, Locator } from '@playwright/test';

export default class LoginPage {
  readonly page: Page;
  readonly openLoginButton: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.openLoginButton = page.getByRole('button', { name: 'ログイン' });
    this.emailInput = page.getByRole('textbox', { name: 'メールアドレス' });
    this.passwordInput = page.getByRole('textbox', { name: 'パスワード' });
    this.submitButton = page.locator('#login-button');
  }

  async gotoHome() {
    await this.page.goto('https://hotel-example-site.takeyaqa.dev/ja/');
  }

  async openLogin() {
    await this.openLoginButton.click();
    await this.page.getByRole('heading', { name: 'ログイン' }).waitFor();
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async isLoggedIn() {
    // Check for either mypage heading or premium text
    const mypage = this.page.getByRole('heading', { name: 'マイページ' });
    const premium = this.page.locator('text=プレミアム会員');
    return (await mypage.count()) > 0 || (await premium.count()) > 0;
  }
}
