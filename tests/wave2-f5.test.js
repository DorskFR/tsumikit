import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { JSDOM } from 'jsdom';
import { hasDecl, rule } from './helpers.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/components/${p}`, import.meta.url), 'utf8');
const css = (/** @type {string} */ src) => src.slice(src.indexOf('<style>'));

/** @type {Record<string, string>} */
const files = {
	Slider: await read('atoms/Slider.svelte'),
	Gauge: await read('atoms/Gauge.svelte'),
	Progress: await read('atoms/Progress.svelte'),
	SegmentedProgress: await read('atoms/SegmentedProgress.svelte'),
	TimeDisplay: await read('atoms/TimeDisplay.svelte'),
	SeekSlider: await read('molecules/SeekSlider.svelte'),
	VolumeSlider: await read('molecules/VolumeSlider.svelte'),
	CapBar: await read('molecules/CapBar.svelte'),
	Carousel: await read('molecules/Carousel.svelte'),
	PullToRefresh: await read('molecules/PullToRefresh.svelte'),
	SwipeRow: await read('molecules/SwipeRow.svelte'),
	Metric: await read('molecules/Metric.svelte'),
	Meter: await read('molecules/Meter.svelte'),
	SortableList: await read('molecules/SortableList.svelte'),
	ResizablePanel: await read('layouts/ResizablePanel.svelte')
};

/** Records every playSound call instead of touching the sound store. */
const STUB_SOUND = {
	name: 'stub-sound',
	setup(/** @type {import('esbuild').PluginBuild} */ b) {
		b.onResolve({ filter: /(^|\/)sound$/ }, () => ({ path: 'stub-sound', namespace: 'stub' }));
		b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
			contents: `export function playSound(name, allow = true) { globalThis.__sounds.push([name, allow]); }`,
			loader: 'js'
		}));
	}
};
const bundle = (
	await esbuild.build({
		entryPoints: [join(HERE, 'fixtures/mount-wave2-f5.js')],
		bundle: true,
		write: false,
		format: 'iife',
		platform: 'browser',
		conditions: ['svelte', 'browser', 'import'],
		define: { 'import.meta.env.DEV': 'false' },
		alias: { $lib: join(HERE, '../src/lib') },
		plugins: [STUB_SOUND, sveltePlugin({ compilerOptions: { css: 'injected' } })]
	})
).outputFiles[0].text;

function render(/** @type {Record<string, unknown>} */ props = {}) {
	const dom = new JSDOM('<!doctype html><body></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true });
	const win = dom.window;
	win.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
	if (typeof win.PointerEvent !== 'function') {
		win.PointerEvent = class PointerEvent extends win.MouseEvent {
			/** @param {string} type @param {PointerEventInit} [init] */
			constructor(type, init = {}) {
				super(type, init);
				this.pointerId = init.pointerId ?? 1;
				this.pointerType = init.pointerType ?? 'touch';
			}
		};
	}
	win.Element.prototype.setPointerCapture = () => {};
	win.Element.prototype.releasePointerCapture = () => {};
	win.__sounds = [];
	win.eval(bundle);
	const { mount, flushSync, Fixture } = win.__fixture;
	/** @type {string[]} */
	const fired = [];
	mount(Fixture, { target: win.document.body, props: { fired, ...props } });
	flushSync();
	const doc = win.document;
	const q = (/** @type {string} */ sel) => /** @type {HTMLElement} */ (doc.querySelector(sel));
	const key = (/** @type {Element} */ el, /** @type {string} */ key) => {
		el.dispatchEvent(new win.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
		flushSync();
	};
	const pointer = (/** @type {EventTarget} */ target, /** @type {string} */ type, /** @type {Record<string, unknown>} */ init = {}) => {
		target.dispatchEvent(
			new win.PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId: 1, clientX: 0, clientY: 0, ...init })
		);
		flushSync();
	};
	const sounds = /** @type {() => [string, boolean][]} */ (() => JSON.parse(JSON.stringify(win.__sounds.splice(0))));
	return { win, doc, q, key, pointer, sounds, fired, flush: flushSync };
}

test('nothing plays on mount', () => {
	assert.deepEqual(render().sounds(), []);
});

test('Slider ticks on keyboard steps and mark clicks; drags tick only on discrete sliders', () => {
	const r = render();
	const fine = /** @type {HTMLInputElement} */ (r.q('[data-probe="fine"]'));
	fine.dispatchEvent(new r.win.Event('input', { bubbles: true }));
	r.flush();
	assert.deepEqual(r.sounds(), [['tick', true]], 'keyboard step on a 100-step slider');

	r.pointer(fine, 'pointerdown');
	fine.dispatchEvent(new r.win.Event('input', { bubbles: true }));
	r.pointer(fine, 'pointerup');
	r.flush();
	assert.deepEqual(r.sounds(), [], 'dragging a 100-step slider is silent');

	const coarse = /** @type {HTMLInputElement} */ (r.q('[data-probe="coarse"]'));
	r.pointer(coarse, 'pointerdown');
	coarse.dispatchEvent(new r.win.Event('input', { bubbles: true }));
	r.pointer(coarse, 'pointerup');
	assert.deepEqual(r.sounds(), [['tick', true]], 'dragging a 5-step slider ticks');

	const mark = r.q('[data-tsu="Slider"] .mark');
	mark.click();
	r.flush();
	assert.deepEqual(r.sounds(), [['tick', true]]);
	assert.equal(fine.value, '0');
});

test('SeekSlider and VolumeSlider tick once per keyboard step; the mute button clicks', () => {
	const r = render();
	const seek = r.q('[data-tsu="SeekSlider"]');
	r.key(seek, 'ArrowRight');
	assert.deepEqual(r.sounds(), [['tick', true]]);
	assert.equal(seek.getAttribute('aria-valuenow'), '15');
	r.key(seek, 'Escape');
	assert.deepEqual(r.sounds(), []);

	const slab = r.q('[data-tsu="VolumeSlider"] .vol-slab');
	r.key(slab, 'ArrowDown');
	assert.deepEqual(r.sounds(), [['tick', true]]);
	assert.equal(slab.getAttribute('aria-valuenow'), '45');

	r.q('[data-tsu="VolumeSlider"] [data-part="mute"]').click();
	r.flush();
	assert.deepEqual(r.sounds(), [['click', true]]);
});

test('PullToRefresh ticks once when the pull crosses the threshold', () => {
	const r = render();
	const root = r.q('[data-tsu="PullToRefresh"]');
	Object.defineProperty(root, 'scrollTop', { value: 0, configurable: true });
	r.pointer(root, 'pointerdown', { clientY: 100, pointerType: 'touch' });
	r.pointer(r.win, 'pointermove', { clientY: 120, pointerType: 'touch' });
	assert.deepEqual(r.sounds(), [], 'below the threshold');
	r.pointer(r.win, 'pointermove', { clientY: 400, pointerType: 'touch' });
	assert.equal(root.dataset.state, 'ready');
	assert.deepEqual(r.sounds(), [['tick', true]]);
	r.pointer(r.win, 'pointermove', { clientY: 420, pointerType: 'touch' });
	assert.deepEqual(r.sounds(), [], 'staying past the threshold is silent');
	r.pointer(r.win, 'pointerup', { clientY: 420, pointerType: 'touch' });
	assert.deepEqual(r.sounds(), []);
});

test('SwipeRow clicks when a swipe commits or a hidden action button is pressed', () => {
	const r = render();
	const root = r.q('[data-tsu="SwipeRow"]');
	Object.defineProperty(root, 'clientWidth', { value: 300, configurable: true });
	r.q('[data-part="trailing-button"]').click();
	r.flush();
	assert.deepEqual(r.fired, ['trail']);
	assert.deepEqual(r.sounds(), [['click', true]]);

	const content = r.q('[data-tsu="SwipeRow"] [data-part="content"]');
	r.pointer(content, 'pointerdown', { clientX: 100, clientY: 50 });
	r.pointer(content, 'pointermove', { clientX: 130, clientY: 50 });
	r.pointer(content, 'pointermove', { clientX: 250, clientY: 50 });
	r.pointer(content, 'pointerup', { clientX: 250, clientY: 50 });
	assert.deepEqual(r.fired, ['trail', 'lead']);
	assert.deepEqual(r.sounds(), [['click', true]]);

	r.pointer(content, 'pointerdown', { clientX: 100, clientY: 50 });
	r.pointer(content, 'pointermove', { clientX: 90, clientY: 50 });
	r.pointer(content, 'pointerup', { clientX: 90, clientY: 50 });
	assert.deepEqual(r.fired, ['trail', 'lead']);
	assert.deepEqual(r.sounds(), [], 'a swipe that does not arm is silent');
});

test('VolumeSlider keyboard steps apply without an onchange handler', () => {
	const r = render();
	const slab = r.q('[data-tsu="VolumeSlider"] .vol-slab');
	r.key(slab, 'Home');
	assert.equal(slab.getAttribute('aria-valuenow'), '0');
	r.key(slab, 'End');
	assert.equal(slab.getAttribute('aria-valuenow'), '100');
});

test('sound={false} passes allow=false to every hook', () => {
	const r = render({ silent: true });
	r.key(r.q('[data-tsu="SeekSlider"]'), 'ArrowRight');
	r.key(r.q('[data-tsu="VolumeSlider"] .vol-slab'), 'ArrowUp');
	r.q('[data-tsu="VolumeSlider"] [data-part="mute"]').click();
	r.q('[data-tsu="Slider"] .mark').click();
	r.q('[data-part="trailing-button"]').click();
	r.flush();
	const calls = r.sounds();
	assert.equal(calls.length, 5);
	assert.ok(calls.every(([, allow]) => allow === false));
});

test('every :hover rule sits under the fine-pointer hover media query', () => {
	for (const [name, src] of Object.entries(files)) {
		const style = css(src);
		const gated = style.match(/@media \(hover: hover\) and \(pointer: fine\)\s*{[\s\S]*?\n\t}\n/g) ?? [];
		const outside = gated.reduce((acc, block) => acc.replace(block, ''), style);
		assert.equal((outside.match(/:hover/g) ?? []).length, 0, `${name} has an ungated :hover`);
	}
});

test('no component keeps its own reduced-motion transition kill, raw durations or transition: all', () => {
	for (const [name, src] of Object.entries(files)) {
		const style = css(src);
		assert.doesNotMatch(style, /prefers-reduced-motion[^}]*transition: none/, name);
		assert.doesNotMatch(style, /transition:\s*all\b/, name);
		assert.doesNotMatch(style, /transition[^;]*\b\d+(\.\d+)?m?s\b/, `${name} has a raw transition duration`);
	}
	assert.match(css(files.PullToRefresh), /prefers-reduced-motion: reduce\)\s*{\s*\.ptr-indicator :global\(\.ptr-arrow\)\s*{\s*rotate: none;/);
});

test('slider thumbs scale on press, halo on hover and never animate layout', () => {
	const slider = css(files.Slider);
	assert.match(slider, /input\[type='range'\]:not\(:disabled\):active::-webkit-slider-thumb\s*{\s*scale: 1\.15;/);
	assert.match(slider, /@media \(hover: hover\) and \(pointer: fine\)\s*{\s*input\[type='range'\]:not\(:disabled\):hover::-webkit-slider-thumb\s*{\s*box-shadow: var\(--shadow-sm\), var\(--halo\);/);
	assert.match(rule(slider, "input[type='range']::-webkit-slider-thumb").transition, /scale var\(--dur-press\) var\(--ease-out\), box-shadow var\(--dur-fast\) var\(--ease\)/);
	assert.equal(rule(slider, "input[type='range']:disabled").opacity, 'var(--disabled-opacity)');

	const seek = css(files.SeekSlider);
	assert.equal(rule(seek, '.seek-track').transition, 'scale var(--dur-fast) var(--ease)');
	assert.match(seek, /\.seek--dragging \.seek-track\s*{\s*scale: 1 var\(--seek-track-grow\);/);
	assert.match(seek, /\.seek--dragging \.seek-thumb\s*{\s*scale: 1\.15;/);
	assert.doesNotMatch(seek, /transition:[^;]*\b(height|margin-top|width)\b/);
	assert.equal(rule(seek, '.seek--inert').cursor, 'not-allowed');

	const vol = css(files.VolumeSlider);
	assert.match(vol, /\.vol--dragging \.vol-thumb\s*{\s*scale: 1\.15;/);
	assert.match(rule(vol, '.vol-thumb').transition, /scale var\(--dur-press\) var\(--ease-out\)/);
	assert.equal(rule(vol, ".vol-slab[aria-disabled='true']").cursor, 'not-allowed');
});

test('value indicators and the carousel move on compositor properties only', () => {
	for (const [name, sel] of [
		['Progress', '.bar'],
		['SegmentedProgress', '.bar'],
		['CapBar', '.fill']
	]) {
		const r = rule(css(files[name]), sel);
		assert.match(r.translate, /^calc\(/, name);
		assert.equal(r.transition, 'translate var(--dur-base) var(--ease-out)', name);
	}
	assert.match(files.Progress, /style={indeterminate \? undefined : `--p: \${pct \/ 100}`}/);
	assert.equal(rule(css(files.Gauge), '.fill').transition, 'scale var(--dur-base) var(--ease-out), background var(--dur-fast) var(--ease)');
	assert.equal(rule(css(files.SegmentedProgress), '.stacked .segment').transition, undefined);
	assert.doesNotMatch(css(files.PullToRefresh), /transition:[^;]*\bheight\b/);
	assert.match(css(files.PullToRefresh), /\.ptr-indicator\s*{[^}]*translate: 0 calc\(var\(--ptr-offset, 0px\) - 100%\);/);
	assert.match(files.Carousel, /style:translate="{-index \* 100}% 0"/);
	assert.equal(rule(css(files.Carousel), '.track').transition, 'translate var(--dur-sheet) var(--ease-in-out)');
	assert.match(css(files.ResizablePanel), /\.resizing \.panel\s*{\s*transition: none;/);
	for (const name of Object.keys(files)) {
		if (name === 'ResizablePanel') continue;
		assert.doesNotMatch(css(files[name]), /transition:[^;]*\b(width|height|flex-grow|margin-top|left|top)\b/, name);
	}
});

test('CapBar keeps the hidden bubble inside the track at both ends', () => {
	const bubble = rule(css(files.CapBar), '.bubble');
	assert.equal(bubble.left, 'clamp(0%, var(--cap), 100%)');
	assert.equal(bubble.translate, 'calc(-1 * clamp(0%, var(--cap), 100%)) 0');
	assert.match(files.CapBar, /<div class="fill-clip"><div class="fill"><\/div><\/div>/);
	assert.equal(rule(css(files.CapBar), '.fill-clip').overflow, 'hidden');
});

test('coarse pointers get 24px targets on carousel dots and the panel collapse control', () => {
	const car = css(files.Carousel);
	assert.match(car, /@media \(pointer: coarse\)\s*{\s*\.dots\s*{\s*gap: var\(--sp-4\);\s*}\s*\.dot::before\s*{\s*content: '';\s*position: absolute;\s*inset: calc\(\(100% - var\(--sp-6\)\) \/ 2\);/);
	assert.equal(rule(car, '.dot').position, 'relative');
	const panel = css(files.ResizablePanel);
	assert.match(panel, /@media \(pointer: coarse\)\s*{\s*\.collapse-control\s*{\s*min-inline-size: var\(--sp-6\);/);
	assert.match(panel, /\.collapse-control::before\s*{\s*content: '';\s*position: absolute;/);
});

test('focus rings, disabled opacity and type scale read the shared tokens', () => {
	for (const [name, src] of Object.entries(files)) {
		const style = css(src);
		assert.doesNotMatch(style, /outline: 2px solid/, name);
		assert.doesNotMatch(style, /outline-offset: -?2px/, name);
		assert.doesNotMatch(style, /opacity: 0\.45/, name);
		assert.doesNotMatch(style, /line-height: 1(\.\d)?;/, name);
		assert.doesNotMatch(style, /font-weight: \d{3}/, name);
	}
	assert.ok(hasDecl(css(files.Gauge), '.corner', 'font-size', 'var(--fs-xs)'));
	assert.ok(hasDecl(css(files.Metric), '.metric-chip', 'font-size', 'var(--fs-md)'));
	assert.match(files.ResizablePanel, /<Icon name={toggleIcon} \/>/);
	assert.ok(hasDecl(css(files.ResizablePanel), '.collapse-control', 'font-size', 'var(--icon-sm)'));
});
