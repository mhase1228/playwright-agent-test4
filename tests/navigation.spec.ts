import { test, expect } from '@playwright/test';
import NavigationPage from './pages/navigationPage';

test.describe('TC-01: ナビゲーションの基本検証 (POM)', () => {
  test.beforeEach(async ({ page }) => {
    // クリーンな状態で開始
    await page.context().clearCookies();
    // サイトに移動してからストレージをクリア（about:blank で localStorage を触ると SecurityError が出るため）
    await page.goto('https://hotel-example-site.takeyaqa.dev/ja/');
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  });

  test('ホーム・宿泊予約・会員登録・ログインのリンク遷移を確認する', async ({ page }) => {
    const nav = new NavigationPage(page);

    // 1) トップページを開いてホームリンクをクリック -> ホームに遷移
    await nav.gotoHome();
    await nav.clickHome();
    await expect(page).toHaveURL(/index.html|\/ja\/?$/);

    // 2) 宿泊予約に遷移して見出しを確認
    await nav.gotoHome();
    await nav.openPlans();
    await expect(page).toHaveURL(/plans.html/);
    await expect(page.getByRole('heading', { name: '宿泊プラン一覧' })).toBeVisible();

    // 3) 会員登録リンクをクリックして signup ページへ
    await nav.gotoHome();
    await nav.openSignup();
    await expect(page).toHaveURL(/signup.html/);

    // 4) ログインボタンをクリックしてログイン画面が表示される
    await nav.gotoHome();
    await nav.openLogin();
    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible();
  });
});
