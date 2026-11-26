import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { buildFixture } from './fixtures/build.mjs';

const PLAYWRIGHT = 'playwright';

/** @returns {Promise<any>} */
async function chromium() {
	try {
		const { chromium } = await import(PLAYWRIGHT);
		await (await chromium.launch()).close();
		return chromium;
	} catch {
		return null;
	}
}

const browser = await chromium();
const skip = browser ? false : 'playwright chromium cannot launch';

test('a shade card hides only its outer frame; head and foot separators keep the solid card colour', { skip }, async () => {
	const [bundle, styles] = await Promise.all([
		buildFixture('mount-card-divider.js'),
		Promise.all(
			['tokens', 'themes', 'reset', 'utilities'].map((f) =>
				readFile(new URL(`../src/lib/styles/${f}.css`, import.meta.url), 'utf8')
			)
		).then((parts) => parts.join('\n'))
	]);
	const instance = await browser.launch();
	try {
		const page = await instance.newPage();
		await page.setContent(
			`<!doctype html><html data-theme="dark" data-mode="dark"><head><style>${styles}</style></head><body></body></html>`
		);
		await page.addScriptTag({ content: bundle });
		const got = await page.evaluate(() => {
			const { mount, flushSync, Fixture } = /** @type {any} */ (globalThis).__fixture;
			mount(Fixture, { target: document.body });
			flushSync();
			const card = (/** @type {string} */ id) => {
				const el = /** @type {HTMLElement} */ (document.getElementById(id));
				const css = (/** @type {string} */ sel) => getComputedStyle(/** @type {Element} */ (el.querySelector(sel)));
				return {
					frame: getComputedStyle(el).borderTopColor,
					head: css(':scope > .card-head').borderBottomColor,
					headWidth: css(':scope > .card-head').borderBottomWidth,
					foot: css(':scope > .card-foot').borderTopColor
				};
			};
			return { shade: card('shade'), solid: card('solid') };
		});
		assert.equal(got.shade.frame, 'rgba(0, 0, 0, 0)', 'no outer frame');
		assert.notEqual(got.solid.frame, 'rgba(0, 0, 0, 0)');
		assert.notEqual(got.shade.headWidth, '0px');
		assert.equal(got.shade.head, got.solid.head, 'head separator painted');
		assert.equal(got.shade.foot, got.solid.foot, 'foot separator painted');
		assert.notEqual(got.shade.head, 'rgba(0, 0, 0, 0)');
	} finally {
		await instance.close();
	}
});
