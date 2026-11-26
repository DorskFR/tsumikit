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

const TEXT = 'And give me the list of what we need to do to close the gaps and have a logical system (and a grid / diagram of what a logical system would look like) so we can plan it';

/** @type {{ grouped: boolean, rows: number, resize: string, maxHeight?: string }[]} */
const configs = [];
for (const grouped of [true, false])
	for (const rows of [1, 2])
		for (const resize of ['top', 'bottom'])
			for (const maxHeight of [undefined, '5rem']) configs.push({ grouped, rows, resize, maxHeight });

test('autoresize height only moves when the line count or the bar does', { skip }, async (t) => {
	const [bundle, styles] = await Promise.all([
		buildFixture('mount-textarea-steady.js'),
		Promise.all(
			['tokens', 'themes', 'reset', 'utilities'].map((f) =>
				readFile(new URL(`../src/lib/styles/${f}.css`, import.meta.url), 'utf8')
			)
		).then((parts) => parts.join('\n'))
	]);
	const instance = await browser.launch();
	try {
		const page = await instance.newPage({ viewport: { width: 420, height: 600 } });
		await page.setContent(
			`<!doctype html><html data-theme="dark" data-mode="dark"><head><style>${styles}</style></head><body></body></html>`
		);
		await page.addScriptTag({ content: bundle });
		for (const props of configs) await t.test(JSON.stringify(props), async () => {
			const name = JSON.stringify(props);
			await page.evaluate((/** @type {any} */ p) => {
				const g = /** @type {any} */ (globalThis);
				const { mount, unmount, flushSync, Fixture } = g.__fixture;
				if (g.__app) unmount(g.__app);
				document.body.replaceChildren();
				g.__app = mount(Fixture, { target: document.body, props: p });
				flushSync();
				g.__frames = [];
				g.__loops = 0;
				if (!g.__listening) {
					g.__listening = true;
					window.addEventListener('error', (e) => {
						if (String(e.message).includes('ResizeObserver')) g.__loops++;
					});
					const tick = () => {
						const box = document.getElementById('box');
						if (box) g.__frames.push(box.getBoundingClientRect().height);
						requestAnimationFrame(tick);
					};
					requestAnimationFrame(tick);
				}
			}, props);
			await page.locator('#msg').focus();
			const sample = () =>
				page.evaluate(
					() =>
						new Promise((resolve) => {
							let n = 0;
							const step = () => {
								if (++n < 4) return requestAnimationFrame(step);
								const g = /** @type {any} */ (globalThis);
								const ta = /** @type {HTMLTextAreaElement} */ (document.getElementById('msg'));
								const cs = getComputedStyle(ta);
								const content = ta.scrollHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
								const frames = g.__frames;
								const loops = g.__loops;
								g.__frames = [];
								g.__loops = 0;
								resolve({
									height: document.getElementById('box')?.getBoundingClientRect().height,
									lines: Math.round(content / parseFloat(cs.lineHeight)),
									bar: ta.classList.contains('bar'),
									cap: parseFloat(cs.maxHeight) || Infinity,
									taHeight: ta.offsetHeight,
									frames,
									loops
								});
							};
							requestAnimationFrame(step);
						})
				);
			await sample();
			/** @type {any[]} */
			const steps = [];
			for (const ch of TEXT) {
				await page.keyboard.type(ch);
				steps.push({ ch, ...(await sample()) });
			}
			assert.ok(steps.at(-1).lines >= 3, `${name}: the text wraps past two lines`);
			for (const [i, s] of steps.entries()) {
				assert.equal(s.loops, 0, `${name}: no ResizeObserver loop at char ${i}`);
				assert.deepEqual(new Set(s.frames), new Set([s.height]), `${name}: one painted height at char ${i}`);
				if (i === 0) continue;
				const prev = steps[i - 1];
				assert.ok(s.height >= prev.height, `${name}: appending never shrinks the box (char ${i})`);
				assert.ok(!(prev.bar && !s.bar), `${name}: the bar never drops while appending (char ${i})`);
				if (s.lines === prev.lines && s.bar === prev.bar)
					assert.equal(s.height, prev.height, `${name}: same lines, same height (char ${i})`);
			}
			const before = steps.at(-1);
			await page.keyboard.press('Shift+Enter');
			await page.keyboard.type('x');
			const after = await sample();
			assert.equal(after.lines, before.lines + 1, `${name}: a newline adds a line`);
			if (before.taHeight < before.cap - 1) assert.ok(after.height > before.height, `${name}: a newline grows the box`);
			else assert.equal(after.height, before.height, `${name}: a capped box stays put`);
		});
	} finally {
		await instance.close();
	}
});
