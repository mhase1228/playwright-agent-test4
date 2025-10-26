import { test, expect } from '@playwright/test';
import LoginPage from './pages/loginPage';
import ReservationPage from './pages/reservationPage';

test.describe.parallel('TC-04: 予約フロー - プレミアム会員 (POM)', () => {
  test.beforeEach(async ({ page }) => {
    // ensure a clean context: navigate to origin first, then clear storages
    await page.context().clearCookies();
    await page.goto('https://hotel-example-site.takeyaqa.dev/ja/');
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  });

  test('ログインして宿泊予約フォームで合計が計算されること', async ({ page }) => {
    const login = new LoginPage(page);
    const reserve = new ReservationPage(page);

    // 1) ログイン
    await login.gotoHome();
    await login.openLogin();
    await login.login('ichiro@example.com', 'password');
    await expect(page.getByRole('heading', { name: 'マイページ' })).toBeVisible({ timeout: 5000 });

    // 2) プラン一覧 → 予約画面
    await reserve.gotoPlans();
    await reserve.openFirstPlan();
    await expect(page.getByRole('heading', { name: '宿泊予約' })).toBeVisible();

    // 3) フォーム入力（必須項目をすべて埋める）
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    await reserve.fillReservation({
      date: dateStr,
      stay: '1',
      people: '2',
      breakfast: true,
      name: '自動 テスター',
      contact: 'メールでのご連絡',
      email: 'ichiro@example.com'
    });

    // 4) もし iframe で部屋選択が必要なら選択しておく
    await reserve.selectFirstRoom();

    // 5) 確認画面へ進めてから合計の更新を待つ
    await reserve.confirm();
    await page.locator('text=合計').first().waitFor({ timeout: 15000 });
    await reserve.waitForTotalChange(15000);
    await expect(reserve.totalStatus).not.toHaveText('-', { timeout: 15000 });

    // 6) 最低限合計ラベルが表示されていることを確認
    await expect(page.locator('text=合計').first()).toBeVisible();
  });
});
