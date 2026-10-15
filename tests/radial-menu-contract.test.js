import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { JSDOM } from 'jsdom';
import { compile, preprocess } from 'svelte/compiler';
import { fanAngles, fanLayout } from '../src/lib/floating.ts';
import { slideSelect } from '../src/lib/slide-select.ts';
import { buildFixture } from './fixtures/build.mjs';
import { hasDecl, normalize } from './helpers.mjs';

const read = (/** @type {string} */ p) => readFile(new URL(p, import.meta.url), 'utf8');
const [source, index, readme, page] = await Promise.all([
	read('../src/lib/components/molecules/RadialMenu.svelte'),
	read('../src/lib/index.ts'),
	read('../README.md'),
	read('../src/routes/+page.svelte'),
]);
const css = source.slice(source.indexOf('<style>'));
const bundle = await buildFixture('mount-radial-menu.js');

const VW = 400;
const VH = 800;

/** @param {any} win */
function polyfillPopover(win) {
	const proto = win.HTMLElement.prototype;
	proto.showPopover = function () {
		this.setAttribute('data-open', '');
	};
	proto.hidePopover = function () {
		this.removeAttribute('data-open');
	};
}

/**
 * @param {Record<string, unknown>} [props]
 * @param {{ left: number, top: number, size?: number }} [at] trigger rect in viewport px
 */
function render(props = {}, at = { left: 170, top: 700 }) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true,
	});
	const win = /** @type {any} */ (dom.window);
	polyfillPopover(win);
	const docEl = win.document.documentElement;
	Object.defineProperty(docEl, 'clientWidth', { value: VW, configurable: true });
	Object.defineProperty(docEl, 'clientHeight', { value: VH, configurable: true });
	const size = at.size ?? 60;
	const rect = { left: at.left, top: at.top, right: at.left + size, bottom: at.top + size, width: size, height: size };
	const origRect = win.HTMLElement.prototype.getBoundingClientRect;
	win.HTMLElement.prototype.getBoundingClientRect = function () {
		return this.matches('[data-tsu="RadialMenu"]') ? rect : origRect.call(this);
	};
	win.eval(bundle);
	const { mount, unmount, flushSync, Fixture } = win.__fixture;
	const app = mount(Fixture, { target: win.document.body, props: { props } });
	flushSync();
	const doc = win.document;
	const fab = /** @type {HTMLButtonElement} */ (doc.querySelector('[data-tsu="RadialMenu"]'));
	const panel = /** @type {HTMLElement} */ (doc.querySelector('[data-radial-panel]'));
	const petals = () => /** @type {HTMLButtonElement[]} */ ([...doc.querySelectorAll('.radial-petal')]);
	const labels = () => petals().map((p) => p.querySelector('.radial-label')?.textContent);
	const focused = () => doc.activeElement?.querySelector?.('.radial-label')?.textContent ?? doc.activeElement?.id;
	const text = (/** @type {string} */ id) => doc.querySelector(`#${id}`)?.textContent;
	const settle = async () => {
		await new Promise((r) => setTimeout(r, 0));
		flushSync();
	};
	/** @param {Element} el @param {string} k */
	const key = (el, k) => {
		el.dispatchEvent(new win.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
		flushSync();
	};
	/** @param {Element} el @param {string} type @param {Record<string, unknown>} [init] */
	const fire = (el, type, init = {}) => {
		const Ctor = type.startsWith('pointer') ? (win.PointerEvent ?? win.MouseEvent) : win.MouseEvent;
		el.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true, button: 0, ...init }));
		flushSync();
	};
	const center = { x: rect.left + size / 2, y: rect.top + size / 2 };
	const point = (/** @type {HTMLElement} */ p) => ({ x: Number.parseFloat(p.style.left), y: Number.parseFloat(p.style.top) });
	return { win, doc, fab, panel, petals, labels, focused, text, settle, key, fire, center, point, unmount: () => unmount(app) };
}

test('RadialMenu is exported, documented and demoed in a bottom bar and a page corner', () => {
	assert.match(normalize(index), /export \{ default as RadialMenu, type RadialArc, \} from '\.\/components\/molecules\/RadialMenu\.svelte';/);
	assert.match(readme, /### RadialMenu/);
	assert.match(readme, /\| `RadialMenu` \| `--radial-radius`, `--radial-petal-size`, `--radial-fab-size` \|/);
	assert.match(page, /<section class="section" id="radial-menu">/);
	assert.match(page, /\{ id: 'radial-menu', label: 'RadialMenu'/);
	assert.equal([...page.matchAll(/<RadialMenu\b/g)].length >= 2, true, 'bar and corner demos');
	assert.match(page, /\{#snippet status\(\)\}/);
});

test('prop surface reuses MenuItem and the shared floating + slide helpers', () => {
	assert.match(source, /import type \{ MenuItem \} from '\$lib\/components\/molecules\/Menu\.svelte';/);
	assert.match(source, /import \{ type Bounds, fanLayout, type Point \} from '\$lib\/floating';/);
	assert.match(source, /import \{ slideSelect \} from '\$lib\/slide-select';/);
	for (const decl of [
		/items: MenuItem\[\];/,
		/label: string;/,
		/trigger\?: Snippet<\[\{ open: boolean \}\]>;/,
		/caption\?: Snippet \| string;/,
		/tone\?: Tone;/,
		/arc\?: RadialArc;/,
		/radius\?: string;/,
		/petalSize\?: string;/,
		/scrim\?: boolean;/,
		/status\?: Snippet;/,
		/open = \$bindable\(false\)/,
		/arc = \{ from: 200, to: -20 \}/,
		/scrim = true/,
	]) {
		assert.match(source, decl);
	}
});

test('tokens: petals, FAB and overrides with defaults; reduced motion drops the scale-in', () => {
	assert.equal(hasDecl(css, '.radial-petal', 'background', 'var(--bg-elevated)'), true);
	assert.equal(hasDecl(css, '.radial-petal', 'border', '1px solid var(--border-strong)'), true);
	assert.equal(hasDecl(css, '.radial-petal', 'box-shadow', 'var(--shadow-md)'), true);
	assert.equal(hasDecl(css, '.radial-petal', 'width', 'max(var(--radial-petal-size, 3.5rem), var(--touch-target))'), true);
	assert.equal(hasDecl(css, '.radial-glyph', 'color', 'var(--text-muted)'), true);
	assert.equal(hasDecl(css, '.radial-fab', 'background', 'var(--bg-elevated-2)'), true);
	assert.equal(hasDecl(css, '.radial-fab', 'box-shadow', 'var(--shadow-lg)'), true);
	assert.equal(hasDecl(css, '.radial-fab', 'width', 'var(--radial-fab-size, 3.75rem)'), true);
	assert.equal(hasDecl(css, '.radial-fab', 'border', '2px solid var(--radial-ring, var(--accent))'), true);
	assert.equal(hasDecl(css, '.radial-panel', 'z-index', 'var(--z-modal)'), true);
	assert.equal(hasDecl(css, '.radial-fab', '--radial-reach', 'var(--radial-radius, 8.5rem)'), true);
	assert.match(source, /'--radial-reach', '8\.5rem'/);
	assert.match(css, /\.radial-petal\.danger \{\s*border-color: var\(--danger\);/);
	assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.radial-petal \{\s*animation: none;/);
	assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i);
});

test('fanAngles spreads petals evenly from `from` to `to`', () => {
	assert.deepEqual(fanAngles(5, 200, -20), [200, 145, 90, 35, -20]);
	assert.deepEqual(fanAngles(1, 200, -20), [90]);
	assert.deepEqual(fanAngles(0, 200, -20), []);
});

test('fanLayout keeps the preferred radius when the arc fits', () => {
	const bounds = { left: 0, top: 0, right: 1000, bottom: 1000 };
	const { radius, points } = fanLayout({ center: { x: 500, y: 500 }, count: 3, from: 180, to: 0, radius: 100, petal: 50, bounds });
	assert.equal(radius, 100);
	const round = points.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));
	assert.deepEqual(round, [{ x: 400, y: 500 }, { x: 500, y: 400 }, { x: 600, y: 500 }]);
});

test('fanLayout shrinks the radius so a corner fan stays inside the bounds', () => {
	const bounds = { left: 8, top: 8, right: 392, bottom: 792 };
	const { radius, points } = fanLayout({ center: { x: 40, y: 760 }, count: 6, from: 200, to: -20, radius: 136, petal: 56, minRadius: 58, bounds });
	assert.ok(radius < 136, `radius shrank (${radius})`);
	for (const p of points) {
		assert.ok(p.x - 28 >= bounds.left - 1e-6 && p.x + 28 <= bounds.right + 1e-6, `x ${p.x}`);
		assert.ok(p.y - 28 >= bounds.top - 1e-6 && p.y + 28 <= bounds.bottom + 1e-6, `y ${p.y}`);
	}
});

test('fanLayout shifts the fan in when even the minimum radius would overflow', () => {
	const bounds = { left: 8, top: 8, right: 392, bottom: 792 };
	const { radius, points } = fanLayout({ center: { x: 20, y: 780 }, count: 6, from: 200, to: -20, radius: 136, petal: 56, minRadius: 100, bounds });
	assert.equal(radius, 100);
	for (const p of points) {
		assert.ok(p.x - 28 >= bounds.left - 1e-6, `x ${p.x}`);
		assert.ok(p.y + 28 <= bounds.bottom + 1e-6, `y ${p.y}`);
	}
});

test('slideSelect arms past the threshold, disarms back inside it and returns the armed index on release', () => {
	/** @type {number[]} */
	const arms = [];
	const s = slideSelect({ pick: ({ dx }) => (dx > 0 ? 1 : 0), onarm: (i) => arms.push(i) });
	const ev = (/** @type {number} */ x, /** @type {number} */ y) => /** @type {PointerEvent} */ ({ clientX: x, clientY: y, pointerId: 1 });
	s.down(ev(100, 100));
	assert.equal(s.active, true);
	s.move(ev(105, 100));
	assert.deepEqual(arms, [], 'inside the threshold');
	assert.equal(s.slid, false);
	s.move(ev(130, 100));
	s.move(ev(70, 100));
	s.move(ev(101, 101));
	assert.deepEqual(arms, [1, 0, -1]);
	assert.equal(s.slid, true);
	s.move(ev(130, 100));
	assert.equal(s.up(), 1);
	assert.equal(s.active, false);
	assert.equal(s.up(), -1, 'a stray release fires nothing');
});

test('trigger ARIA: menu button wired to the menu, round FAB with caption', () => {
	const { fab, doc, unmount } = render();
	assert.equal(fab.tagName, 'BUTTON');
	assert.equal(fab.getAttribute('aria-label'), 'Bot');
	assert.equal(fab.getAttribute('aria-haspopup'), 'menu');
	assert.equal(fab.getAttribute('aria-expanded'), 'false');
	assert.equal(fab.dataset.test, 'fab', 'rest props land on the trigger');
	const menu = doc.getElementById(/** @type {string} */ (fab.getAttribute('aria-controls')));
	assert.equal(menu?.getAttribute('role'), 'menu');
	assert.equal(menu?.getAttribute('aria-label'), 'Bot');
	assert.equal(fab.querySelector('.radial-caption')?.textContent?.trim(), '● bot');
	unmount();
});

test('keyboard: opening focuses the first enabled petal; arrows walk the arc skipping disabled; Home/End', async () => {
	const { fab, panel, labels, focused, key, settle, doc, text, unmount } = render();
	fab.focus();
	fab.click();
	await settle();
	assert.equal(fab.getAttribute('aria-expanded'), 'true');
	assert.equal(panel.hasAttribute('data-open'), true);
	assert.equal(text('events'), 'open');
	assert.deepEqual(labels(), ['Disarm', 'Mode', 'Go zone', 'Sell all', 'Recover', 'Menu']);
	assert.equal(focused(), 'Disarm');
	const roles = [...doc.querySelectorAll('[role="menu"] > *')].map((el) => el.getAttribute('role'));
	assert.deepEqual(new Set(roles), new Set(['menuitem']));
	const tabbable = [...doc.querySelectorAll('.radial-petal')].filter((p) => p.getAttribute('tabindex') === '0');
	assert.equal(tabbable.length, 1, 'roving tabindex');
	/** @type {string[]} */
	const walk = [];
	for (let i = 0; i < 6; i++) {
		key(/** @type {Element} */ (doc.activeElement), 'ArrowRight');
		walk.push(/** @type {string} */ (focused()));
	}
	assert.deepEqual(walk, ['Mode', 'Go zone', 'Recover', 'Menu', 'Disarm', 'Mode'], '→ follows the arc, skips Sell all, wraps');
	key(/** @type {Element} */ (doc.activeElement), 'ArrowLeft');
	assert.equal(focused(), 'Disarm');
	key(/** @type {Element} */ (doc.activeElement), 'ArrowUp');
	assert.equal(focused(), 'Menu');
	key(/** @type {Element} */ (doc.activeElement), 'ArrowDown');
	assert.equal(focused(), 'Disarm');
	key(/** @type {Element} */ (doc.activeElement), 'End');
	assert.equal(focused(), 'Menu');
	key(/** @type {Element} */ (doc.activeElement), 'Home');
	assert.equal(focused(), 'Disarm');
	unmount();
});

test('keyboard: ←/→ follow the screen when the arc runs right to left', async () => {
	const { fab, focused, key, settle, doc, unmount } = render({ arc: { from: -20, to: 200 } });
	fab.click();
	await settle();
	assert.equal(focused(), 'Disarm');
	key(/** @type {Element} */ (doc.activeElement), 'ArrowLeft');
	assert.equal(focused(), 'Mode', 'Disarm is rightmost, so ← moves to the next petal');
	unmount();
});

test('Enter activates the petal, closes and returns focus to the trigger', async () => {
	const { fab, focused, key, settle, doc, text, petals, unmount } = render();
	fab.click();
	await settle();
	key(/** @type {Element} */ (doc.activeElement), 'ArrowRight');
	/** @type {HTMLElement} */ (doc.activeElement).click();
	await settle();
	assert.equal(text('picked'), 'Mode');
	assert.equal(fab.getAttribute('aria-expanded'), 'false');
	assert.equal(petals().length, 0);
	assert.equal(doc.activeElement, fab);
	assert.equal(text('events'), 'open,close');
	unmount();
});

test('Escape and Tab close and return focus to the trigger', async () => {
	const { fab, key, settle, doc, panel, unmount } = render();
	fab.click();
	await settle();
	assert.notEqual(doc.activeElement, fab);
	key(/** @type {Element} */ (doc.activeElement), 'Escape');
	assert.equal(fab.getAttribute('aria-expanded'), 'false');
	assert.equal(panel.hasAttribute('data-open'), false);
	assert.equal(doc.activeElement, fab);
	fab.click();
	await settle();
	key(/** @type {Element} */ (doc.activeElement), 'Tab');
	assert.equal(fab.getAttribute('aria-expanded'), 'false');
	assert.equal(doc.activeElement, fab);
	unmount();
});

test('disabled petals cannot be activated; danger petals carry the danger class', async () => {
	const { fab, settle, petals, text, unmount } = render();
	fab.click();
	await settle();
	const [disarm, , , sell] = petals();
	assert.equal(sell.disabled, true);
	assert.equal(disarm.classList.contains('danger'), true);
	sell.click();
	assert.equal(text('picked'), '');
	unmount();
});

test('tap toggles: a press without a slide opens, the next one closes; the trailing click is swallowed', async () => {
	const { fab, fire, settle, center, unmount } = render({ scrim: false });
	fire(fab, 'pointerdown', { clientX: center.x, clientY: center.y });
	fire(fab, 'pointerup', { clientX: center.x, clientY: center.y });
	fire(fab, 'click', { detail: 1 });
	await settle();
	assert.equal(fab.getAttribute('aria-expanded'), 'true');
	fire(fab, 'pointerdown', { clientX: center.x, clientY: center.y });
	fire(fab, 'pointerup', { clientX: center.x, clientY: center.y });
	fire(fab, 'click', { detail: 1 });
	await settle();
	assert.equal(fab.getAttribute('aria-expanded'), 'false');
	unmount();
});

test('press-and-slide: the petal under the pointer arms, release fires it and closes', async () => {
	const { fab, fire, settle, center, petals, point, text, unmount } = render();
	fire(fab, 'pointerdown', { clientX: center.x, clientY: center.y });
	await settle();
	assert.equal(fab.getAttribute('aria-expanded'), 'true', 'opens on press');
	const recover = point(petals()[4]);
	fire(fab, 'pointermove', { clientX: recover.x + 5, clientY: recover.y - 5 });
	assert.equal(petals()[4].hasAttribute('data-armed'), true);
	assert.equal(petals().filter((p) => p.hasAttribute('data-armed')).length, 1);
	const sell = point(petals()[3]);
	fire(fab, 'pointermove', { clientX: sell.x, clientY: sell.y });
	assert.equal(petals().filter((p) => p.hasAttribute('data-armed')).length, 0, 'disabled petals never arm');
	const disarm = point(petals()[0]);
	fire(fab, 'pointermove', { clientX: disarm.x, clientY: disarm.y });
	assert.equal(petals()[0].hasAttribute('data-armed'), true);
	fire(fab, 'pointerup', { clientX: disarm.x, clientY: disarm.y });
	fire(fab, 'click', { detail: 1 });
	await settle();
	assert.equal(text('picked'), 'Disarm');
	assert.equal(fab.getAttribute('aria-expanded'), 'false');
	unmount();
});

test('touch tap: the click that lands on the fresh scrim does not close the fan', async () => {
	const { fab, doc, fire, settle, center, unmount } = render();
	fire(fab, 'pointerdown', { clientX: center.x, clientY: center.y });
	fire(fab, 'pointerup', { clientX: center.x, clientY: center.y });
	await settle();
	const scrim = /** @type {HTMLElement} */ (doc.querySelector('[data-tsu="Scrim"]'));
	fire(scrim, 'click', { detail: 1 });
	await settle();
	assert.equal(fab.getAttribute('aria-expanded'), 'true');
	await new Promise((r) => setTimeout(r, 450));
	fire(scrim, 'click', { detail: 1 });
	await settle();
	assert.equal(fab.getAttribute('aria-expanded'), 'false', 'a later scrim tap closes');
	unmount();
});

test('press-and-slide released between petals keeps the fan open', async () => {
	const { fab, fire, settle, center, text, unmount } = render();
	fire(fab, 'pointerdown', { clientX: center.x, clientY: center.y });
	fire(fab, 'pointermove', { clientX: center.x, clientY: center.y - 40 });
	fire(fab, 'pointerup');
	await settle();
	assert.equal(text('picked'), '');
	assert.equal(fab.getAttribute('aria-expanded'), 'true');
	unmount();
});

test('petals sit on the arc around the trigger and stay inside the viewport from a corner', async () => {
	const mid = render({}, { left: 170, top: 400 });
	mid.fab.click();
	await mid.settle();
	const dist = mid.petals().map((p) => {
		const { x, y } = mid.point(p);
		return Math.round(Math.hypot(x - mid.center.x, y - mid.center.y));
	});
	assert.deepEqual(new Set(dist), new Set([136]), '8.5rem at 16px');
	const first = mid.point(mid.petals()[0]);
	const last = mid.point(mid.petals()[5]);
	assert.ok(first.x < mid.center.x && last.x > mid.center.x, 'upward fan runs left to right');
	assert.ok(mid.petals().every((p) => mid.point(p).y < mid.center.y + 60));
	mid.unmount();

	const corner = render({}, { left: 4, top: 736 });
	corner.fab.click();
	await corner.settle();
	for (const p of corner.petals()) {
		const { x, y } = corner.point(p);
		assert.ok(x - 28 >= 8 - 1e-6 && x + 28 <= VW - 8 + 1e-6, `x ${x}`);
		assert.ok(y - 28 >= 8 - 1e-6 && y + 28 <= VH - 8 + 1e-6, `y ${y}`);
	}
	corner.unmount();
});

test('scrim: rendered while open, a click closes; status line renders above the arc', async () => {
	const { fab, doc, settle, unmount } = render();
	fab.click();
	await settle();
	const scrim = /** @type {HTMLElement} */ (doc.querySelector('[data-radial-panel] [data-tsu="Scrim"]'));
	assert.ok(scrim);
	assert.ok(doc.querySelector('.radial-status #status-line'));
	assert.equal(doc.querySelector('.radial-ghost')?.getAttribute('aria-hidden'), 'true');
	scrim.click();
	await settle();
	assert.equal(fab.getAttribute('aria-expanded'), 'false');
	assert.equal(doc.querySelector('[data-tsu="Scrim"]'), null);
	unmount();
});

test('RadialMenu compiles for client and server', async () => {
	const { code } = await preprocess(source, vitePreprocess(), { filename: 'RadialMenu.svelte' });
	for (const generate of /** @type {const} */ (['client', 'server'])) {
		const out = compile(code, { generate, filename: 'RadialMenu.svelte' });
		assert.equal(out.warnings.length, 0, `${generate}: ${out.warnings.map((w) => w.message).join('; ')}`);
	}
});
