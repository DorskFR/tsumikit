import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { buildFixture } from './fixtures/build.mjs';
import { contrast } from './theme-contrast.mjs';

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

/** @param {string} dir @param {string[]} files */
const read = async (dir, files) =>
	(await Promise.all(files.map((f) => readFile(new URL(`../src/lib/${dir}/${f}.css`, import.meta.url), 'utf8')))).join(
		'\n'
	);

for (const look of ['default', 'depth', 'tactile', 'editorial'])
	for (const [theme, mode] of [
		['dark', 'dark'],
		['light', 'light'],
		['mocha', 'dark']
	])
		test(`a solid custom badge paints readable ink (${look}, ${theme})`, { skip }, async () => {
			const [bundle, styles] = await Promise.all([
				buildFixture('mount-badge-ink.js'),
				Promise.all([
					read('styles', ['tokens', 'themes', 'reset', 'utilities']),
					read('looks', ['depth', 'tactile', 'editorial'])
				]).then((parts) => parts.join('\n'))
			]);
			const instance = await browser.launch();
			try {
				const page = await instance.newPage({ viewport: { width: 900, height: 1600 } });
				await page.setContent(
					`<!doctype html><html data-theme="${theme}" data-mode="${mode}"${look === 'default' ? '' : ` data-look="${look}"`}><head><style>${styles}</style></head><body></body></html>`
				);
				await page.addScriptTag({ content: bundle });
				await page.evaluate(() => {
					const { mount, flushSync, Fixture } = /** @type {any} */ (globalThis).__fixture;
					mount(Fixture, { target: document.body });
					flushSync();
				});
				const ids = await page.evaluate(() => [...document.querySelectorAll('.badge')].map((b) => b.id));
				assert.ok(ids.length >= 24, 'fixture badges');
				for (const id of ids) {
					if (id.startsWith('hover-')) await page.hover(`#${id}`);
					await page.waitForTimeout(id.startsWith('hover-') ? 400 : 0);
					const got = await page.evaluate((/** @type {string} */ id) => {
						const canvas = new OffscreenCanvas(1, 1);
						const ctx = /** @type {OffscreenCanvasRenderingContext2D} */ (canvas.getContext('2d'));
						/** @param {string} value */
						const hex = (value) => {
							ctx.clearRect(0, 0, 1, 1);
							ctx.fillStyle = value;
							ctx.fillRect(0, 0, 1, 1);
							const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
							return { hex: `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`, a };
						};
						const badge = /** @type {HTMLElement} */ (document.getElementById(id));
						const ink = /** @type {HTMLElement} */ (badge.querySelector('.badge-ink > b'));
						const bg = getComputedStyle(badge).backgroundColor;
						return { ink: hex(getComputedStyle(ink).color), bg: hex(bg), raw: bg, own: badge.style.color };
					}, id);
					if (id.startsWith('active-') && got.bg.a < 255) continue;
					assert.equal(got.bg.a, 255, `${id} ${got.own}: opaque fill under the ink, got ${got.raw}`);
					const ratio = contrast(got.ink.hex, got.bg.hex);
					assert.ok(ratio >= 4.5, `${id} ${got.own}: ink ${got.ink.hex} on ${got.bg.hex} = ${ratio.toFixed(2)}`);
				}
			} finally {
				await instance.close();
			}
		});
