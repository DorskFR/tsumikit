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

const styles = (
	await Promise.all(
		['tokens', 'themes', 'reset', 'utilities'].map((f) => readFile(new URL(`../src/lib/styles/${f}.css`, import.meta.url), 'utf8'))
	)
).join('\n');

const TARGETS = {
	inline: '#inline',
	link: '#link',
	bare: '.pop-trigger.bare',
	badge: '#badge .action',
	switch: '.switch',
	checkbox: '.checkbox'
};

/** @param {{ coarse: boolean }} opts */
async function measure({ coarse }) {
	const bundle = await buildFixture('mount-hit-target.js');
	const instance = await browser.launch();
	try {
		const page = await instance.newPage({ viewport: { width: 600, height: 900 }, ...(coarse ? { hasTouch: true, isMobile: true } : {}) });
		await page.setContent(`<!doctype html><html data-theme="dark"><head><style>${styles}</style></head><body></body></html>`);
		await page.addScriptTag({ content: bundle });
		await page.evaluate(() => {
			const { mount, flushSync, Fixture } = /** @type {any} */ (globalThis).__fixture;
			mount(Fixture, { target: document.body });
			flushSync();
		});
		return await page.evaluate(
			([targets, reach]) => {
				/** @type {Record<string, { h: number, top: boolean, bottom: boolean, coarse: boolean }>} */
				const out = {};
				for (const [name, sel] of Object.entries(targets)) {
					const el = /** @type {HTMLElement} */ (document.querySelector(sel));
					const r = el.getBoundingClientRect();
					const cx = r.left + r.width / 2;
					const cy = r.top + r.height / 2;
					const hits = (/** @type {number} */ y) => el.contains(document.elementFromPoint(cx, y));
					out[name] = { h: Math.round(r.height * 10) / 10, top: hits(cy - reach), bottom: hits(cy + reach), coarse: matchMedia('(pointer: coarse)').matches };
				}
				return out;
			},
			/** @type {const} */ ([TARGETS, coarse ? 19 : 11])
		);
	} finally {
		await instance.close();
	}
}

test('on a fine pointer every small control answers clicks across a 24px-tall band', { skip }, async () => {
	const report = await measure({ coarse: false });
	assert.ok(Object.values(report).filter((v) => v.h < 24).length >= 3, `fixture renders undersized boxes: ${JSON.stringify(report)}`);
	for (const [name, v] of Object.entries(report)) assert.ok(!v.coarse && v.top && v.bottom, `${name} ${JSON.stringify(v)}`);
});

test('on a coarse pointer the same controls answer across a 40px-tall band', { skip }, async () => {
	const report = await measure({ coarse: true });
	for (const [name, v] of Object.entries(report)) assert.ok(v.coarse && v.top && v.bottom, `${name} ${JSON.stringify(v)}`);
});
