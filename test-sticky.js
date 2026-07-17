const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  
  // Wait for table
  await page.waitForSelector('.data-table');
  
  // Get height of table container
  const containerInfo = await page.evaluate(() => {
    const el = document.querySelector('.table-container');
    return {
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      overflowY: window.getComputedStyle(el).overflowY
    };
  });
  console.log("Container Info:", containerInfo);
  
  const thInfo = await page.evaluate(() => {
    const el = document.querySelector('.data-table th');
    const computed = window.getComputedStyle(el);
    return {
      position: computed.position,
      top: computed.top,
      zIndex: computed.zIndex
    };
  });
  console.log("TH Info:", thInfo);

  // Scroll down
  await page.evaluate(() => {
    document.querySelector('.table-container').scrollTop = 500;
  });
  
  const thRect = await page.evaluate(() => {
    const el = document.querySelector('.data-table th');
    const rect = el.getBoundingClientRect();
    return {
      top: rect.top,
      y: rect.y
    };
  });
  console.log("TH Rect after scroll:", thRect);
  
  await browser.close();
})();
