import { chromium, devices } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['iPhone 13'],
  });
  const page = await context.newPage();

  page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.type()} - ${msg.text()}`));
  page.on('pageerror', error => console.error(`BROWSER ERROR: ${error}`));

  console.log("Navigating to http://localhost:5173...");
  await page.goto('http://localhost:5173', { waitUntil: 'load', timeout: 120000 });
  
  await page.waitForTimeout(2000); // wait for render
  
  // take a screenshot
  await page.screenshot({ path: 'mobile_view.png' });
  console.log("Screenshot taken.");

  const menuButton = await page.$('button[aria-label="Open menu"]');
  if (menuButton) {
     console.log("Clicking menu button...");
     await menuButton.click();
     await page.waitForTimeout(1000);
  } else {
     console.log("Menu button not found.");
  }
  
  await browser.close();
})();
