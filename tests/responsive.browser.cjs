// Development check. Requires Playwright; run while serving the project on port 8080.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const options = { headless: true };
  if (process.env.REDBLOOD_CHROMIUM_PATH) options.executablePath = process.env.REDBLOOD_CHROMIUM_PATH;
  const browser = await chromium.launch(options);
  const origin = process.env.REDBLOOD_TEST_URL || 'http://127.0.0.1:8080';
  try {
    for (const width of [320, 360, 390, 768, 1280, 1440]) {
      for (const language of ['en', 'ml']) {
        const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: width < 600, hasTouch: width < 600 });
        await context.addInitScript(value => localStorage.setItem('redblood_language', value), language);
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        for (const file of ['index.html', 'donor.html', 'admin.html', 'contacts.html']) {
          await page.goto(`${origin}/${file}`);
          await page.evaluate(() => document.fonts.ready);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
          assert.equal(overflow, false, `${file}: horizontal overflow at ${width}px in ${language}`);
          if (await page.locator('.nav-toggle').isVisible()) {
            await page.locator('.nav-toggle').click();
            assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'), 'true');
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'), 'false');
          }
          if (file === 'index.html') {
            const order = await page.evaluate(() => [...document.querySelectorAll('main > section')].map(element => element.id));
            assert.ok(order.indexOf('about') < order.indexOf('find-donor'));
          }
        }
        assert.deepEqual(errors, []);
        await context.close();
      }
    }
    console.log('Passed phone, tablet and desktop layouts in English and Malayalam; menu and About ordering.');
  } finally { await browser.close(); }
})();
