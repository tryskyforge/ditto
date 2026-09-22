// Records a guide across the top frame, an open shadow root, a same-origin iframe and a
// cross-origin iframe, then replays it with Guide Me against the built extension.
//
//   pnpm test:e2e                      build, then run headless
//   HEADED=1 pnpm test:e2e             watch it in a real window
//   DITTO_E2E_CHROME=/path/to/chrome   use a specific Chromium / Chrome for Testing binary
//   DITTO_E2E_EXTENSION=/path/to/build  test a different build (default .output/chrome-mv3)
//
// Needs a Chromium that still accepts --load-extension (Playwright's bundled Chromium does:
// `pnpm exec playwright install chromium`). Branded Google Chrome does not.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = process.env.DITTO_E2E_EXTENSION || path.resolve(here, '../../.output/chrome-mv3');
const fixtures = path.join(here, 'fixtures');
const headed = process.env.HEADED === '1';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(what, fn, timeout = 10_000) {
  const end = Date.now() + timeout;
  let last;
  while (Date.now() < end) {
    last = await fn().catch(() => undefined);
    if (last) return last;
    await sleep(200);
  }
  assert.fail(`Timed out waiting for ${what}`);
}

let server;
let port;
let ctx;
let sw;
let driver;
let page;

before(async () => {
  assert.ok(fs.existsSync(path.join(extensionPath, 'manifest.json')), 'Build first: pnpm build');

  server = http.createServer((req, res) => {
    const name = new URL(req.url, 'http://x').pathname.replace(/^\/$/, '/index.html');
    const file = path.join(fixtures, path.basename(name));
    if (!fs.existsSync(file)) return res.writeHead(404).end();
    const html = fs.readFileSync(file, 'utf8').replace('__CROSS_ORIGIN__', `http://127.0.0.1:${port}`);
    res.writeHead(200, { 'content-type': 'text/html' }).end(html);
  });
  await new Promise((resolve) => server.listen(0, resolve));
  port = server.address().port;

  ctx = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'ditto-e2e-')), {
    executablePath: process.env.DITTO_E2E_CHROME || undefined,
    headless: !headed,
    viewport: { width: 1100, height: 800 },
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-proxy-server',
      ...(headed ? [] : ['--headless=new']),
    ],
  });
  [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent('serviceworker');
  const extensionId = new URL(sw.url()).host;

  await sleep(1000);
  for (const p of ctx.pages()) if (p.url().includes('onboarding')) await p.close();

  driver = await ctx.newPage();
  await driver.goto(`chrome-extension://${extensionId}/options.html`);
  page = ctx.pages().find((p) => p !== driver && !p.url().startsWith('chrome-extension')) ?? (await ctx.newPage());
});

after(async () => {
  await ctx?.close();
  server?.close();
});

const send = (type, data) =>
  driver.evaluate(
    ([type, data]) => chrome.runtime.sendMessage({ id: Math.floor(Math.random() * 1e9), type, data, timestamp: Date.now() }),
    [type, data],
  );

const storage = (keys) => sw.evaluate((keys) => chrome.storage.local.get(keys), keys);

const stepsFor = (guideId) =>
  driver.evaluate(
    (guideId) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('ditto');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const all = req.result.transaction('steps').objectStore('steps').getAll();
          all.onsuccess = () =>
            resolve(all.result.filter((s) => s.guideId === guideId).sort((a, b) => a.index - b.index));
        };
      }),
    guideId,
  );

const frames = {
  top: () => page.mainFrame(),
  same: () => page.frame({ url: /frame\.html/ }),
  cross: () => page.frame({ url: /cross\.html/ }),
};

async function highlightedFrames() {
  const found = [];
  for (const [name, frame] of Object.entries(frames)) {
    const has = await frame()
      ?.evaluate(() => !!document.querySelector('ditto-guideme'))
      .catch(() => false);
    if (has) found.push(name);
  }
  return found;
}

async function expectStep(index, frame) {
  await waitFor(`step ${index} highlighted in the ${frame} frame`, async () => {
    const { guideMeSession } = await storage(['guideMeSession']);
    if (guideMeSession?.activeStepIndex !== index) return false;
    const where = await highlightedFrames();
    return where.length === 1 && where[0] === frame;
  });
  const { guideMeBlocked } = await storage(['guideMeBlocked']);
  assert.equal(guideMeBlocked ?? null, null, `step ${index} should not be blocked`);
}

test('Guide Me replays steps in the top frame, shadow DOM, and same- and cross-origin iframes', async () => {
  await page.goto(`http://localhost:${port}/index.html`);
  await page.bringToFront();
  await waitFor('iframes to load', async () => frames.same() && frames.cross());
  await sleep(1000);

  const same = page.frameLocator('#same');
  const cross = page.frameLocator('#cross');

  const started = await send('startRecording', { url: page.url() });
  assert.ok(started.res?.guideId, 'recording should start');
  const guideId = started.res.guideId;
  await sleep(1000);

  await waitFor('opening Go-to step', async () => (await stepsFor(guideId)).length >= 1);
  await page.click('#top-btn');
  await waitFor('top-frame step', async () => (await stepsFor(guideId)).length >= 2);
  await page.locator('x-card').evaluate((el) => {
    el.shadowRoot.getElementById('box').scrollTop = 200;
  });
  await page.click('button.save');
  await waitFor('shadow DOM step', async () => (await stepsFor(guideId)).length >= 3);
  await same.locator('#frame-input').click();
  await same.locator('#frame-input').pressSequentially('hello');
  await sleep(500);
  await cross.locator('#cross-btn').click();
  await waitFor('cross-origin step', async () =>
    (await stepsFor(guideId)).some((s) => s.elementMeta?.cssSelector === '#cross-btn'),
  );

  const stopped = await send('stopRecording');
  assert.equal(stopped.res?.success, true, 'recording should stop');

  const steps = await stepsFor(guideId);
  assert.deepEqual(
    steps.map((s) => [s.action, s.elementMeta?.cssSelector]),
    [
      ['navigate', undefined],
      ['click', '#top-btn'],
      ['click', '.save'],
      ['input', '#frame-input'],
      ['click', '#cross-btn'],
    ],
  );

  for (const p of ctx.pages()) if (p !== page && p !== driver) await p.close();
  await page.reload();
  await page.bringToFront();
  await waitFor('iframes to reload', async () => frames.same() && frames.cross());

  const guideMe = await send('startGuideMe', { guideId });
  assert.equal(guideMe.res?.started, true, 'Guide Me should start');

  await waitFor('Go-to step to advance on its own', async () =>
    (await storage(['guideMeSession'])).guideMeSession?.activeStepIndex === 1,
  );

  await expectStep(1, 'top');
  await page.click('#top-btn');

  await expectStep(2, 'top');
  await page.click('button.save');

  await waitFor('input step to auto-fill inside the same-origin iframe', async () =>
    (await frames.same()?.evaluate(() => document.getElementById('frame-input').value)) === 'hello',
  );

  await expectStep(4, 'cross');
  await cross.locator('#cross-btn').click();

  await waitFor('session to complete', async () => (await storage(['guideMeSession'])).guideMeSession?.active === false);
  const { guideMeBlocked } = await storage(['guideMeBlocked']);
  assert.equal(guideMeBlocked ?? null, null);
});

test('Go-to steps: opening page and typed addresses, not link clicks; Guide Me follows them', async () => {
  await page.goto(`http://localhost:${port}/index.html`);
  await page.bringToFront();
  await sleep(1000);

  const started = await send('startRecording', { url: page.url() });
  const guideId = started.res.guideId;
  await waitFor('opening Go-to step', async () => (await stepsFor(guideId)).length >= 1);

  await page.click('#next-link');
  await page.waitForURL(/frame\.html/);
  await waitFor('link click step', async () => (await stepsFor(guideId)).length >= 2);
  await sleep(1500);

  await page.goto(`http://127.0.0.1:${port}/cross.html`);
  await waitFor('typed Go-to step', async () => (await stepsFor(guideId)).length >= 3);
  await sleep(1500);
  await send('stopRecording');

  const steps = await stepsFor(guideId);
  assert.deepEqual(
    steps.map((s) => [s.action, s.description, s.url]),
    [
      ['navigate', `Go to localhost:${port}/index.html`, `http://localhost:${port}/index.html`],
      ['click', 'Click link "Next page"', `http://localhost:${port}/index.html`],
      ['navigate', `Go to 127.0.0.1:${port}/cross.html`, `http://127.0.0.1:${port}/cross.html`],
    ],
  );
  assert.ok(steps[0].screenshotId && steps[2].screenshotId, 'Go-to steps have a page screenshot');

  await page.goto(`http://localhost:${port}/frame.html`);
  await page.bringToFront();
  const guideMe = await send('startGuideMe', { guideId });
  assert.equal(guideMe.res?.started, true);

  await expectStep(1, 'top');
  await page.click('#next-link');
  await waitFor('Guide Me to open the typed address', async () => page.url().includes('127.0.0.1') && page.url().includes('cross.html'));
  await waitFor('session to complete', async () => (await storage(['guideMeSession'])).guideMeSession?.active === false);
  const { guideMeBlocked } = await storage(['guideMeBlocked']);
  assert.equal(guideMeBlocked ?? null, null);
});


test('Guide Me finds hover-revealed targets and jumps ahead when the tab lands on a later step page', async () => {
  const base = `http://localhost:${port}/status.html`;
  await page.goto(base);
  await page.bringToFront();
  await sleep(1000);

  const started = await send('startRecording', { url: page.url() });
  const guideId = started.res.guideId;
  await waitFor('opening Go-to step', async () => (await stepsFor(guideId)).length >= 1);

  await page.hover('#status');
  await page.click('#status .msg');
  await waitFor('status click step', async () => (await stepsFor(guideId)).length >= 2);
  await page.hover('#menu');
  await page.click('#archive');
  await waitFor('menu item step', async () => (await stepsFor(guideId)).length >= 3);
  await page.click('#repos-link');
  await page.waitForURL(/tab=repositories/);
  await waitFor('link click step', async () => (await stepsFor(guideId)).length >= 4);
  await sleep(1500);
  await page.click('#repo-btn');
  await waitFor('button step', async () => (await stepsFor(guideId)).length >= 5);
  await sleep(500);
  await send('stopRecording');

  const steps = await stepsFor(guideId);
  assert.deepEqual(
    steps.map((s) => [s.action, s.elementMeta?.cssSelector, s.url]),
    [
      ['navigate', undefined, base],
      ['click', '#status', base],
      ['click', '#archive', base],
      ['click', '#repos-link', base],
      ['click', '#repo-btn', `${base}?tab=repositories`],
    ],
  );
  assert.equal(steps[1].elementMeta.textContent, 'Focusing');

  await page.mouse.move(700, 700);
  const guideMe = await send('startGuideMe', { guideId });
  assert.equal(guideMe.res?.started, true);

  await expectStep(1, 'top');
  await page.click('#status');

  await expectStep(2, 'top');
  const highlighted = await page.evaluate(() => {
    const menu = document.getElementById('menu').getBoundingClientRect();
    const host = document.querySelector('ditto-guideme');
    return !!host && menu.width > 0;
  });
  assert.ok(highlighted, 'hidden menu item falls back to its visible menu');

  await page.goto(`${base}?tab=repositories`);
  await waitFor('Guide Me to jump to the step recorded on this page', async () =>
    (await storage(['guideMeSession'])).guideMeSession?.activeStepIndex === 4,
  );
  await expectStep(4, 'top');
  await page.click('#repo-btn');
  await waitFor('session to complete', async () => (await storage(['guideMeSession'])).guideMeSession?.active === false);
});

test('Go-to steps can be turned off in Settings', async () => {
  await sw.evaluate(() => chrome.storage.local.set({ recordGoToSteps: false }));
  try {
    await page.goto(`http://localhost:${port}/index.html`);
    await page.bringToFront();
    await sleep(1000);

    const started = await send('startRecording', { url: page.url() });
    const guideId = started.res.guideId;
    await sleep(1500);
    await page.goto(`http://127.0.0.1:${port}/cross.html`);
    await sleep(2500);
    await page.click('#cross-btn');
    await waitFor('click step', async () => (await stepsFor(guideId)).length >= 1);
    await sleep(1000);
    await send('stopRecording');

    assert.deepEqual(
      (await stepsFor(guideId)).map((s) => s.action),
      ['click'],
    );
  } finally {
    await sw.evaluate(() => chrome.storage.local.remove('recordGoToSteps'));
  }
});
