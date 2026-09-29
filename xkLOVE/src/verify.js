const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const OUT = path.join('C:', 'Users', 'JT', 'Desktop', 'LOVE', 'shots');
const URL = 'file:///C:/Users/JT/Desktop/LOVE/site/index.html';
const EXE = 'C:/Users/JT/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';

const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function run(name, viewport) {
  const browser = await chromium.launch({
    executablePath: EXE,
    args: ['--autoplay-policy=no-user-gesture-required', '--font-render-hinting=none'],
  });
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });

  await page.goto(URL, { waitUntil: 'load' });
  const shot = async (n) => {
    await page.screenshot({ path: path.join(OUT, `${name}_${n}.png`) });
  };

  await wait(600);
  await shot('01_prologue_blank');
  await wait(4200);
  await shot('02_prologue_text');

  // tap the light
  await page.mouse.click(viewport.width / 2, viewport.height * 0.36);
  await wait(1200);
  await page.mouse.click(viewport.width / 2, viewport.height / 2);
  await wait(3400);
  await shot('03_awaken');

  await page.mouse.click(viewport.width / 2, viewport.height / 2);
  await wait(1800);
  await shot('04_memory_orb');

  // 4 fragments
  for (let i = 0; i < 4; i++) {
    await page.mouse.click(viewport.width / 2, viewport.height / 2);
    await wait(2400);
    if (i === 0) await shot('05_memory_card1');
    await page.mouse.click(viewport.width / 2, viewport.height / 2);
    await wait(1400);
  }
  await wait(1200);
  await shot('06_approach');

  // long press on the ring element
  const hb = await page.locator('#hold').boundingBox();
  const cx = hb.x + hb.width / 2, cy = hb.y + hb.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await wait(2800);
  await page.mouse.up();

  // 终章：等待信纸状态推进，而不是依赖写死的时长
  await page.waitForFunction(() => window.letterStage === 'page1', null, { timeout: 10000 });
  await wait(1800);
  await shot('07_reveal_page1');

  await page.waitForFunction(() => window.letterStage === 'page2', null, { timeout: 25000 });
  await wait(2200);
  await shot('08_reveal_page2');

  await page.waitForFunction(() => window.letterStage === 'dissolve', null, { timeout: 25000 });
  await wait(3400);
  await shot('09_particle_text');

  await page.waitForFunction(() => window.letterStage === 'done', null, { timeout: 25000 });
  await wait(900);
  await shot('10_replay');

  const state = await page.evaluate(() => ({
    cur: window.cur,
    phase: window.P.phase,
    parts: window.P.parts.length,
    starA: window.starA,
    textTargets: window.textTargets.length,
    textSize: window.textSize,
    letterStage: window.letterStage,
    page2Loaded: !!window.IMG.letter2,
  }));

  // 断言：粒子文字必须真的生成，否则终章等于空白
  if (state.letterStage !== 'done') errs.push('ASSERT: letterStage 未推进到 done，实际 ' + state.letterStage);
  if (!state.page2Loaded) errs.push('ASSERT: 第二页信纸未内联');
  if (state.textTargets === 0 || state.parts === 0) {
    errs.push('ASSERT: 粒子文字点集为空 (textTargets=' + state.textTargets + ', parts=' + state.parts + ')');
  }

  await browser.close();
  return { errs, state };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  // 先清理本脚本自己产出的旧截图，避免改名后留下过期基线
  fs.readdirSync(OUT)
    .filter((f) => /^[md]_\d{2}_.*\.png$/.test(f))
    .forEach((f) => fs.unlinkSync(path.join(OUT, f)));
  const mobile = await run('m', { width: 390, height: 844 });
  console.log('MOBILE', JSON.stringify(mobile, null, 2));
  const desk = await run('d', { width: 1440, height: 900 });
  console.log('DESKTOP', JSON.stringify(desk, null, 2));
})();
