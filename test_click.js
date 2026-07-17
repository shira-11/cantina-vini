const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/');
  
  // click "Vedi Archivio"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('Vedi Archivio'));
    if (btn) btn.click();
  });
  
  await page.waitForTimeout(1000);
  
  // intercept dialogs
  page.on('dialog', async dialog => {
    console.log("Dialog appeared:", dialog.message());
    await dialog.accept();
  });
  
  // click "Totale Bottiglie"
  await page.evaluate(() => {
    const cbs = Array.from(document.querySelectorAll('input[type="checkbox"]'));
    // Find the one in the row with "Totale Bottiglie"
    const td = Array.from(document.querySelectorAll('td')).find(t => t.innerText.includes('Totale Bottiglie'));
    if (td) {
      const tr = td.closest('tr');
      const cb = tr.querySelector('input[type="checkbox"]');
      if (cb) cb.click();
    }
  });
  
  await page.waitForTimeout(1000);
  
  // click trash
  await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span'));
    const trash = spans.find(s => s.innerText.includes('🗑️'));
    if (trash) {
      trash.closest('div').click();
    }
  });
  
  await page.waitForTimeout(2000);
  console.log("Done.");
  await browser.close();
})();
