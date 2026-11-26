import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const PLAYWRIGHT = 'playwright';
const bundle = await buildFixture('mount-segmented-tone.js');

/** @param {{ value?: string, shape?: 'pill' | 'square' }} props */
function render(props = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true });
	dom.window.eval(bundle);
	const { mount, flushSync, Fixture } = dom.window.__fixture;
	mount(Fixture, { target: dom.window.document.body, props });
	flushSync();
	const group = /** @type {HTMLElement} */ (dom.window.document.querySelector('[role="radiogroup"]'));
	const click = (/** @type {string} */ v) => {
		/** @type {HTMLElement} */ (group.querySelector(`[id$="-${v}"]`)).click();
		flushSync();
	};
	return { group, click };
}

test('shape="square" adds the square class; the default stays a pill', () => {
	assert.ok(render().group.classList.contains('seg-square'));
	assert.ok(!render({ shape: 'pill' }).group.classList.contains('seg-square'));
});

test('the selected option tone inks the thumb; color overrides tone; neutral and untoned leave it uninked', () => {
	const { group, click } = render();
	const thumb = /** @type {HTMLElement} */ (group.querySelector('.seg-thumb'));
	const ink = () => thumb.style.color;
	assert.equal(ink(), 'var(--ok)', 'success is the ok tone');
	assert.ok(group.classList.contains('seg-toned'));
	click('danger');
	assert.equal(ink(), 'var(--danger)');
	click('custom');
	assert.equal(ink(), 'rgb(1, 2, 3)');
	for (const v of ['neutral', 'plain']) {
		click(v);
		assert.equal(ink(), '', v);
		assert.ok(!group.classList.contains('seg-toned'), v);
	}
});

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

test('square tiles: neutral ring at rest, selected thumb ringed in its tone; pill items stay ringless', { skip }, async () => {
	const styles = (
		await Promise.all(
			['tokens', 'themes', 'reset', 'utilities'].map((f) =>
				readFile(new URL(`../src/lib/styles/${f}.css`, import.meta.url), 'utf8')
			)
		)
	).join('\n');
	const instance = await browser.launch();
	try {
		const page = await instance.newPage({ viewport: { width: 900, height: 400 } });
		await page.setContent(
			`<!doctype html><html data-theme="dark" data-mode="dark"><head><style>${styles}</style></head><body></body></html>`
		);
		await page.addScriptTag({ content: bundle });
		/** @param {{ value: string, shape: string }} props */
		const probe = (props) =>
			page.evaluate(async (/** @type {{ value: string, shape: string }} */ props) => {
				const { mount, unmount, flushSync, Fixture } = /** @type {any} */ (globalThis).__fixture;
				const app = mount(Fixture, { target: document.body, props });
				flushSync();
				await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
				const root = /** @type {HTMLElement} */ (document.querySelector('.seg'));
				const color = (/** @type {string} */ v) => {
					const el = document.createElement('i');
					el.style.color = v;
					root.append(el);
					const c = getComputedStyle(el).color;
					el.remove();
					return c;
				};
				const shadow = (/** @type {Element} */ el) => getComputedStyle(el).boxShadow;
				const out = {
					placed: root.classList.contains('placed'),
					radius: getComputedStyle(root).borderRadius,
					trackBg: getComputedStyle(root).backgroundColor,
					thumb: shadow(/** @type {Element} */ (root.querySelector('.seg-thumb'))),
					selected: shadow(/** @type {Element} */ (root.querySelector('.seg-item.selected'))),
					rest: shadow(/** @type {Element} */ (root.querySelector('.seg-item:not(.selected)'))),
					count: getComputedStyle(/** @type {Element} */ (root.querySelector('.seg-count'))).color,
					itemRadius: getComputedStyle(/** @type {Element} */ (root.querySelector('.seg-item'))).borderTopLeftRadius,
					want: {
						danger: color('var(--danger)'),
						text: color('var(--text)'),
						edge: color('var(--control-edge)'),
						custom: color('rgb(1, 2, 3)'),
						rsm: getComputedStyle(root).getPropertyValue('--r-sm').trim(),
						rmd: getComputedStyle(root).getPropertyValue('--r-md').trim()
					}
				};
				unmount(app);
				return out;
			}, props);
		const inset = (/** @type {string} */ c) => `${c} 0px 0px 0px 1px inset`;

		const danger = await probe({ value: 'danger', shape: 'square' });
		assert.ok(danger.placed, 'thumb placed');
		assert.equal(danger.radius, danger.want.rmd);
		assert.equal(danger.itemRadius, danger.want.rsm);
		assert.equal(danger.trackBg, 'rgba(0, 0, 0, 0)', 'no track fill');
		assert.ok(danger.thumb.startsWith(inset(danger.want.danger)), `thumb ring ${danger.thumb}`);
		assert.equal(danger.selected, 'none', 'the thumb carries the selected ring');
		assert.equal(danger.rest, inset(danger.want.edge), 'unselected tiles keep a neutral ring');
		assert.equal(danger.count, danger.want.danger, 'the selected count takes the tone');

		const custom = await probe({ value: 'custom', shape: 'square' });
		assert.ok(custom.thumb.startsWith(inset(custom.want.custom)), `color wins over tone: ${custom.thumb}`);

		const plain = await probe({ value: 'plain', shape: 'square' });
		assert.ok(plain.thumb.startsWith(inset(plain.want.text)), `untoned square ring ${plain.thumb}`);

		const pill = await probe({ value: 'danger', shape: 'pill' });
		assert.ok(pill.thumb.startsWith(inset(pill.want.danger)), `pill thumb ring ${pill.thumb}`);
		assert.equal(pill.rest, 'none', 'pill segments have no ring at rest');

		const pillPlain = await probe({ value: 'plain', shape: 'pill' });
		assert.ok(!pillPlain.thumb.includes('inset'), `untoned pill thumb keeps only its shadow: ${pillPlain.thumb}`);
	} finally {
		await instance.close();
	}
});
