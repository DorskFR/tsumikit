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

for (const theme of ['everforest', 'light'])
	test(`ConfirmModal tone="danger" fills its confirm button with --danger, not the accent (${theme})`, { skip }, async () => {
		const bundle = await buildFixture('mount-confirm-danger.js');
		const instance = await browser.launch();
		try {
			const page = await instance.newPage();
			await page.setContent(`<!doctype html><html data-theme="${theme}"><head><style>${styles}</style></head><body></body></html>`);
			await page.addScriptTag({ content: bundle });
			await page.evaluate(() => {
				const { mount, flushSync, Fixture } = /** @type {any} */ (globalThis).__fixture;
				mount(Fixture, { target: document.body });
				flushSync();
			});
			await page.waitForTimeout(400);
			const got = await page.evaluate(() => {
				const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Delete');
				const probe = (/** @type {string} */ v) => {
					const el = document.createElement('i');
					el.style.color = `var(${v})`;
					document.body.append(el);
					const c = getComputedStyle(el).color;
					el.remove();
					return c;
				};
				const cs = getComputedStyle(/** @type {HTMLElement} */ (btn));
				return { bg: cs.backgroundColor, ink: cs.color, danger: probe('--danger'), accent: probe('--accent'), base: probe('--bg') };
			});
			assert.equal(got.bg, got.danger, JSON.stringify(got));
			assert.notEqual(got.bg, got.accent);
			assert.equal(got.ink, got.base);
		} finally {
			await instance.close();
		}
	});
