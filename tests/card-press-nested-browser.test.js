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

/** @param {string} dir @param {string[]} files */
const read = async (dir, files) =>
	(await Promise.all(files.map((f) => readFile(new URL(`../src/lib/${dir}/${f}.css`, import.meta.url), 'utf8')))).join(
		'\n'
	);

for (const look of ['default', 'depth', 'tactile', 'editorial'])
	test(`pressing a nested control or a list row does not move the card (${look})`, { skip }, async () => {
		const [bundle, styles] = await Promise.all([
			buildFixture('mount-card-press.js'),
			Promise.all([
				read('styles', ['tokens', 'themes', 'reset', 'utilities']),
				read('looks', ['depth', 'tactile', 'editorial'])
			]).then((parts) => parts.join('\n'))
		]);
		const instance = await browser.launch();
		try {
			const page = await instance.newPage({ viewport: { width: 1500, height: 600 } });
			await page.setContent(
				`<!doctype html><html data-theme="dark" data-mode="dark"${look === 'default' ? '' : ` data-look="${look}"`}><head><style>${styles}</style></head><body></body></html>`
			);
			await page.addScriptTag({ content: bundle });
			await page.evaluate(() => {
				const { mount, flushSync, Fixture } = /** @type {any} */ (globalThis).__fixture;
				mount(Fixture, { target: document.body });
				flushSync();
			});

			/** @param {string} card @param {string} target */
			const press = async (card, target) => {
				const box = await page.locator(`#${target}`).boundingBox();
				await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
				await page.waitForTimeout(400);
				const rect = (/** @type {string} */ id) => {
					const r = /** @type {HTMLElement} */ (document.getElementById(id)).getBoundingClientRect();
					return [r.x, r.y, r.width, r.height].map((n) => Math.round(n * 100) / 100);
				};
				const before = await page.evaluate(rect, `${card}-btn`);
				await page.mouse.down();
				await page.waitForTimeout(400);
				const during = await page.evaluate(rect, `${card}-btn`);
				const scale = await page.evaluate((/** @type {string} */ id) => {
					const el = /** @type {HTMLElement} */ (document.getElementById(id));
					return { scale: getComputedStyle(el).scale, active: el.matches(':active') };
				}, card);
				await page.mouse.up();
				await page.mouse.move(0, 0);
				await page.waitForTimeout(400);
				return { before, during, ...scale };
			};

			const nested = await press('card', 'card-btn');
			assert.ok(nested.active, 'card is :active while its nested button is pressed');
			assert.equal(nested.scale, 'none', 'no press scale when the press lands on a nested button');
			assert.deepEqual(nested.during, nested.before, 'nested button does not move under the pointer');

			const body = await press('card', 'card-body');
			assert.notEqual(body.scale, 'none', 'pressing the card itself still press-scales');

			for (const target of ['row-body', 'row-btn']) {
				const row = await press('row', target);
				assert.equal(row.scale, 'none', `list-row card never press-scales (${target})`);
				assert.deepEqual(row.during, row.before, `list-row controls stay put (${target})`);
			}
		} finally {
			await instance.close();
		}
	});
