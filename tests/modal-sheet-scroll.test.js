import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { buildFixture } from './fixtures/build.mjs';

const source = await readFile(
	new URL('../src/lib/components/molecules/Modal.svelte', import.meta.url),
	'utf8'
);

test('Modal: the <dialog> is not a scroll container; the sheet body owns scrolling', () => {
	const modalRule = source.match(/\n\t\.modal\s*{([^}]*)}/s)?.[1] ?? '';
	assert.match(modalRule, /overflow:\s*clip;/);
	assert.match(source, /\.sheet-body\s*{[^}]*overflow-y:\s*auto;/s);
});

/** @returns {Promise<import('playwright').BrowserType | null>} */
async function chromium() {
	try {
		const { chromium } = await import('playwright');
		return existsSync(chromium.executablePath()) ? chromium : null;
	} catch {
		return null;
	}
}

const browser = await chromium();

test(
	'Modal mobile sheet: opening focus never scrolls the dialog and the slide-in stays visible',
	{
		skip: browser ? false : 'playwright chromium executable is not downloaded'
	},
	async () => {
		const [bundle, tokens, reset] = await Promise.all([
			buildFixture('mount-modal-sheet-scroll.svelte.js'),
			readFile(new URL('../src/lib/styles/tokens.css', import.meta.url), 'utf8'),
			readFile(new URL('../src/lib/styles/reset.css', import.meta.url), 'utf8')
		]);
		const instance = await /** @type {import('playwright').BrowserType} */ (browser).launch();
		try {
			const page = await instance.newPage({
				viewport: { width: 390, height: 844 }
			});
			await page.setContent(
				`<!doctype html><html><head><style>${tokens}\n${reset}</style></head><body></body></html>`
			);
			await page.addScriptTag({ content: bundle });
			const samples = await page.evaluate(
				() =>
					new Promise((resolve) => {
						const { mount, flushSync, Fixture, props } = globalThis.__fixture;
						const live = props({ open: false });
						mount(Fixture, { target: document.body, props: live });
						flushSync();
						const dialog = document.querySelector('dialog');
						const sheet = dialog.querySelector('.sheet');
						live.open = true;
						flushSync();
						const out = {
							scrollTop: [],
							sheetTop: [],
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
			);
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
			const last = samples.sheetTop.at(-1);
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
