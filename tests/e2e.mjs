// בדיקת קצה לקצה מול vite preview. מריצים: npm run build && npm run e2e
// /api/chat מוחלף במוק, וכך גם ai-menu.js כשאין רשת.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = 'http://localhost:4173';
const SHOTS = 'tests/screens';
fs.mkdirSync(SHOTS, { recursive: true });

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!cond) failures += 1;
};

const server = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 50; i++) {
  try { await fetch(BASE); break; } catch { await new Promise((r) => setTimeout(r, 200)); }
}

const browser = await chromium.launch();
const errors = [];
const chatRequests = [];
let apiMode = 'model';

async function newPage(viewport) {
  const ctx = await browser.newContext({ viewport, locale: 'he-IL' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|status of 503/.test(m.text())) errors.push(`console: ${m.text()}`); });
  const menuPath = process.env.AI_MENU_JS;
  if (menuPath) await page.route('https://appofapp-gh.vercel.app/ai-menu.js', (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(menuPath, 'utf8') }));
  await page.route('**/fonts.googleapis.com/**', (r) => r.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('**/api/chat', async (r) => {
    const body = JSON.parse(r.request().postData());
    chatRequests.push(body);
    if (apiMode === 'nokey') return r.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"no_key"}' });
    return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ reply: '**מסורת**: ואטה היא חלל ואוויר.', mode: 'model' }) });
  });
  return { ctx, page };
}

const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

// דסקטופ
{
  const { ctx, page } = await newPage({ width: 1280, height: 860 });
  await page.goto(`${BASE}/#/`);
  await page.waitForSelector('h1');
  ok(await page.locator('ai-menu .logo').isVisible(), 'A&I logo button in the top bar');
  ok(!(await page.locator('header >> text=העתקת קישור').first().isVisible().catch(() => false)), 'no loose development buttons in the bar');
  ok((await page.locator('ai-menu').getAttribute('chat'))?.startsWith('https://claude.ai/code/'), 'ai-menu has the development chat link');
  ok((await page.locator('ai-menu').getAttribute('research'))?.startsWith('https://claude.ai/chat/'), 'ai-menu has the research project link');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOTS}/home-desktop.png`, fullPage: true });

  // תפריט הלוגו נפתח ומכיל את פעולת המחיקה
  await page.locator('ai-menu .logo').click();
  const menuText = await page.locator('ai-menu').evaluate((el) => el.shadowRoot?.textContent || '');
  ok(menuText.includes('העתקת קישור') && menuText.includes('פרויקט המחקר') && menuText.includes('מחיקת כל התוצאות'), 'logo menu holds copy link and the app delete action');
  await page.keyboard.press('Escape');
  await page.goto(`${BASE}/#/`);

  // ניווט: כל קישור בסרגל
  for (const [label, hash] of [['המסע', '#/journey'], ['מפות', '#/maps'], ['ספרייה', '#/library'], ['חוקה', '#/prakriti'], ['איזון נוכחי', '#/vikriti'], ['יועץ', '#/consultant'], ['התוצאות שלי', '#/results']]) {
    await page.locator('.nav a', { hasText: new RegExp(`^${label}$`) }).click();
    ok((await page.evaluate(() => location.hash)) === hash, `nav "${label}" goes to ${hash}`);
    ok(await page.locator('.topbar').isVisible(), `top bar visible on ${hash}`);
  }
  await page.locator('.brand').click();
  ok((await page.evaluate(() => location.hash)) === '#/', 'app name links to home');

  // מגדל האבנים בדף הבית
  for (const href of ['#/journey', '#/prakriti', '#/vikriti', '#/consultant']) {
    await page.goto(`${BASE}/#/`);
    await page.locator(`.tower a[href="${href}"]`).click();
    ok((await page.evaluate(() => location.hash)) === href, `home tower stone opens ${href}`);
  }

  // ספרייה: כל מושג נפתח
  await page.goto(`${BASE}/#/library`);
  const conceptLinks = await page.locator('main a.concept-link').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  ok(conceptLinks.length >= 23, `library lists ${conceptLinks.length} concepts`);
  for (const href of conceptLinks) {
    await page.goto(`${BASE}/${href}`);
    const claims = await page.locator('main .claim').count();
    ok(claims >= 2, `${href} renders with ${claims} claim labels`);
  }
  await page.goto(`${BASE}/#/library/vata`);
  await page.screenshot({ path: `${SHOTS}/concept-vata.png`, fullPage: true });
  await page.locator('a', { hasText: 'הבא:' }).click();
  ok((await page.evaluate(() => location.hash)) === '#/library/pitta', 'next concept link works');
  await page.goto(`${BASE}/#/library?g=routine`);
  ok(await page.locator('#g-routine').isVisible(), 'library group anchor');


  // שכבה חזותית
  await page.goto(`${BASE}/#/`);
  ok(await page.waitForFunction(() => { const i = document.querySelector('.home-photo img'); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 8000 }).then(() => true).catch(() => false), 'home photo loaded');
  ok(await page.evaluate(() => getComputedStyle(document.querySelector('.home-photo .photo-fade')).maskImage.includes('gradient')), 'photo fades into the background, no frame');
  ok(await page.locator('.now-line .dosha-mark').count() === 2, 'home now line shows the hour and season dosha shapes');
  await page.goto(`${BASE}/#/maps/body`);
  ok(await page.waitForFunction(() => document.querySelector('.anatomy3d canvas') || (document.querySelector('.anatomy img')?.naturalWidth > 0), null, { timeout: 10000 }).then(() => true).catch(() => false), 'anatomy model or illustration loaded');
  ok((await page.locator('.anatomy3d figcaption, .anatomy-layout + figcaption').first().textContent()).includes('Mariana Ruiz'), 'anatomy credit shown');
  ok(await page.waitForSelector('.anatomy3d .callout:has-text("פיטה"), .anatomy img', { timeout: 10000 }).then(() => true).catch(() => false), 'dosha seats labelled in the margin');
  await page.locator('.seat.d-pitta').first().click();
  ok((await page.locator('.seat.d-pitta').first().getAttribute('aria-pressed')) === 'true', 'body map seat selects pitta');
  await page.goto(`${BASE}/#/maps/clock`);
  await page.waitForSelector('main .callout b, main svg text:not(.callout-num)', { timeout: 15000 });
  const centre = (await page.locator('main .callout b, main svg text:not(.callout-num)').allTextContents()).join(' ');
  ok(/שעת (ואטה|פיטה|קאפה)/.test(centre) || ['ואטה', 'פיטה', 'קאפה'].some((d) => centre.includes(d)), 'dosha clock names the current dosha');

  // המסע: פרק אחד בכל מסך, עם דפדוף
  await page.goto(`${BASE}/#/journey`);
  const railCount = await page.locator('.rail button').count();
  ok(railCount === 12, `journey has ${railCount} chapters`);
  for (let i = 0; i < railCount; i++) {
    ok(await page.waitForSelector('.chapter-viz svg, .chapter-viz .viz', { timeout: 8000 }).then(() => true).catch(() => false), `journey chapter ${i + 1} has a visual`);
    if (i < railCount - 1) await page.locator('button', { hasText: 'הפרק הבא' }).click();
  }
  ok((await page.evaluate(() => location.hash)) === '#/journey/limits', 'journey next button walks to the last chapter');
  await page.waitForTimeout(400);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  ok((await page.evaluate(() => location.hash)) === '#/journey/evidence', 'arrow key goes back a chapter');
  await page.locator('.rail button').nth(2).click();
  ok((await page.evaluate(() => location.hash)) === '#/journey/tastes', 'chapter rail jumps to a chapter');

  // מפות: בחירה אחת בכל פעם
  await page.goto(`${BASE}/#/maps`);
  const mapCount = await page.locator('.map-list button').count();
  ok(mapCount === 15, `maps page offers ${mapCount} visuals`);
  for (let i = 0; i < mapCount; i++) {
    await page.locator('.map-list button').nth(i).click();
    ok(await page.waitForSelector('.map-stage svg, .map-stage .viz', { timeout: 8000 }).then(() => true).catch(() => false), `map ${i + 1} renders`);
  }

  // שש הטעמים ומבנה הגוף
  await page.goto(`${BASE}/#/maps/tastes`);
  await page.locator('.seg-btn[aria-label^="חריף"], g[role="button"][aria-label^="חריף"]').first().click({ force: true });
  const tasteText = await page.locator('.tastes3d .legend-block, .tastes .legend-block').first().textContent();
  ok(tasteText.includes('מגביר: ואטה ופיטה') && tasteText.includes('מאזן: קאפה'), 'pungent raises vata and pitta, balances kapha');
  await page.goto(`${BASE}/#/maps/build`);
  await page.locator('.seg-btn', { hasText: 'קאפה' }).click();
  ok((await page.locator('.build3d .legend-block, .build .legend-block').first().textContent()).includes('רחב'), 'kapha build is broad');
  await page.goto(`${BASE}/#/maps/safety`);
  ok(await page.waitForFunction(() => document.querySelectorAll('.gates3d .callout, .gate-legend li').length === 4, null, { timeout: 10000 }).then(() => true).catch(() => false), 'safety gates show four labelled steps');

  await page.goto(`${BASE}/#/maps/gunas`);
  // מעבדת האיכויות
  const lab = page.locator('#map-gunas');
  await lab.locator('.chip', { hasText: 'יום שרב' }).click();
  const gauges = await lab.locator('.gauge').allTextContents();
  ok(gauges[1].includes('מגביר'), `sharav raises pitta (${gauges[1]})`);
  await lab.locator('.chip', { hasText: 'גלידה' }).click();
  const g2 = await lab.locator('.gauge').allTextContents();
  ok(g2[2].includes('מגביר') && g2[0].includes('מאזן'), `ice cream raises kapha (${g2.join(' | ')})`);
  await lab.locator('.pair button', { hasText: /^חם$/ }).click();
  ok(await lab.locator('.chip[aria-pressed="true"]').count() === 0, 'manual quality change clears the preset');
  await lab.screenshot({ path: `${SHOTS}/guna-lab.png` });

  // מפת הידע: מעבר למושג
  await page.goto(`${BASE}/#/maps/graph`);
  await page.waitForTimeout(1800);
  await page.waitForSelector('.callout.clickable, g[role="link"]', { timeout: 10000 });
  await page.locator('.callout.clickable', { hasText: 'אש העיכול' }).or(page.locator('g[role="link"][aria-label="אש העיכול"]')).first().click({ force: true });
  ok((await page.evaluate(() => location.hash)) === '#/library/agni', 'knowledge graph node opens the concept');
  ok(await page.waitForSelector('.concept-viz .viz', { timeout: 5000 }).then(() => true).catch(() => false), 'concept page has its visual');
  await page.locator('[aria-label^="טיקשנה"]').first().click({ force: true });
  ok((await page.locator('.concept-viz figcaption').textContent()).includes('טיקשנה'), 'agni flame hover explains the state');

  // שאלון חוקה
  await page.goto(`${BASE}/#/prakriti`);
  await page.locator('button', { hasText: 'להתחיל' }).click();
  ok((await page.locator('.live-panel').textContent()).includes('אחרי 0'), 'live ternary starts empty');
  for (let i = 0; i < 16; i++) {
    await page.waitForSelector('.option');
    if (i === 3) { await page.locator('button', { hasText: 'לדלג' }).click(); continue; }
    if (i === 5) {
      await page.locator('.option').first().click();
      await page.waitForTimeout(260);
      await page.locator('button', { hasText: 'הקודמת' }).click();
      ok((await page.locator('.mono').first().textContent()).startsWith('6'), 'back button returns to previous question');
    }
    const opts = page.locator('.option');
    await opts.nth(i % 4 === 0 ? 1 : 0).click();
    await page.waitForTimeout(240);
  }
  await page.waitForSelector('text=הדפוס שעלה');
  ok(await page.locator('.ternary3d, svg.ternary').count() >= 1, 'prakriti result shows the ternary');
  ok(await page.locator('.bar-row').count() === 3, 'prakriti result shows three dosha bars');
  ok(await page.locator('text=15 מתוך 16 שאלות').isVisible(), 'prakriti result reports coverage');
  await page.screenshot({ path: `${SHOTS}/prakriti-result.png`, fullPage: true });
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ayur.prakriti.v1')));
  ok(stored?.length === 1 && stored[0].pct, 'prakriti result stored locally');

  // שאלון איזון
  await page.goto(`${BASE}/#/vikriti`);
  await page.locator('label.check').first().click();
  ok(await page.locator('.alert[role=alert]').isVisible(), 'warning sign triggers the doctor alert');
  await page.locator('label.check').first().click();
  ok(!(await page.locator('.alert[role=alert]').isVisible()), 'alert disappears when unchecked');
  await page.locator('button', { hasText: 'אין לי אף אחד' }).click();
  ok(await page.locator('button', { hasText: 'עוד לענות' }).isDisabled(), 'next page locked until the page is answered');
  for (let pg = 0; pg < 3; pg++) {
    const items = page.locator('.items .item');
    const n = await items.count();
    ok(n === 5, `vikriti page ${pg + 1} shows five items`);
    for (let i = 0; i < n; i++) {
      const d = await items.nth(i).getAttribute('data-d');
      await items.nth(i).locator('.scale button').nth(d === 'pitta' ? 3 : 1).click();
    }
    if (pg < 2) await page.locator('button', { hasText: 'לעמוד הבא' }).click();
  }
  await page.locator('button', { hasText: 'לראות את התוצאה' }).click();
  await page.waitForSelector('text=המלצות לאורח חיים');
  ok(await page.locator('h2', { hasText: 'סימנים של עלייה בפיטה' }).isVisible(), 'vikriti detects elevated pitta');
  ok(await page.locator('.d-pitta .dosha-name', { hasText: 'פיטה' }).first().isVisible(), 'pitta recommendations shown');
  await page.screenshot({ path: `${SHOTS}/vikriti-result.png`, fullPage: true });

  // יועצת
  await page.goto(`${BASE}/#/consultant`);
  await page.locator('.chip').first().click();
  await page.waitForSelector('.msg.assistant mark');
  ok(chatRequests.length === 1 && chatRequests[0].messages.at(-1).role === 'user', 'suggestion chip sends one request with the user message');
  ok(await page.locator('text=מחוברת למודל שפה').isVisible(), 'status shows model mode');
  const before = chatRequests.length;
  await page.locator('textarea').fill('יש לי כאב בחזה');
  await page.locator('button[type=submit]').click();
  await page.waitForSelector('.msg.safety');
  ok(chatRequests.length === before, 'emergency message is not sent to the model');
  ok((await page.locator('.msg.safety').last().textContent()).includes('101'), 'emergency reply shows 101');
  await page.locator('textarea').fill('מה המינון של טריפלה?');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelectorAll('.msg.assistant').length >= 2);
  ok(chatRequests.length === before + 1, 'dosage question still reaches the model, with a notice');
  ok((await page.locator('.msg.safety').last().textContent()).includes('מינונים'), 'dosage notice shown');
  apiMode = 'nokey';
  await page.waitForFunction(() => !document.querySelector('main .status')?.textContent.includes('חושבת'));
  await page.locator('textarea').fill('מה זה קאפה?');
  await page.keyboard.press('Enter');
  await page.waitForSelector('text=מצב בסיסי');
  ok(await page.locator('.msg.assistant a.chip[href="#/library/kapha"]').isVisible(), 'basic mode answers from the library');
  await page.screenshot({ path: `${SHOTS}/consultant.png`, fullPage: true });
  apiMode = 'model';

  // תוצאות
  await page.goto(`${BASE}/#/results`);
  ok(await page.locator('.result-row').count() === 2, 'results page lists both results');
  ok(await page.locator('main .ternary3d, main svg.ternary').count() === 1, 'results page shows the combined ternary');
  await page.locator('main .btn.danger', { hasText: /^מחיקה$/ }).first().click();
  ok(await page.locator('.result-row').count() === 1, 'single delete removes a result');
  page.once('dialog', (d) => d.accept());
  await page.locator('main button', { hasText: 'מחיקת כל התוצאות' }).click();
  ok(await page.locator('text=עדיין אין תוצאות').isVisible(), 'delete all clears results');

  await page.goto(`${BASE}/#/safety`);
  ok((await page.locator('main').textContent()).includes('1201'), 'safety page lists ERAN');

  // מסך אחד: בלי גלילה במחשב, ובלי מילים חתוכות ב-SVG
  const FIT = ['#/', '#/journey', '#/journey/tastes', '#/journey/build', '#/journey/year', '#/journey/prakriti', '#/journey/limits', '#/maps', '#/maps/build', '#/maps/tastes', '#/maps/gunas', '#/maps/body', '#/maps/clock', '#/maps/dhatu', '#/maps/safety', '#/maps/seasons', '#/library', '#/library/vata', '#/library/subdoshas', '#/library/rasa', '#/library/products', '#/library/article', '#/prakriti', '#/vikriti', '#/consultant', '#/results', '#/safety'];
  for (const vp of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }]) {
    await page.setViewportSize(vp);
    for (const h of FIT) {
      await page.goto(`${BASE}/${h}`);
      await page.waitForTimeout(3000);
      const r = await page.evaluate(() => {
        const cut = [];
        for (const svg of document.querySelectorAll('main svg')) {
          const sb = svg.getBoundingClientRect();
          if (!sb.width) continue;
          for (const t of svg.querySelectorAll('text')) {
            const tb = t.getBoundingClientRect();
            if (tb.width && (tb.left < sb.left - 1 || tb.right > sb.right + 1 || tb.top < sb.top - 1 || tb.bottom > sb.bottom + 1)) cut.push(t.textContent.trim());
          }
        }
        for (const st of document.querySelectorAll('main .stage3d:not(.callouts-numbered)')) {
          const cv = st.querySelector('canvas')?.getBoundingClientRect();
          for (const l of st.querySelectorAll('.callout')) {
            const lb = l.getBoundingClientRect();
            if (cv && lb.width && lb.right > cv.left + 2 && lb.left < cv.right - 2 && lb.bottom > cv.top && lb.top < cv.bottom) cut.push('ON-GRAPHIC:' + l.textContent.trim());
          }
        }
        for (const st of document.querySelectorAll('main .stage3d')) {
          const sb = st.getBoundingClientRect();
          for (const l of st.querySelectorAll('.callout')) {
            const lb = l.getBoundingClientRect();
            if (lb.width && (lb.left < sb.left - 2 || lb.right > sb.right + 2 || lb.top < sb.top - 2 || lb.bottom > sb.bottom + 2)) cut.push(l.textContent.trim());
          }
        }
        return { fits: document.documentElement.scrollHeight <= innerHeight + 1, h: document.documentElement.scrollHeight, cut };
      });
      ok(r.fits, `${vp.width}x${vp.height}: ${h} fits one screen (${r.h})`);
      ok(!r.cut.length, `${vp.width}x${vp.height}: ${h} no clipped words ${r.cut.join('|')}`);
    }
  }
  await page.setViewportSize({ width: 1280, height: 860 });

  // התקנה
  const cdp = await ctx.newCDPSession(page);
  await page.goto(`${BASE}/#/`);
  await page.waitForFunction(() => navigator.serviceWorker?.controller || navigator.serviceWorker?.ready, null, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(800);
  const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
  ok(installabilityErrors.length === 0, `no installability errors ${JSON.stringify(installabilityErrors)}`);
  await ctx.close();
}

// נייד ומצב כהה
{
  const { ctx, page } = await newPage({ width: 390, height: 844 });
  for (const h of ['#/', '#/journey', '#/journey/tastes', '#/journey/build', '#/maps', '#/maps/tastes', '#/maps/safety', '#/library/agni', '#/library/rasa', '#/library', '#/library/prakriti', '#/prakriti', '#/vikriti', '#/consultant', '#/results', '#/safety']) {
    await page.goto(`${BASE}/${h}`);
    await page.waitForSelector('h1');
    ok(await noHScroll(page), `mobile: no horizontal scroll on ${h}`);
  }
  await page.goto(`${BASE}/#/`);
  ok(await page.locator('ai-menu .logo').isVisible(), 'mobile: logo button visible');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOTS}/home-mobile.png` });
  await page.goto(`${BASE}/#/vikriti`);
  await page.locator('button', { hasText: 'אין לי אף אחד' }).click();
  ok(await noHScroll(page), 'mobile: no horizontal scroll on vikriti items');
  await page.screenshot({ path: `${SHOTS}/vikriti-mobile.png` });
  await page.goto(`${BASE}/#/journey/gunas`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOTS}/journey-mobile.png` });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(`${BASE}/#/`);
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  ok(bg === 'rgb(15, 26, 20)', `dark mode body background ${bg}`);
  await page.screenshot({ path: `${SHOTS}/home-dark.png` });
  await page.goto(`${BASE}/#/maps/graph`);
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${SHOTS}/graph-dark.png` });
  await ctx.close();
}

ok(errors.length === 0, `no page errors ${errors.slice(0, 5).join(' | ')}`);
await browser.close();
server.kill();
console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
