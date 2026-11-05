import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { buildFixture } from './fixtures/build.mjs';

const playwright = await import('playwright').catch(() => null);
const chromium = playwright?.chromium;
const executable = chromium?.executablePath();
const skip = !chromium
	? 'playwright is not installed'
	: !executable || !existsSync(executable)
		? `chromium is not downloaded (${executable ?? 'no executable path'})`
		: false;

const tokens = await readFile(new URL('../src/lib/styles/tokens.css', import.meta.url), 'utf8');
const bundle = await buildFixture('mount-rich-select.js');

const PANEL = '.rs-panel';
const TRIGGER = '.rs-trigger';

const panelBox = (page) =>
	page.evaluate((sel) => {
		const el = /** @type {HTMLElement} */ (document.querySelector(sel));
		const rect = el.getBoundingClientRect();
		return {
			display: getComputedStyle(el).display,
			width: rect.width,
			height: rect.height,
			clientRects: el.getClientRects().length,
			open: el.matches(':popover-open'),
		};
	}, PANEL);

const waitHidden = (page) =>
	page.waitForFunction((sel) => getComputedStyle(document.querySelector(sel)).display === 'none', PANEL, {
		timeout: 3000,
	});

const waitShown = (page) =>
	page.waitForFunction((sel) => document.querySelector(sel).matches(':popover-open'), PANEL, {
		timeout: 3000,
	});

async function assertNoLayoutBox(page, when) {
	await waitHidden(page);
	const box = await panelBox(page);
	assert.equal(box.open, false, `${when}: panel is not popover-open`);
	assert.equal(box.display, 'none', `${when}: display`);
	assert.equal(box.clientRects, 0, `${when}: client rects`);
	assert.deepEqual([box.width, box.height], [0, 0], `${when}: box size`);
	assert.equal(await page.locator('[role="option"]:visible').count(), 0, `${when}: no visible options`);
}

async function open(page) {
	await page.click(TRIGGER);
	await waitShown(page);
	const box = await panelBox(page);
	assert.equal(box.display, 'flex');
	assert.ok(box.height > 0);
	assert.equal(await page.locator('[role="option"]:visible').count(), 4);
}

test('closed RichSelect panel has no layout box: before first open, after pick, Escape and outside click', { skip }, async () => {
	const browser = await chromium.launch();
	try {
		const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
		await page.setContent(`<!doctype html><html><head><style>${tokens}</style>
<style>body{margin:0;padding:40px 40px 400px} #rs{width:16rem}</style></head>
<body><div id="rs"></div><div id="outside" style="position:fixed;right:20px;bottom:20px;width:200px;height:200px"></div></body></html>`);
		await page.addScriptTag({ content: bundle });
		await page.evaluate(() => {
			const { mount, flushSync, Fixture } = globalThis.__fixture;
			mount(Fixture, { target: document.getElementById('rs'), props: {} });
			flushSync();
		});

		await assertNoLayoutBox(page, 'before first open');

		await open(page);
		await page.locator('[role="option"]').nth(2).click();
		await assertNoLayoutBox(page, 'after pick');
		assert.equal(await page.textContent('#value'), 'haiku');

		await open(page);
		await page.keyboard.press('Escape');
		await assertNoLayoutBox(page, 'after Escape');

		await open(page);
		await page.click('#outside');
		await assertNoLayoutBox(page, 'after outside click');
	} finally {
		await browser.close();
	}
});
