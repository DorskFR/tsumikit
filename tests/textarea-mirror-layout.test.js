import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { buildFixture } from './fixtures/build.mjs';

/** Playwright is optional (not a dependency); the test skips without it. */
const PLAYWRIGHT = 'playwright';
/** @type {any} */
const playwright = await import(PLAYWRIGHT).catch(() => null);
const chromium = playwright?.chromium;
const executable = chromium?.executablePath();
const skip = !chromium
	? 'playwright is not installed'
	: !executable || !existsSync(executable)
		? `chromium is not downloaded (${executable ?? 'no executable path'})`
		: false;

const tokens = await readFile(new URL('../src/lib/styles/tokens.css', import.meta.url), 'utf8');
const bundle = await buildFixture('mount-textarea-mirror.js');

/** @typedef {any} Page */

const VALUE = [
	'Deploy notes for the ops rotation, written long enough that this first paragraph wraps onto several visual lines inside a narrow field.',
	'token <redacted>sk-live-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789</redacted> rotates nightly',
	'',
	'Masked run that itself wraps: <redacted>the quick brown fox jumps over the lazy dog and keeps going until the line is forced to wrap at least once</redacted>.',
	'tail line\n'
].join('\n');

/** @param {Page} page */
const overlayLineStarts = (page) =>
	page.evaluate(() => {
		const mirror = /** @type {HTMLElement} */ (document.querySelector('[data-tsu="TextareaMirror"]'));
		const nodes = /** @type {Text[]} */ ([]);
		const walker = document.createTreeWalker(mirror, NodeFilter.SHOW_TEXT);
		for (let n = walker.nextNode(); n; n = walker.nextNode()) {
			if (!(/** @type {Text} */ (n)).parentElement?.classList.contains('tail')) nodes.push(/** @type {Text} */ (n));
		}
		const chars = /** @type {{ node: Text, offset: number }[]} */ ([]);
		for (const node of nodes) for (let i = 0; i < node.length; i++) chars.push({ node, offset: i });
		const tops = chars.map(({ node, offset }) => {
			const r = document.createRange();
			r.setStart(node, offset);
			r.setEnd(node, offset + 1);
			const rects = [...r.getClientRects()];
			return rects.length ? Math.round(rects[0].top) : NaN;
		});
		const starts = [0];
		for (let i = 1; i < tops.length; i++) if (tops[i] > tops[i - 1]) starts.push(i);
		const lineHeight = parseFloat(getComputedStyle(mirror).lineHeight);
		const ta = /** @type {HTMLTextAreaElement} */ (document.querySelector('textarea'));
		return {
			starts,
			lines: new Set(tops.filter((t) => !Number.isNaN(t))).size,
			lineHeight,
			mirrorScrollHeight: mirror.scrollHeight,
			textareaScrollHeight: ta.scrollHeight,
			mirrorClientHeight: mirror.clientHeight,
			textareaClientHeight: ta.clientHeight,
			mirrorRect: mirror.getBoundingClientRect().toJSON(),
			textareaRect: ta.getBoundingClientRect().toJSON()
		};
	});

/** @param {Page} page @param {number} offset */
async function homeFrom(page, offset) {
	await page.evaluate((/** @type {number} */ o) => {
		const ta = /** @type {HTMLTextAreaElement} */ (document.querySelector('textarea'));
		ta.focus();
		ta.setSelectionRange(o, o);
	}, offset);
	await page.keyboard.press('Home');
	return page.evaluate(() => /** @type {HTMLTextAreaElement} */ (document.querySelector('textarea')).selectionStart);
}

/** @param {Page} page @param {Record<string, unknown>} props */
async function mountPage(page, props) {
	await page.setContent(`<!doctype html><html><head><style>${tokens}</style>
<style>body{margin:0;padding:40px;font-family:var(--font-sans)} #host{width:22rem}</style></head>
<body><div id="host"></div></body></html>`);
	await page.addScriptTag({ content: bundle });
	await page.evaluate((/** @type {any} */ p) => {
		const { mount, flushSync, Fixture } = /** @type {any} */ (globalThis).__fixture;
		mount(Fixture, { target: document.getElementById('host'), props: p });
		flushSync();
	}, props);
}

test('mirror overlay lines up with the textarea text: wrapped lines, long unbroken token, masked span', { skip }, async () => {
	const browser = await chromium.launch();
	try {
		const page = await browser.newPage({ viewport: { width: 700, height: 900 } });
		await mountPage(page, { value: VALUE, autoresize: true });

		const geo = await overlayLineStarts(page);
		assert.deepEqual(geo.mirrorRect, geo.textareaRect, 'overlay and textarea share one box');
		assert.equal(geo.mirrorScrollHeight, geo.textareaScrollHeight, 'same content height');
		assert.equal(geo.mirrorClientHeight, geo.textareaClientHeight);
		assert.ok(geo.lines >= 9, `expected wrapping to produce many lines, got ${geo.lines}`);
		assert.ok(geo.starts.length >= 9);

		for (const [i, start] of geo.starts.entries()) {
			const next = geo.starts[i + 1] ?? VALUE.length;
			const probe = next - start > 1 ? start + 1 : start;
			assert.equal(await homeFrom(page, probe), start, `textarea visual line starts at ${start}`);
			if (start > 0) {
				assert.notEqual(await homeFrom(page, start - 1), start, `offset ${start - 1} belongs to the previous line`);
			}
		}

		const cs = await page.evaluate(() => {
			const pick = (/** @type {Element} */ el) => {
				const s = getComputedStyle(el);
				return [s.fontFamily, s.fontSize, s.lineHeight, s.padding, s.borderWidth, s.letterSpacing, s.tabSize, s.whiteSpace, s.overflowWrap, s.wordBreak];
			};
			return {
				mirror: pick(/** @type {Element} */ (document.querySelector('[data-tsu="TextareaMirror"]'))),
				textarea: pick(/** @type {Element} */ (document.querySelector('textarea'))),
				caret: getComputedStyle(/** @type {Element} */ (document.querySelector('textarea'))).caretColor,
				color: getComputedStyle(/** @type {Element} */ (document.querySelector('textarea'))).color,
				masked: getComputedStyle(/** @type {Element} */ (document.querySelector('[data-tsu="TextareaMirror"] .masked'))).color
			};
		});
		assert.deepEqual(cs.mirror, cs.textarea, 'typography and box metrics match');
		assert.equal(cs.color, 'rgba(0, 0, 0, 0)', 'textarea glyphs are transparent');
		assert.notEqual(cs.caret, 'rgba(0, 0, 0, 0)', 'caret stays visible');
		assert.equal(cs.masked, 'rgba(0, 0, 0, 0)', 'masked glyphs are hidden');
	} finally {
		await browser.close();
	}
});

test('typing inside a masked span keeps the caret offset and updates the overlay', { skip }, async () => {
	const browser = await chromium.launch();
	try {
		const page = await browser.newPage({ viewport: { width: 700, height: 600 } });
		const value = 'key <redacted>hunter2</redacted> end';
		await mountPage(page, { value });
		const inside = value.indexOf('hunter2') + 'hun'.length;
		await page.evaluate((/** @type {number} */ o) => {
			const ta = /** @type {HTMLTextAreaElement} */ (document.querySelector('textarea'));
			ta.focus();
			ta.setSelectionRange(o, o);
		}, inside);
		await page.keyboard.type('XYZ');
		const after = await page.evaluate(() => {
			const ta = /** @type {HTMLTextAreaElement} */ (document.querySelector('textarea'));
			const mirror = /** @type {HTMLElement} */ (document.querySelector('[data-tsu="TextareaMirror"]'));
			const masked = /** @type {HTMLElement} */ (mirror.querySelector('.masked'));
			const spans = [...mirror.querySelectorAll('span:not(.tail)')].map((s) => s.textContent).join('');
			const r = document.createRange();
			r.selectNodeContents(masked);
			return {
				value: ta.value,
				selectionStart: ta.selectionStart,
				overlay: spans,
				masked: masked.textContent,
				maskedRect: masked.getBoundingClientRect().toJSON(),
				textareaRect: ta.getBoundingClientRect().toJSON()
			};
		});
		assert.equal(after.value, 'key <redacted>hunXYZter2</redacted> end');
		assert.equal(after.selectionStart, inside + 3);
		assert.equal(after.overlay, after.value);
		assert.equal(after.masked, 'hunXYZter2');
		assert.ok(after.maskedRect.left > after.textareaRect.left && after.maskedRect.right < after.textareaRect.right);
		assert.ok(after.maskedRect.width > 0 && after.maskedRect.height > 0);
	} finally {
		await browser.close();
	}
});

test('a capped textarea scrolls the overlay with it', { skip }, async () => {
	const browser = await chromium.launch();
	try {
		const page = await browser.newPage({ viewport: { width: 700, height: 600 } });
		const value = Array.from({ length: 30 }, (_, i) => `row ${i} <redacted>s${i}</redacted>`).join('\n');
		await mountPage(page, { value, maxHeight: '6rem' });
		const scrolled = await page.evaluate(() => {
			const ta = /** @type {HTMLTextAreaElement} */ (document.querySelector('textarea'));
			const mirror = /** @type {HTMLElement} */ (document.querySelector('[data-tsu="TextareaMirror"]'));
			ta.scrollTop = 120;
			return new Promise((resolve) =>
				requestAnimationFrame(() => resolve({ ta: ta.scrollTop, mirror: mirror.scrollTop, max: ta.scrollHeight - ta.clientHeight }))
			);
		});
		assert.ok(scrolled.max >= 120, `textarea scrolls (${scrolled.max})`);
		assert.equal(scrolled.ta, 120);
		assert.equal(scrolled.mirror, 120);
	} finally {
		await browser.close();
	}
});
