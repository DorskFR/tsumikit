import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { hasDecl } from './helpers.mjs';

const source = await readFile(
	new URL('../src/lib/components/molecules/PullToRefresh.svelte', import.meta.url),
	'utf8'
);
const css = source.slice(source.indexOf('<style>'));
const bundle = await buildFixture('mount-pull-to-refresh.svelte.js');

/** @param {Record<string, unknown>} init */
function render(init = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	dom.window.eval(bundle);
	const { mount, unmount, flushSync, Fixture, props } = dom.window.__fixture;
	const live = props({ calls: 0, settle: undefined, ...init });
	const app = mount(Fixture, { target: dom.window.document.body, props: live });
	flushSync();
	const doc = dom.window.document;
	const root = /** @type {HTMLElement} */ (doc.querySelector('[data-tsu="PullToRefresh"]'));
	let scrollTop = 0;
	Object.defineProperty(root, 'scrollTop', {
		get: () => scrollTop,
		set: (v) => {
			scrollTop = v;
		},
		configurable: true
	});
	/** @param {string} type @param {Record<string, unknown>} init */
	const pointer = (type, init) => {
		const target = type === 'pointerdown' ? root : dom.window;
		target.dispatchEvent(
			new dom.window.PointerEvent(type, {
				bubbles: true,
				cancelable: true,
				pointerId: 1,
				pointerType: 'touch',
				clientX: 10,
				clientY: 0,
				...init
			})
		);
		flushSync();
	};
	/** @param {number} dy @param {Record<string, unknown>} [init] */
	const pull = (dy, init = {}) => {
		pointer('pointerdown', { clientY: 100, ...init });
		pointer('pointermove', { clientY: 100 + dy / 2, ...init });
		pointer('pointermove', { clientY: 100 + dy, ...init });
		pointer('pointerup', { clientY: 100 + dy, ...init });
	};
	const touchmove = () => {
		const e = new dom.window.TouchEvent('touchmove', { bubbles: true, cancelable: true });
		root.dispatchEvent(e);
		return e.defaultPrevented;
	};
	const status = () => root.querySelector('[role="status"]')?.textContent?.trim();
	const settle = async () => {
		live.settle?.();
		await new Promise((r) => setTimeout(r, 0));
		flushSync();
	};
	return {
		dom,
		doc,
		root,
		pointer,
		pull,
		touchmove,
		status,
		settle,
		props: live,
		flush: flushSync,
		setScroll: (/** @type {number} */ v) => {
			scrollTop = v;
		},
		destroy: () => {
			unmount(app);
			flushSync();
		}
	};
}

test('a touch pull past the threshold calls onrefresh exactly once and holds the spinner until it settles', async () => {
	const r = render();
	assert.equal(r.root.dataset.state, 'idle');
	assert.equal(r.status(), '');
	assert.equal(r.root.getAttribute('aria-busy'), null);

	r.pull(300);
	assert.equal(r.props.calls, 1);
	assert.equal(r.root.dataset.state, 'refreshing');
	assert.equal(r.root.getAttribute('aria-busy'), 'true');
	assert.equal(r.status(), 'Refreshing…');
	assert.ok(r.root.querySelector('[data-tsu="Spinner"]'));
	assert.equal(r.root.style.getPropertyValue('--ptr-offset'), '72px');

	await r.settle();
	assert.equal(r.root.dataset.state, 'idle');
	assert.equal(r.root.getAttribute('aria-busy'), null);
	assert.equal(r.root.querySelector('[data-tsu="Spinner"]'), null);
	assert.equal(r.root.style.getPropertyValue('--ptr-offset'), '0px');
	assert.equal(r.props.calls, 1);
});

test('the pull is damped: the indicator follows the finger with resistance and arms at the threshold', () => {
	const r = render();
	r.pointer('pointerdown', { clientY: 100 });
	r.pointer('pointermove', { clientY: 140 });
	assert.equal(r.root.dataset.state, 'pulling');
	assert.equal(r.status(), 'Pull to refresh');
	const offset = Number.parseFloat(r.root.style.getPropertyValue('--ptr-offset'));
	assert.ok(offset > 20 && offset < 40, `damped 40px pull was ${offset}`);
	assert.ok(r.touchmove(), 'touchmove is blocked while pulling');

	r.pointer('pointermove', { clientY: 400 });
	assert.equal(r.root.dataset.state, 'ready');
	assert.equal(r.status(), 'Release to refresh');
	const far = Number.parseFloat(r.root.style.getPropertyValue('--ptr-offset'));
	assert.ok(far >= 72 && far < 144, `damped 300px pull was ${far}`);
	assert.equal(r.props.calls, 0);

	r.pointer('pointerup', { clientY: 400 });
	assert.equal(r.props.calls, 1);
});

test('a pull under the threshold snaps back without refreshing', () => {
	const r = render();
	r.pull(40);
	assert.equal(r.props.calls, 0);
	assert.equal(r.root.dataset.state, 'idle');
	assert.equal(r.root.style.getPropertyValue('--ptr-offset'), '0px');
	assert.equal(r.status(), '');
	assert.ok(!r.touchmove(), 'touchmove is free again');
});

test('scrolled content, upward drags, mouse pointers, cancels and disabled never refresh', () => {
	const r = render();
	r.setScroll(120);
	r.pull(300);
	assert.equal(r.props.calls, 0);
	assert.equal(r.root.dataset.state, 'idle');

	r.setScroll(0);
	r.pointer('pointerdown', { clientY: 100 });
	r.setScroll(30);
	r.pointer('pointermove', { clientY: 400 });
	r.pointer('pointerup', { clientY: 400 });
	assert.equal(r.props.calls, 0);

	r.setScroll(0);
	r.pull(-300);
	assert.equal(r.props.calls, 0);

	r.pull(300, { pointerType: 'mouse' });
	assert.equal(r.props.calls, 0);

	r.pointer('pointerdown', { clientY: 100 });
	r.pointer('pointermove', { clientY: 400 });
	assert.equal(r.root.dataset.state, 'ready');
	r.pointer('pointercancel', { clientY: 400 });
	assert.equal(r.root.dataset.state, 'idle');
	r.pointer('pointerup', { clientY: 400 });
	assert.equal(r.props.calls, 0);

	r.props.disabled = true;
	r.flush();
	r.pull(300);
	assert.equal(r.props.calls, 0);

	r.props.disabled = false;
	r.flush();
	r.pull(300, { pointerType: 'pen' });
	assert.equal(r.props.calls, 1);
});

test('a second pull while pending does not trigger again; after settling it does', async () => {
	const r = render();
	r.pull(300);
	assert.equal(r.props.calls, 1);
	r.pull(300);
	r.pull(300);
	assert.equal(r.props.calls, 1);
	assert.equal(r.root.dataset.state, 'refreshing');
	await r.settle();
	r.pull(300);
	assert.equal(r.props.calls, 2);
	await r.settle();
});

test('a rejected onrefresh still releases the pending state and surfaces the error', async () => {
	const r = render({ fail: true });
	/** @type {unknown[]} */
	const errors = [];
	const grab = (/** @type {unknown} */ e) => errors.push(e);
	const runner = process.rawListeners('unhandledRejection');
	process.removeAllListeners('unhandledRejection');
	process.on('unhandledRejection', grab);
	r.pull(300);
	assert.equal(r.props.calls, 1);
	assert.equal(r.root.dataset.state, 'refreshing');
	await new Promise((resolve) => setTimeout(resolve, 0));
	r.flush();
	process.off('unhandledRejection', grab);
	for (const l of runner) process.on('unhandledRejection', /** @type {any} */ (l));
	assert.equal(r.root.dataset.state, 'idle');
	assert.equal(r.root.getAttribute('aria-busy'), null);
	assert.equal(errors.length, 1);
	assert.equal(/** @type {Error} */ (errors[0]).message, 'boom');
	r.props.fail = false;
	r.flush();
	r.pull(300);
	assert.equal(r.props.calls, 2);
	assert.equal(r.root.dataset.state, 'refreshing');
	await r.settle();
});

test('unmount drops window listeners mid-pull', () => {
	const r = render();
	r.pointer('pointerdown', { clientY: 100 });
	r.pointer('pointermove', { clientY: 400 });
	r.destroy();
	r.pointer('pointerup', { clientY: 400 });
	assert.equal(r.props.calls, 0);
});

test('scroll container contains overscroll, tokens only, reduced motion kills transitions', () => {
	assert.ok(hasDecl(css, '.ptr', 'overflow-y', 'auto'));
	assert.ok(hasDecl(css, '.ptr', 'overscroll-behavior-y', 'contain'));
	assert.ok(hasDecl(css, '.ptr', 'touch-action', 'pan-y'));
	assert.ok(hasDecl(css, '.ptr-content', 'translate', /var\(--ptr-offset/));
	assert.ok(hasDecl(css, '.pending .ptr-indicator', 'color', 'var(--accent)'));
	assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
	assert.doesNotMatch(css, /#[0-9a-f]{3,6}\b/i);
	assert.match(source, /onrefresh\?: \(\) => Promise<void> \| void;/);
	assert.match(source, /import Spinner from/);
	assert.match(source, /role="status" aria-live="polite"/);
	assert.doesNotMatch(source.slice(0, source.indexOf('</script>')), /\bwindow\.|\bdocument\./);
});
