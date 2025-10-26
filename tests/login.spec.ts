import { test, expect } from '@playwright/test';
import LoginPage from './pages/loginPage';

test.describe('TC-02: 既存ユーザによるログイン（POM）', () => {
  test.beforeEach(async ({ page }) => {
    // クリーンな状態を確保
    await page.context().clearCookies();
    // サイトに移動してから localStorage/sessionStorage をクリア
    await page.goto('https://hotel-example-site.takeyaqa.dev/ja/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('ichiro@example.com でログインしてマイページ/プレミアム表記が確認できる', async ({ page }) => {
    const login = new LoginPage(page);
    await login.gotoHome();
    await login.openLogin();

    await login.login('ichiro@example.com', 'password');

    // 検証: マイページ見出しまたは「プレミアム会員」テキストが表示されること
    await expect(page.getByRole('heading', { name: 'マイページ' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=プレミアム会員')).toBeVisible({ timeout: 5000 });

    // 追加チェック: POMのisLoggedIn()がtrueを返すこと
    const logged = await login.isLoggedIn();
    expect(logged).toBeTruthy();
  });
});
