import { Page, Locator } from '@playwright/test';

export default class ReservationPage {
  readonly page: Page;
  readonly firstReserveLink: Locator;
  readonly dateInput: Locator;
  readonly staySpin: Locator;
  readonly peopleSpin: Locator;
  readonly breakfastCheckbox: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly contactSelect: Locator;
  readonly totalStatus: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstReserveLink = page.getByRole('link', { name: 'このプランで予約' }).first();
    this.dateInput = page.getByLabel('宿泊日');
    this.staySpin = page.getByRole('spinbutton', { name: '宿泊数 必須' });
    this.peopleSpin = page.getByRole('spinbutton', { name: '人数 必須' });
    this.breakfastCheckbox = page.getByRole('checkbox', { name: '朝食バイキング' });
    this.nameInput = page.getByLabel('氏名');
    this.emailInput = page.getByLabel('メールアドレス');
    this.contactSelect = page.getByRole('combobox', { name: '確認のご連絡 必須' });
    this.totalStatus = page.getByRole('status').first();
    this.confirmButton = page.getByRole('button', { name: '予約内容を確認する' });
  }

  async gotoPlans() {
    await this.page.goto('https://hotel-example-site.takeyaqa.dev/ja/plans.html');
    await this.page.getByRole('heading', { name: '宿泊プラン一覧' }).waitFor();
  }

  async openFirstPlan() {
    // Get href and navigate directly to avoid new-window complications
    const href = await this.firstReserveLink.getAttribute('href');
    if (!href) throw new Error('予約リンクの href が取得できませんでした');
    const url = new URL(href, 'https://hotel-example-site.takeyaqa.dev/ja/').toString();
    await this.page.goto(url);
    await this.page.getByRole('heading', { name: '宿泊予約' }).waitFor();
  }

  async fillReservation({ date, stay = '1', people = '1', breakfast = false, name = '自動 テスター', contact = 'メールでのご連絡', email = '' }: {
    date: string;
    stay?: string;
    people?: string;
    breakfast?: boolean;
    name?: string;
    contact?: string;
    email?: string;
  }) {
    // Fill the date input and ensure any datepicker UI is closed before interacting with other controls
    await this.dateInput.fill(date);
    // Move focus away and attempt to close the datepicker overlay which may intercept clicks
    await this.dateInput.press('Tab').catch(() => {});
    await this.page.keyboard.press('Escape').catch(() => {});
    // Wait briefly for any datepicker overlay to hide
    await this.page.locator('#ui-datepicker-div').waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
    // Fill numeric fields and dispatch input/change events so the app recalculates totals
    await this.staySpin.fill(stay);
    await this.staySpin.evaluate((el: any) => { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }).catch(() => {});
    await this.peopleSpin.fill(people);
    await this.peopleSpin.evaluate((el: any) => { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }).catch(() => {});

    if (breakfast) {
      // Use force click to avoid any overlay intercepting pointer events
      await this.breakfastCheckbox.click({ force: true }).catch(async () => {
        // fallback to check if click failed
        await this.breakfastCheckbox.check().catch(() => {});
      });
      await this.breakfastCheckbox.evaluate((el: any) => { el.dispatchEvent(new Event('change', { bubbles: true })); }).catch(() => {});
    }

    await this.nameInput.fill(name);
    if (email) {
      await this.emailInput.fill(email).catch(() => {});
    }
    // selectOption by label may sometimes not match; try value fallback if provided
    try {
      await this.contactSelect.selectOption({ label: contact });
    } catch (e) {
      // try selecting by value/text if label fails
      try {
        // open combobox and click the option text (for custom combobox implementations)
        await this.contactSelect.click({ force: true }).catch(() => {});
        const opt = this.page.locator(`text=${contact}`).first();
        await opt.waitFor({ state: 'visible', timeout: 1500 });
        await opt.click({ force: true }).catch(() => {});
        // dispatch change on the underlying select if present
        await this.contactSelect.evaluate((select: HTMLSelectElement, wanted: string) => {
          const opt = Array.from(select.options).find(o => o.textContent?.trim() === wanted || o.value === wanted);
          if (opt) select.value = opt.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }, contact).catch(() => {});
      } catch (ee) {
        // final fallback: try setting value via evaluate
        await this.contactSelect.evaluate((select: HTMLSelectElement, wanted: string) => {
          const opt = Array.from(select.options).find(o => o.textContent?.trim() === wanted || o.value === wanted);
          if (opt) select.value = opt.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }, contact).catch(() => {});
      }
    }

    // Final blur/tab to ensure any listeners run and a short wait for recalculation
    await this.page.keyboard.press('Tab').catch(() => {});
    // Guard against the page being closed (some actions may navigate/close)
    try {
      if (!this.page.isClosed()) {
        await this.page.waitForTimeout(500);
      }
    } catch (e) {
      // ignore timeout/closed errors here; higher-level test will report navigation/closure
    }
  }

  async waitForTotalChange(timeout = 5000) {
    // Poll the locator until its text changes from '-' or timeout elapses.
    const start = Date.now();
    const pollInterval = 200;
    await this.totalStatus.waitFor({ state: 'visible', timeout }).catch(() => {});
    while (Date.now() - start < timeout) {
      if (this.page.isClosed()) break;
      const text = (await this.totalStatus.textContent())?.trim();
      if (text && text !== '-') return;
      // give the app a small nudge: dispatch input/change events on document
      try {
        await this.page.evaluate(() => {
          window.dispatchEvent(new Event('input'));
          window.dispatchEvent(new Event('change'));
        });
      } catch (e) {
        // ignore
      }
      await this.page.waitForTimeout(pollInterval);
    }
  }

  async getTotalText() {
    return this.totalStatus.textContent();
  }

  async confirm() {
    // Defensive confirm: wait for button visible, handle possible navigation triggered by click,
    // and avoid throwing if page was already closed.
    if (this.page.isClosed()) return;
    try {
      await this.confirmButton.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
      // If clicking the button navigates, wait for navigation in parallel to avoid race conditions.
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {}),
        this.confirmButton.click().catch(() => {})
      ]);
    } catch (e) {
      // If the page was closed during the operation, ignore and return; otherwise rethrow.
      if (this.page.isClosed()) return;
      throw e;
    }
  }

  /**
   * Try to select the first available room inside any iframe on the page.
   * Some pages render room choices inside an iframe; the total may not be calculated until a room is selected.
   */
  async selectFirstRoom() {
    try {
      const frames = this.page.frames();
      for (const f of frames) {
        // skip main frame
        if (f === this.page.mainFrame()) continue;
        // wait for frame to be ready
        try { await f.waitForLoadState('domcontentloaded', { timeout: 2000 }); } catch {}
        // try clicking a button or heading that likely selects a room
        const btn = f.locator('button, a, [role="button"]').first();
        if (await btn.count() > 0) {
          await btn.waitFor({ state: 'visible', timeout: 1000 }).catch(() => {});
          await btn.click({ force: true }).catch(() => {});
          return;
        }
        const heading = f.locator('text=スタンダードツイン').first();
        if (await heading.count() > 0) {
          await heading.waitFor({ state: 'visible', timeout: 1000 }).catch(() => {});
          await heading.click({ force: true }).catch(() => {});
          return;
        }
      }
    } catch (e) {
      // ignore selection errors
    }
  }
}
