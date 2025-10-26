import { Page, Locator } from '@playwright/test';

export default class NavigationPage {
  readonly page: Page;
  readonly homeLink: Locator;
  readonly plansLink: Locator;
  readonly signupLink: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.homeLink = page.getByRole('link', { name: 'ホーム' });
    this.plansLink = page.getByRole('link', { name: '宿泊予約' });
    this.signupLink = page.getByRole('link', { name: '会員登録' });
    this.loginButton = page.getByRole('button', { name: 'ログイン' });
  }

  async gotoHome() {
    await this.page.goto('https://hotel-example-site.takeyaqa.dev/ja/');
  }

  async clickHome() {
    await this.homeLink.click();
    // home may point to index.html or same root
    await this.page.waitForLoadState('domcontentloaded');
  }

  async openPlans() {
    await this.plansLink.click();
    await this.page.getByRole('heading', { name: '宿泊プラン一覧' }).waitFor();
  }

  async openSignup() {
    await this.signupLink.click();
    // wait for signup page to load (signup.html has a form heading)
    await this.page.waitForLoadState('domcontentloaded');
  }

  async openLogin() {
    await this.loginButton.click();
    await this.page.getByRole('heading', { name: 'ログイン' }).waitFor();
  }
}
