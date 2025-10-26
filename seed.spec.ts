import { test } from '@playwright/test';

// noop seed to avoid interfering with test registration
test('seed noop', async ({ page }) => {
  await page.goto('about:blank');
});
