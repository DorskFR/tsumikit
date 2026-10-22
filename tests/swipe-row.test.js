import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { hasDecl } from './helpers.mjs';

const source = await readFile(
	new URL('../src/lib/components/molecules/SwipeRow.svelte', import.meta.url),
	'utf8'
);
const css = source.slice(source.indexOf('<style>'));
const bundle = await buildFixture('mount-swipe-row.svelte.js');

const WIDTH = 300;

/** @param {Record<string, unknown>} init */
function render(init = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	const w = dom.window;
	if (typeof w.PointerEvent !== 'function') {
		w.PointerEvent = class PointerEvent extends w.MouseEvent {
			/** @param {string} type @param {PointerEventInit} [init] */
			constructor(type, init = {}) {
				super(type, init);
				this.pointerId = init.pointerId ?? 1;
				this.pointerType = init.pointerType ?? 'touch';
			}
		};
	}
	/** @type {number[]} */
	const captured = [];
	w.Element.prototype.setPointerCapture = function (/** @type {number} */ id) {
		captured.push(id);
	};
	w.Element.prototype.releasePointerCapture = () => {};
	w.eval(bundle);
	const { mount, unmount, flushSync, Fixture, props } = w.__fixture;
	const live = props({ fired: [], ...init });
	const app = mount(Fixture, { target: w.document.body, props: live });
	flushSync();
	const doc = w.document;
	const root = /** @type {HTMLElement} */ (doc.querySelector('[data-tsu="SwipeRow"]'));
	Object.defineProperty(root, 'clientWidth', { value: WIDTH, configurable: true });
	const content = /** @type {HTMLElement} */ (root.querySelector('[data-part="content"]'));
	const pointer = (/** @type {string} */ type, /** @type {number} */ x, /** @type {number} */ y) => {
		content.dispatchEvent(
			new w.PointerEvent(type, {
				bubbles: true,
				cancelable: true,
				button: 0,
				pointerId: 7,
				clientX: x,
				clientY: y
			})
		);
		flushSync();
	};
	const drag = (/** @type {[number, number][]} */ points) => {
		pointer('pointerdown', 100, 50);
		for (const [x, y] of points) pointer('pointermove', x, y);
		const [x, y] = points[points.length - 1];
		pointer('pointerup', x, y);
	};
	const x = () => Number.parseFloat(root.style.getPropertyValue('--swiperow-x'));
	const click = (/** @type {Element} */ el) => {
		el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
		flushSync();
	};
	const destroy = () => {
		unmount(app);
		flushSync();
	};
	return { w, doc, root, content, pointer, drag, x, click, captured, destroy, props: live, flush: flushSync };
}

test('a leftward swipe past the threshold fires trailingAction once and snaps back', () => {
	const r = render();
	r.pointer('pointerdown', 100, 50);
	r.pointer('pointermove', 88, 50);
	assert.ok(r.root.classList.contains('swiperow--dragging'));
	assert.deepEqual(r.captured, [7], 'pointer captured once the axis locks');
	r.pointer('pointermove', 100 - WIDTH * 0.5, 52);
	assert.equal(r.x(), -WIDTH * 0.5);
	assert.ok(r.root.classList.contains('swiperow--trailing'));
	assert.ok(r.root.classList.contains('swiperow--armed'));
	assert.ok(r.root.classList.contains('swiperow-tone-danger'));
	assert.deepEqual([...r.props.fired], []);
	r.pointer('pointerup', 100 - WIDTH * 0.5, 52);
	assert.deepEqual([...r.props.fired], ['trailing']);
	assert.equal(r.x(), 0);
	assert.ok(!r.root.classList.contains('swiperow--dragging'));
	r.destroy();
});

test('a leftward swipe under the threshold snaps back without firing', () => {
	const r = render();
	r.drag([[90, 50], [100 - WIDTH * 0.2, 50]]);
	assert.deepEqual([...r.props.fired], []);
	assert.equal(r.x(), 0);
	r.destroy();
});

test('a vertical drag never locks, never translates and never fires', () => {
	const r = render();
	r.drag([[101, 60], [99, 150], [60, 400]]);
	assert.deepEqual([...r.props.fired], []);
	assert.equal(r.x(), 0);
	assert.deepEqual(r.captured, []);
	assert.ok(!r.root.classList.contains('swiperow--dragging'));
	r.destroy();
});

test('a diagonal that is more vertical than horizontal is left to the scroller', () => {
	const r = render();
	r.drag([[94, 58], [-200, 400]]);
	assert.deepEqual([...r.props.fired], []);
	assert.equal(r.x(), 0);
	r.destroy();
});

test('a rightward swipe past the threshold fires leadingAction', () => {
	const r = render();
	r.drag([[112, 50], [100 + WIDTH * 0.4, 50]]);
	assert.deepEqual([...r.props.fired], ['leading']);
	r.destroy();
});

test('the content does not move toward a side that has no action', () => {
	const r = render({ withLeading: false });
	r.pointer('pointerdown', 100, 50);
	r.pointer('pointermove', 112, 50);
	r.pointer('pointermove', 250, 50);
	assert.equal(r.x(), 0);
	r.pointer('pointerup', 250, 50);
	assert.deepEqual([...r.props.fired], []);
	r.destroy();
});

test('threshold is a fraction of the row width', () => {
	const r = render({ threshold: 0.6 });
	r.drag([[90, 50], [100 - WIDTH * 0.5, 50]]);
	assert.deepEqual([...r.props.fired], []);
	r.drag([[90, 50], [100 - WIDTH * 0.7, 50]]);
	assert.deepEqual([...r.props.fired], ['trailing']);
	r.destroy();
});

test('pointercancel resets without firing', () => {
	const r = render();
	r.pointer('pointerdown', 100, 50);
	r.pointer('pointermove', 88, 50);
	r.pointer('pointermove', 100 - WIDTH * 0.8, 50);
	r.pointer('pointercancel', 100 - WIDTH * 0.8, 50);
	assert.deepEqual([...r.props.fired], []);
	assert.equal(r.x(), 0);
	r.destroy();
});

/**
 * @param {ReturnType<typeof render>} r
 * @param {Element} target
 * @param {number} pointerId
 */
function loseCapture(r, target, pointerId) {
	target.dispatchEvent(new r.w.PointerEvent('lostpointercapture', { bubbles: true, pointerId }));
	r.flush();
}

test('a bubbling lostpointercapture from the child under the finger does not cancel the drag', () => {
	const r = render();
	const inner = /** @type {HTMLElement} */ (r.root.querySelector('.probe-inner'));
	r.pointer('pointerdown', 100, 50);
	r.pointer('pointermove', 88, 50);
	assert.deepEqual(r.captured, [7]);
	loseCapture(r, inner, 7);
	assert.ok(r.root.classList.contains('swiperow--dragging'));
	r.pointer('pointermove', 100 - WIDTH * 0.5, 50);
	assert.equal(r.x(), -WIDTH * 0.5);
	r.pointer('pointerup', 100 - WIDTH * 0.5, 50);
	assert.deepEqual([...r.props.fired], ['trailing']);
	assert.equal(r.x(), 0);
	r.destroy();
});

test('lostpointercapture for another pointer is ignored; for the active one on the row it resets', () => {
	const r = render();
	r.pointer('pointerdown', 100, 50);
	r.pointer('pointermove', 88, 50);
	loseCapture(r, r.root, 99);
	r.pointer('pointermove', 100 - WIDTH * 0.5, 50);
	assert.equal(r.x(), -WIDTH * 0.5);
	loseCapture(r, r.root, 7);
	assert.equal(r.x(), 0);
	assert.ok(!r.root.classList.contains('swiperow--dragging'));
	r.pointer('pointermove', 100 - WIDTH * 0.8, 50);
	assert.equal(r.x(), 0);
	r.pointer('pointerup', 100 - WIDTH * 0.8, 50);
	assert.deepEqual([...r.props.fired], []);
	r.destroy();
});

test('the click that ends a swipe is swallowed; a plain tap still reaches the row', () => {
	const r = render();
	const inner = /** @type {HTMLElement} */ (r.root.querySelector('.probe-inner'));
	r.drag([[90, 50], [70, 50]]);
	r.click(inner);
	assert.deepEqual([...r.props.fired], []);
	r.pointer('pointerdown', 100, 50);
	r.pointer('pointerup', 100, 50);
	r.click(inner);
	assert.deepEqual([...r.props.fired], ['click']);
	r.destroy();
});

test('a touch swipe that produces no click does not swallow the next tap', () => {
	const r = render();
	const inner = /** @type {HTMLElement} */ (r.root.querySelector('.probe-inner'));
	r.drag([[90, 50], [70, 50]]);
	r.pointer('pointerdown', 100, 50);
	r.pointer('pointerup', 100, 50);
	r.click(inner);
	assert.deepEqual([...r.props.fired], ['click']);
	r.pointer('pointerdown', 100, 50);
	r.pointer('pointermove', 88, 50);
	r.pointer('pointercancel', 88, 50);
	r.pointer('pointerdown', 100, 50);
	r.pointer('pointerup', 100, 50);
	r.click(inner);
	assert.deepEqual([...r.props.fired], ['click', 'click']);
	r.destroy();
});

test('keyboard and screen-reader users get one hidden button per action', () => {
	const r = render();
	const buttons = /** @type {HTMLButtonElement[]} */ ([...r.root.querySelectorAll('[data-part="actions"] button')]);
	assert.deepEqual(
		buttons.map((b) => b.textContent?.trim()),
		['Archive', 'Delete']
	);
	assert.ok(buttons.every((b) => b.classList.contains('swiperow-sr') && b.type === 'button'));
	r.click(buttons[1]);
	r.click(buttons[0]);
	assert.deepEqual([...r.props.fired], ['trailing', 'leading']);
	for (const pane of r.root.querySelectorAll('.swiperow-pane')) {
		assert.equal(pane.getAttribute('aria-hidden'), 'true');
	}
	r.destroy();
});

test('disabled rows neither swipe nor expose enabled buttons', () => {
	const r = render({ disabled: true });
	r.drag([[88, 50], [100 - WIDTH * 0.8, 50]]);
	assert.deepEqual([...r.props.fired], []);
	assert.equal(r.x(), 0);
	assert.ok([...r.root.querySelectorAll('[data-part="actions"] button')].every((b) => /** @type {HTMLButtonElement} */ (b).disabled));
	r.destroy();
});

test('rows without actions are inert', () => {
	const r = render({ withLeading: false, withTrailing: false });
	assert.equal(r.root.querySelector('[data-part="actions"]'), null);
	r.drag([[88, 50], [100 - WIDTH * 0.8, 50]]);
	assert.equal(r.x(), 0);
	r.destroy();
});

test('vertical scrolling stays with the browser; the settle reads motion tokens and leaves reduced motion to the reset', () => {
	assert.ok(hasDecl(css, '.swiperow', 'touch-action', 'pan-y'));
	assert.ok(hasDecl(css, '.swiperow-sr', 'clip', 'rect(0, 0, 0, 0)'));
	assert.ok(hasDecl(css, '.swiperow--settling .swiperow-content', 'transition', 'transform var(--dur-exit-slow) var(--ease-out)'));
	assert.doesNotMatch(css, /prefers-reduced-motion/);
});

test('the component touches no browser globals at module or init time', () => {
	const script = source.slice(0, source.indexOf('</script>', source.indexOf('<script lang="ts">')));
	const top = script
		.split('\n')
		.filter((l) => /^\t(let|const) /.test(l))
		.join('\n');
	assert.doesNotMatch(top, /\b(window|document|matchMedia|navigator)\b/);
});
