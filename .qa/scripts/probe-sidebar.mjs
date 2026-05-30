import { chromium } from "@playwright/test";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1900, height: 1000 } });
const page = await ctx.newPage();

await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
await page.waitForSelector('input[name=email]', { timeout: 20000 });
await page.fill('input[name=email]', "adediran.dbs+cm@gmail.com");
await page.fill('input[name=password]', "password");
await page.click('button[type=submit]');
await page.waitForTimeout(3000);
await page.goto("http://localhost:5173/dashboard/msa", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);

const info = await page.evaluate(() => {
  const outer = document.querySelector('[data-state="expanded"]');
  const gap = outer?.children?.[0];
  const cs = gap ? getComputedStyle(gap) : null;
  return {
    gapClassName: gap?.className,
    gapComputedWidth: cs?.width,
    gapComputedDisplay: cs?.display,
    sidebarVar: getComputedStyle(outer).getPropertyValue('--sidebar-width'),
    outerWidth: getComputedStyle(outer).width,
    // Check what rules actually win for width
    matchedRules: (() => {
      const rules = [];
      for (const ss of document.styleSheets) {
        try {
          for (const r of ss.cssRules ?? []) {
            const sel = r.selectorText;
            if (!sel) continue;
            if (sel.includes('w-\\[--sidebar-width\\]') || sel.includes('collapsible=offcanvas') || sel.includes('group\\[data')) {
              try { if (gap.matches(sel)) rules.push({ sel, style: r.style.cssText }); } catch {}
            }
          }
        } catch {}
      }
      return rules;
    })(),
  };
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
