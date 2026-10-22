import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { JSDOM } from 'jsdom';
import { hasDecl, normalize, rule } from './helpers.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const LIB = join(HERE, '../src/lib');
const read = (/** @type {string} */ p) => readFile(join(LIB, p), 'utf8');

const [popover, menu, tooltip, radial, modal, drawer, scrim, toaster, callout, empty, floating, store] =
	await Promise.all([
		read('components/molecules/Popover.svelte'),
		read('components/molecules/Menu.svelte'),
		read('components/molecules/Tooltip.svelte'),
		read('components/molecules/RadialMenu.svelte'),
		read('components/molecules/Modal.svelte'),
		read('components/molecules/Drawer.svelte'),
		read('components/atoms/Scrim.svelte'),
		read('components/molecules/Toaster.svelte'),
		read('components/molecules/Callout.svelte'),
		read('components/molecules/EmptyState.svelte'),
		read('floating.ts'),
		read('stores/toast.svelte.ts')
	]);
const css = (/** @type {string} */ s) => s.slice(s.indexOf('<style>'), s.indexOf('</style>'));

// `$lib/sound` is swapped for a recorder so every component call is observable
// without an AudioContext.
const STUB_SOUND = {
	name: 'stub-sound',
	setup(/** @type {import('esbuild').PluginBuild} */ b) {
		b.onResolve({ filter: /^\$lib\/sound$/ }, () => ({ path: 'stub-sound', namespace: 'stub' }));
		b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
			contents: `export function playSound(name, allow = true) { globalThis.__played.push([name, allow]); }`,
			loader: 'js'
		}));
	}
};
const out = await esbuild.build({
	entryPoints: [join(HERE, 'fixtures/mount-wave2-f4.svelte.js')],
	bundle: true,
	write: false,
	format: 'iife',
	platform: 'browser',
	conditions: ['svelte', 'browser', 'import'],
	define: { 'import.meta.env.DEV': 'false' },
	alias: { $lib: LIB },
	plugins: [STUB_SOUND, sveltePlugin({ compilerOptions: { css: 'injected' } })]
});
const bundle = out.outputFiles[0].text;

/** @param {Record<string, unknown>} init */
function render(init = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	const w = dom.window;
	w.__played = [];
	w.HTMLDialogElement.prototype.showModal = function () {
		this.setAttribute('open', '');
	};
	w.HTMLDialogElement.prototype.close = function () {
		this.removeAttribute('open');
		this.dispatchEvent(new w.Event('close'));
	};
	const toggle = (/** @type {HTMLElement} */ el, /** @type {'open'|'closed'} */ newState) => {
		const e = new w.Event('toggle');
		Object.assign(e, { oldState: newState === 'open' ? 'closed' : 'open', newState });
		el.dispatchEvent(e);
	};
	w.HTMLElement.prototype.showPopover = function () {
		if (this.hasAttribute('data-open')) return;
		this.setAttribute('data-open', '');
		toggle(this, 'open');
	};
	w.HTMLElement.prototype.hidePopover = function () {
		if (!this.hasAttribute('data-open')) return;
		this.removeAttribute('data-open');
		toggle(this, 'closed');
	};
	w.eval(bundle);
	const { mount, unmount, flushSync, Fixture, props, toasts } = w.__fixture;
	const live = props({ picked: [], ...init });
	const app = mount(Fixture, { target: w.document.body, props: live });
	flushSync();
	const doc = w.document;
	return {
		w,
		doc,
		q: (/** @type {string} */ s) => /** @type {HTMLElement} */ (doc.querySelector(s)),
		played: () => JSON.parse(JSON.stringify(w.__played)),
		names: () => w.__played.map((/** @type {[string, boolean]} */ p) => p[0]),
		toasts,
		props: live,
		flush: flushSync,
		settle: (ms = 0) => new Promise((r) => setTimeout(r, ms)),
		destroy: () => {
			unmount(app);
			flushSync();
		}
	};
}

test('Modal and Drawer: open then close play open/close once each; nothing on mount', () => {
	const r = render();
	assert.deepEqual(r.names(), []);
	r.props.modalOpen = true;
	r.flush();
	assert.deepEqual(r.names(), ['open']);
	r.props.modalOpen = false;
	r.flush();
	assert.deepEqual(r.names(), ['open', 'close']);
	r.props.drawerOpen = true;
	r.flush();
	r.props.drawerOpen = false;
	r.flush();
	assert.deepEqual(r.names(), ['open', 'close', 'open', 'close']);
	r.destroy();
});

test('Modal mounted with open already true stays silent; sound={false} silences the instance', () => {
	const r = render({ modalOpen: true });
	assert.deepEqual(r.names(), []);
	r.props.modalOpen = false;
	r.flush();
	assert.deepEqual(r.played(), [['close', true]]);
	r.destroy();
	const s = render({ sound: false });
	s.props.modalOpen = true;
	s.flush();
	s.props.modalOpen = false;
	s.flush();
	assert.deepEqual(s.played(), [['open', false], ['close', false]]);
	s.destroy();
});

test('ConfirmModal forwards sound to Modal and never plays twice', () => {
	const r = render();
	r.props.confirmOpen = true;
	r.flush();
	assert.deepEqual(r.names(), ['open']);
	/** @type {HTMLButtonElement[]} */
	const buttons = Array.from(r.doc.querySelectorAll('[data-tsu="ConfirmModal"] ~ * button, .sheet-foot button'));
	buttons.find((b) => b.textContent?.trim() === 'Cancel')?.click();
	r.flush();
	// The Cancel Button's own `click` comes from Button; the dialog adds exactly one `close`.
	assert.deepEqual(r.names().filter((/** @type {string} */ n) => n !== 'click'), ['open', 'close']);
	r.destroy();
});

test('Menu: opening plays open, selecting an item plays click then close, disabled rows are silent', () => {
	const r = render();
	r.props.menuOpen = true;
	r.flush();
	assert.deepEqual(r.names(), ['open']);
	const rows = Array.from(r.doc.querySelectorAll('[role="menuitem"]'));
	/** @type {HTMLButtonElement} */ (rows[1]).click();
	r.flush();
	assert.deepEqual(r.names(), ['open'], 'disabled row');
	/** @type {HTMLButtonElement} */ (rows[0]).click();
	r.flush();
	assert.deepEqual(r.names(), ['open', 'click', 'close']);
	assert.deepEqual(r.props.picked, ['rename']);
	r.destroy();
});

test('Popover: Enter/ArrowDown on the trigger opens with data-instant; a pointer open does not', () => {
	const r = render();
	const trigger = r.q('[data-tsu="Popover"]');
	const panel = r.q('.pop-panel');
	trigger.dispatchEvent(new r.w.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
	r.flush();
	assert.ok(panel.hasAttribute('data-open'));
	assert.ok(panel.hasAttribute('data-instant'));
	r.props.menuOpen = false;
	r.flush();
	assert.ok(!panel.hasAttribute('data-open'));
	r.props.menuOpen = true;
	r.flush();
	assert.ok(!panel.hasAttribute('data-instant'), 'a programmatic/pointer open animates');
	r.destroy();
});

test('Toaster: ok/error toasts play success/error once; neutral and info stay silent; preexisting toasts do not', async () => {
	const r = render();
	r.toasts.show('plain', { duration: 0 });
	r.toasts.info('info', 0);
	r.flush();
	assert.deepEqual(r.names(), []);
	r.toasts.ok('saved', 0);
	r.toasts.error('nope', 0);
	r.flush();
	assert.deepEqual(r.names(), ['success', 'error']);
	r.toasts.ok('again', 0);
	r.flush();
	assert.deepEqual(r.names(), ['success', 'error', 'success']);
	for (const t of [...r.toasts.items]) r.toasts.remove(t.id);
	r.destroy();
	const s = render({ sound: false });
	s.toasts.ok('quiet', 0);
	s.flush();
	assert.deepEqual(s.played(), [['success', false]]);
	for (const t of [...s.toasts.items]) s.toasts.remove(t.id);
	s.destroy();
});

test('toast store: dismiss marks leaving and removes after TOAST_EXIT_MS; hover pause/resume keeps the timer', async () => {
	const r = render();
	const id = r.toasts.show('bye', { duration: 0 });
	r.flush();
	r.toasts.dismiss(id);
	r.flush();
	assert.equal(r.toasts.items.find((/** @type {{id:number}} */ t) => t.id === id)?.leaving, true);
	assert.ok(r.q('[data-tsu="Toaster"] [data-leaving]'));
	await r.settle(230);
	r.flush();
	assert.equal(r.toasts.items.length, 0);

	const timed = r.toasts.show('timed', { duration: 60 });
	r.toasts.pause(timed);
	await r.settle(90);
	assert.equal(r.toasts.items.find((/** @type {{id:number}} */ t) => t.id === timed)?.leaving, false, 'paused');
	r.toasts.resume(timed);
	await r.settle(90);
	assert.equal(r.toasts.items.find((/** @type {{id:number}} */ t) => t.id === timed)?.leaving, true, 'resumed and fired');
	await r.settle(230);
	r.destroy();
});

test('floating: placeAt publishes the resolved side, a trigger-facing origin and the shift', () => {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
	const w = dom.window;
	Object.defineProperty(w.document.documentElement, 'clientWidth', { value: 1000 });
	Object.defineProperty(w.document.documentElement, 'clientHeight', { value: 800 });
	const el = w.document.createElement('div');
	el.getBoundingClientRect = () => /** @type {DOMRect} */ ({ width: 200, height: 100, top: 0, left: 0, right: 200, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });
	w.document.body.appendChild(el);
	globalThis.document = w.document;
	try {
		const code = floating.replace(/^export /gm, '').replace(/: [A-Za-z<>\[\]| ]+(?=[,)=])/g, '');
		assert.match(floating, /floating\.dataset\.side = resolved;/);
		assert.match(floating, /setProperty\('--tsu-origin'/);
		assert.match(floating, /setProperty\('--tsu-shift'/);
		assert.match(floating, /bottom: '0 calc\(-1 \* var\(--shift-sm\)\)'/);
		assert.match(floating, /top: '0 var\(--shift-sm\)'/);
		assert.ok(code.length);
	} finally {
		Reflect.deleteProperty(globalThis, 'document');
	}
});

test('Popover panel, Tooltip and Menu rows follow the F6 enter/exit and highlight pattern', () => {
	const pop = normalize(css(popover));
	assert.match(pop, /\.pop-panel { [^}]*transform-origin: var\(--tsu-origin, top left\); opacity: 0; scale: var\(--enter-scale\); transition: opacity var\(--dur-exit\) var\(--ease-out\), scale var\(--dur-exit\) var\(--ease-out\), translate var\(--dur-exit\) var\(--ease-out\), display var\(--dur-exit\) allow-discrete, overlay var\(--dur-exit\) allow-discrete; }/);
	assert.match(pop, /\.pop-panel:popover-open { opacity: 1; scale: 1; translate: 0; transition-duration: var\(--dur-base\); }/);
	assert.match(pop, /@starting-style { \.pop-panel:popover-open { opacity: 0; scale: var\(--enter-scale\); translate: var\(--tsu-shift, 0 calc\(-1 \* var\(--shift-sm\)\)\); } }/);
	assert.match(pop, /\.pop-panel\[data-instant\] { transition-duration: var\(--dur-instant\); }/);
	assert.doesNotMatch(popover, /@keyframes|animation:/);

	const tip = normalize(css(tooltip));
	assert.match(tip, /\.tip:popover-open { opacity: 1; scale: 1; transition: opacity var\(--dur-fast\) var\(--ease-out\), scale var\(--dur-fast\) var\(--ease-out\)/);
	assert.match(tip, /\.tip { [^}]*transition: opacity var\(--dur-exit-fast\) var\(--ease-out\), display/);
	assert.match(tip, /\.tip\[data-instant\] { transition-duration: var\(--dur-instant\); }/);
	assert.match(tooltip, /const WARM_MS = 300;/);
	assert.match(tooltip, /if \(warm\) reveal\(\);\s*else showTimer = setTimeout\(reveal, delay\);/);

	const m = normalize(css(menu));
	assert.match(m, /\.menu-item { [^}]*transition: background-color var\(--dur-fast\) var\(--ease\); }/);
	assert.match(m, /@media \(hover: hover\) and \(pointer: fine\) { \.menu-item:hover:not\(:disabled\) { background: var\(--bg-elevated-2\); transition-duration: var\(--dur-instant\); } }/);
	assert.match(m, /\.menu-item\[data-flash\] { background: color-mix\(in srgb, var\(--accent\) 18%, transparent\); }/);
});

test('Popover trigger: press scale, gated hover, control tier tokens', () => {
	const pop = normalize(css(popover));
	assert.match(pop, /\.pop-trigger:not\(\.bare, \.trigger-toggle\):active:not\(:disabled, \.is-disabled\) { --pop-scale-dur: var\(--dur-press\); scale: var\(--press-scale-sm\); }/);
	assert.match(pop, /\.pop-trigger\.canonical:active:not\(:disabled, \.is-disabled\) { scale: var\(--press-scale\); }/);
	assert.match(pop, /@media \(hover: hover\) and \(pointer: fine\) { :where\(\.pop-trigger:not\(\.bare\):hover:not\(:disabled\)\)/);
	assert.equal(rule(popover, '.pop-trigger.canonical')['font-size'], 'var(--pop-trigger-size, var(--control-fs-md))');
	assert.equal(rule(popover, '.pop-trigger.canonical').padding, 'var(--pop-trigger-pad, var(--sp-2) var(--btn-px-md))');
	assert.equal(rule(popover, '.pop-trigger.canonical')['line-height'], 'var(--lh-none)');
	assert.equal(rule(popover, '.pop-trigger.trigger-sm')['--icon-size'], 'var(--control-icon-sm)');
	assert.equal(rule(popover, '.pop-trigger.trigger-lg')['--icon-size'], 'var(--control-icon-lg)');
	assert.match(normalize(css(popover)), /\.pop-trigger:disabled, \.pop-trigger\.is-disabled { opacity: var\(--disabled-opacity\); cursor: not-allowed; }/);
});

test('RadialMenu: stagger is capped per petal count, hover gated, press on petals and FAB', () => {
	assert.match(radial, /Math\.min\(18, petals\.length > 1 \? 120 \/ \(petals\.length - 1\) : 18\)/);
	assert.match(radial, /style:--radial-stagger={stagger}/);
	const r = normalize(css(radial));
	assert.match(r, /\.radial-petal:active:not\(:disabled\) { --radial-scale-dur: var\(--dur-press\); scale: var\(--press-scale-sm\); }/);
	assert.match(r, /\.radial-fab:active:not\(:disabled\) { --radial-scale-dur: var\(--dur-press\); scale: var\(--press-scale-sm\); }/);
	assert.match(r, /@media \(hover: hover\) and \(pointer: fine\) { \.radial-petal:hover:not\(:disabled\)/);
	assert.doesNotMatch(radial, /size=\{\d+\}/);
	assert.ok(hasDecl(radial, '.radial-glyph', 'font-size', 'var(--icon-md)'));
	assert.ok(hasDecl(radial, '.radial-face-glyph', 'font-size', 'var(--icon-lg)'));
});

test('Modal and Drawer dialogs transition in and out; Scrim fades in from @starting-style', () => {
	const m = normalize(css(modal));
	assert.match(m, /\.modal { [^}]*transition: display var\(--dur-exit-slow\) allow-discrete, overlay var\(--dur-exit-slow\) allow-discrete; }/);
	assert.match(m, /\.modal\[open\]::backdrop { opacity: 1; transition-duration: var\(--dur-base\); }/);
	assert.match(m, /@media \(min-width: 640px\) { \.sheet { [^}]*translate: 0; scale: var\(--enter-scale\); transition: opacity var\(--dur-exit\) var\(--ease-out\), scale var\(--dur-exit\) var\(--ease-out\); } \.modal\[open\] \.sheet { scale: 1; transition-duration: var\(--dur-slow\); }/);
	assert.doesNotMatch(modal, /999px|size=\{18\}|pointer-events: none/);
	const d = normalize(css(drawer));
	assert.match(d, /\.panel { [^}]*will-change: translate;[^}]*--drawer-from: 100% 0; translate: var\(--drawer-from\); transition: translate var\(--dur-exit-slow\) var\(--ease-drawer\); }/);
	assert.match(d, /\.drawer\[data-side='left'\] \.panel { --drawer-from: -100% 0; }/);
	assert.match(d, /\.drawer\[open\]::backdrop { opacity: 1; transition-duration: var\(--dur-base\); }/);
	const s = normalize(css(scrim));
	assert.match(s, /\.scrim { [^}]*transition: opacity var\(--dur-base\) var\(--ease-out\); } @starting-style { \.scrim { opacity: 0; } }/);
});

test('no per-component reduced-motion blocks, keyframes-only enters, literal durations or hover outside the gate', () => {
	for (const [name, src] of Object.entries({ popover, menu, tooltip, modal, drawer, scrim, toaster, callout, empty })) {
		assert.doesNotMatch(src, /prefers-reduced-motion/, name);
		assert.doesNotMatch(src, /@keyframes/, name);
		assert.doesNotMatch(src, /\d+m?s var\(--ease|transition: all/, name);
	}
	assert.doesNotMatch(radial, /prefers-reduced-motion|0\.16s|\* 18ms\)/);
	assert.match(radial, /@keyframes radial-in/, 'the petal scale-in keyframe stays, reset.css halts it under reduce');
	for (const [name, src] of Object.entries({ popover, menu, tooltip, radial, modal, drawer, scrim, toaster, callout, empty })) {
		assert.doesNotMatch(src, /opacity: 0\.45|line-height: [0-9.]+;|border-radius: 999px|gap: [0-9]px|padding: 0 2px/, name);
	}
	assert.match(store, /export const TOAST_EXIT_MS = 200;/);
	assert.ok(hasDecl(callout, '.callout-icon', 'font-size', 'var(--fs-lg)'));
	assert.ok(hasDecl(empty, '.empty-chip', 'font-size', 'var(--fs-xl)'));
	assert.ok(hasDecl(empty, '.empty-title', 'line-height', 'var(--lh-snug)'));
});
