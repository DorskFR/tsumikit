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

const TOKEN = {
	accent: '--accent',
	ok: '--ok',
	success: '--ok',
	warn: '--warn',
	danger: '--danger',
	info: '--info',
	neutral: '--text-muted'
};
const FILL = { ...TOKEN, neutral: '--text-faint', muted: '--text-faint' };
const DISTINCT = ['accent', 'ok', 'warn', 'danger', 'info', 'neutral'];

for (const look of ['default', 'depth', 'tactile', 'editorial'])
	for (const theme of ['light', 'dark'])
		test(`EmptyState chip and SegmentedProgress fill follow tone (${look}, ${theme})`, { skip }, async () => {
			const [bundle, styles] = await Promise.all([
				buildFixture('mount-tone-chip.js'),
				Promise.all([
					read('styles', ['tokens', 'themes', 'reset', 'utilities']),
					read('looks', ['depth', 'tactile', 'editorial'])
				]).then((parts) => parts.join('\n'))
			]);
			const instance = await browser.launch();
			try {
				const page = await instance.newPage({ viewport: { width: 900, height: 1600 } });
				await page.setContent(
					`<!doctype html><html data-theme="${theme}"${look === 'default' ? '' : ` data-look="${look}"`}><head><style>${styles}</style></head><body></body></html>`
				);
				await page.addScriptTag({ content: bundle });
				const got = await page.evaluate(
					(/** @type {{ TOKEN: Record<string, string>, FILL: Record<string, string> }} */ { TOKEN, FILL }) => {
						const { mount, flushSync, Fixture } = /** @type {any} */ (globalThis).__fixture;
						mount(Fixture, { target: document.body });
						flushSync();
						const probe = document.body.appendChild(document.createElement('i'));
						/** @param {string} value */
						const resolve = (value) => {
							probe.style.color = value;
							return getComputedStyle(probe).color;
						};
						/** @param {string} sel */
						const css = (sel) => getComputedStyle(/** @type {Element} */ (document.querySelector(sel)));
						/** @param {string} id */
						const chip = (id) => {
							const c = css(`#${id} .empty-chip`);
							return { color: c.color, background: c.backgroundColor, border: c.borderTopColor };
						};
						/** @type {Record<string, any>} */
						const out = { empty: {}, segments: {}, stacked: {}, want: {}, fill: {}, tint: {} };
						for (const [tone, token] of Object.entries(TOKEN)) {
							out.want[tone] = resolve(`var(${token})`);
							out.tint[tone] = {
								background: resolve(`color-mix(in srgb, var(${token}) 14%, transparent)`),
								border: resolve(`color-mix(in srgb, var(${token}) 30%, transparent)`)
							};
							out.empty[tone] = chip(`empty-${tone}`);
						}
						for (const [tone, token] of Object.entries(FILL)) {
							out.fill[tone] = resolve(`var(${token})`);
							for (const id of ['segments', 'stacked'])
								out[id][tone] = css(`#${id} .segment.tone-${tone} .bar`).backgroundColor;
						}
						out.defaultChip = chip('default');
						out.untoned = css('#untoned .segment .bar').backgroundColor;
						return out;
					},
					{ TOKEN, FILL }
				);

				for (const tone of Object.keys(TOKEN)) {
					assert.equal(got.empty[tone].color, got.want[tone], `EmptyState ${tone} glyph`);
					assert.equal(got.empty[tone].background, got.tint[tone].background, `EmptyState ${tone} chip fill`);
					assert.equal(got.empty[tone].border, got.tint[tone].border, `EmptyState ${tone} chip border`);
				}
				assert.deepEqual(got.defaultChip, got.empty.accent, 'EmptyState defaults to accent');
				for (const tone of Object.keys(FILL)) {
					assert.equal(got.segments[tone], got.fill[tone], `segment ${tone} fill`);
					assert.equal(got.stacked[tone], got.fill[tone], `stacked ${tone} fill`);
				}
				assert.equal(got.untoned, got.fill.accent, 'a segment without a tone is accent');

				assert.equal(new Set(DISTINCT.map((t) => got.empty[t].color)).size, DISTINCT.length, 'chip tones differ');
				assert.equal(new Set(DISTINCT.map((t) => got.segments[t])).size, DISTINCT.length, 'segment tones differ');
			} finally {
				await instance.close();
			}
		});
