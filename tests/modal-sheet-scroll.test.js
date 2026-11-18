import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { buildFixture } from './fixtures/build.mjs';

const source = await readFile(
	new URL('../src/lib/components/molecules/Modal.svelte', import.meta.url),
	'utf8'
);

test('Modal: the <dialog> never user-scrolls, scroll stays inside it, and the sheet body owns scrolling', () => {
	const modalRule = source.match(/\n\t\.modal\s*{([^}]*)}/s)?.[1] ?? '';
	assert.match(modalRule, /overflow:\s*hidden;/);
	assert.match(modalRule, /overscroll-behavior:\s*contain;/);
	const backdrop = source.match(/\n\t\.modal::backdrop\s*{([^}]*)}/s)?.[1] ?? '';
	assert.match(backdrop, /overflow:\s*hidden;/);
	assert.match(backdrop, /overscroll-behavior:\s*contain;/);
	assert.match(source, /\.sheet-body\s*{[^}]*overflow-y:\s*auto;\s*overscroll-behavior:\s*contain;/s);
	assert.doesNotMatch(source, /\.style\.overflow/);
});

/** Playwright is optional (not a dependency); the test skips without it. */
const PLAYWRIGHT = 'playwright';

/** @returns {Promise<any>} */
async function launch() {
	try {
		const { chromium } = await import(PLAYWRIGHT);
		return await chromium.launch();
	} catch {
		return null;
	}
}

const instance = await launch();

test(
	'Modal mobile sheet: opening focus never scrolls the dialog and the slide-in stays visible',
	{
		skip: instance ? false : 'playwright chromium is not available'
	},
	async () => {
		const [bundle, tokens, reset] = await Promise.all([
			buildFixture('mount-modal-sheet-scroll.svelte.js'),
			readFile(new URL('../src/lib/styles/tokens.css', import.meta.url), 'utf8'),
			readFile(new URL('../src/lib/styles/reset.css', import.meta.url), 'utf8')
		]);
		try {
			const page = await instance.newPage({
				viewport: { width: 390, height: 844 }
			});
			await page.setContent(
				`<!doctype html><html><head><style>${tokens}\n${reset}</style></head><body></body></html>`
			);
			await page.addScriptTag({ content: bundle });
			const samples = /** @type {{ scrollTop: number[], sheetTop: number[], active: string | null | undefined }} */ (await page.evaluate(
				() =>
					new Promise((resolve) => {
						const { mount, flushSync, Fixture, props } = /** @type {any} */ (globalThis).__fixture;
						const live = props({ open: false });
						mount(Fixture, { target: document.body, props: live });
						flushSync();
						const dialog = /** @type {HTMLDialogElement} */ (document.querySelector('dialog'));
						const sheet = /** @type {HTMLElement} */ (dialog.querySelector('.sheet'));
						live.open = true;
						flushSync();
						const out = {
							scrollTop: /** @type {number[]} */ ([]),
							sheetTop: /** @type {number[]} */ ([]),
							active: document.activeElement?.getAttribute('aria-label')
						};
						const started = performance.now();
						const tick = () => {
							out.scrollTop.push(dialog.scrollTop);
							out.sheetTop.push(Math.round(sheet.getBoundingClientRect().top));
							if (performance.now() - started < 600) requestAnimationFrame(tick);
							else resolve(out);
						};
						requestAnimationFrame(tick);
					})
			));
			assert.equal(samples.active, 'Close dialog');
			assert.ok(samples.scrollTop.length > 10, `sampled ${samples.scrollTop.length} frames`);
			assert.deepEqual(
				samples.scrollTop.filter((v) => v !== 0),
				[],
				`dialog scrolled during slide-in: ${samples.scrollTop.join(',')}`
			);
			const distinct = new Set(samples.sheetTop);
			assert.ok(
				distinct.size >= 4,
				`sheet translate did not animate: ${samples.sheetTop.join(',')}`
			);
			const first = samples.sheetTop[0];
			const last = samples.sheetTop[samples.sheetTop.length - 1];
			assert.ok(first - last > 100, `sheet should slide up by >100px, got ${first} -> ${last}`);
			for (let i = 1; i < samples.sheetTop.length; i++) {
				assert.ok(
					samples.sheetTop[i] <= samples.sheetTop[i - 1] + 1,
					`sheet moves monotonically up: ${samples.sheetTop.join(',')}`
				);
			}
		} finally {
			await instance.close();
		}
	}
);
