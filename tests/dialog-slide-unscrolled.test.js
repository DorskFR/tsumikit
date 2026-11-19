import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { pinScroll, showModalUnscrolled } from '../src/lib/dialog.ts';
import { buildFixture } from './fixtures/build.mjs';

test('showModalUnscrolled undoes the scroll that showModal focus applies', () => {
	const dialog = /** @type {any} */ ({
		scrollTop: 0,
		scrollLeft: 0,
		showModal() {
			this.scrollTop = 120;
			this.scrollLeft = 571;
		}
	});
	showModalUnscrolled(dialog);
	assert.deepEqual([dialog.scrollTop, dialog.scrollLeft], [0, 0]);
	dialog.scrollTop = 5;
	pinScroll(dialog);
	assert.equal(dialog.scrollTop, 0);
});

for (const name of ['Drawer', 'Modal']) {
	test(`${name} opens through showModalUnscrolled and pins dialog scroll`, async () => {
		const source = await readFile(
			new URL(`../src/lib/components/molecules/${name}.svelte`, import.meta.url),
			'utf8'
		);
		assert.doesNotMatch(source, /\.showModal\(\)/);
		assert.match(source, /showModalUnscrolled\(dialogEl\)/);
		assert.match(source, /onscroll=\{\(e\) => pinScroll\(e\.currentTarget\)\}/);
	});
}

/** Playwright is optional (not a dependency); engines that are not installed skip. */
const PLAYWRIGHT = 'playwright';

/** @param {'chromium' | 'firefox'} engine */
async function launch(engine) {
	try {
		const pw = await import(PLAYWRIGHT);
		return await pw[engine].launch();
	} catch {
		return null;
	}
}

const bundle = await buildFixture('mount-drawer-slide.svelte.js');
const [tokens, reset] = await Promise.all([
	readFile(new URL('../src/lib/styles/tokens.css', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/styles/reset.css', import.meta.url), 'utf8')
]);

for (const engine of /** @type {const} */ (['chromium', 'firefox'])) {
	const browser = await launch(engine);
	for (const side of /** @type {const} */ (['right', 'bottom'])) {
		test(
			`Drawer ${side} (${engine}): opening focus never scrolls the dialog and the panel slides in`,
			{ skip: browser ? false : `playwright ${engine} is not available` },
			async () => {
				const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
				try {
					await page.setContent(
						`<!doctype html><html><head><style>${tokens}\n${reset}\n:root{--dur-sheet:600ms}</style></head><body></body></html>`
					);
					await page.addScriptTag({ content: bundle });
					const s = /** @type {{ scroll: number[], pos: number[] }} */ (
						await page.evaluate(
							(/** @type {string} */ side) =>
								new Promise((resolve) => {
									const { mount, flushSync, Fixture, props } = /** @type {any} */ (globalThis).__fixture;
									const live = props({ open: false, side });
									mount(Fixture, { target: document.body, props: live });
									flushSync();
									const dialog = /** @type {HTMLDialogElement} */ (document.querySelector('dialog'));
									const panel = /** @type {HTMLElement} */ (dialog.querySelector('.panel'));
									live.open = true;
									flushSync();
									const out = { scroll: /** @type {number[]} */ ([]), pos: /** @type {number[]} */ ([]) };
									const started = performance.now();
									const tick = () => {
										out.scroll.push(dialog.scrollTop + dialog.scrollLeft);
										const r = panel.getBoundingClientRect();
										out.pos.push(Math.round(side === 'bottom' ? r.top : r.left));
										if (performance.now() - started < 800) requestAnimationFrame(tick);
										else resolve(out);
									};
									tick();
								}),
							side
						)
					);
					assert.deepEqual(
						s.scroll.filter((v) => v !== 0),
						[],
						`dialog scrolled during slide-in: ${s.scroll.join(',')}`
					);
					const first = s.pos[0];
					const last = s.pos[s.pos.length - 1];
					assert.ok(first - last > 100, `panel should slide in by >100px, got ${first} -> ${last}`);
					for (let i = 1; i < s.pos.length; i++) {
						assert.ok(s.pos[i] <= s.pos[i - 1] + 1, `panel moves monotonically in: ${s.pos.join(',')}`);
					}
				} finally {
					await page.close();
				}
			}
		);
	}
	if (browser) test.after(() => browser.close());
}
