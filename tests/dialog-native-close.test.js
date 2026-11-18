import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const bundle = await buildFixture('mount-dialog-native-close.svelte.js');

/**
 * jsdom has no <dialog> modality: `showModal()`/`close()` toggle `open`, and
 * `close()` fires `close` like the browser does.
 * @param {Record<string, unknown>} init
 */
function render(init) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	const w = dom.window;
	w.HTMLDialogElement.prototype.showModal = function () {
		this.setAttribute('open', '');
	};
	w.HTMLDialogElement.prototype.close = function () {
		this.removeAttribute('open');
		this.dispatchEvent(new w.Event('close'));
	};
	w.eval(bundle);
	const { mount, flushSync, Fixture, props } = w.__fixture;
	const live = props({ closed: [], ...init });
	mount(Fixture, { target: w.document.body, props: live });
	flushSync();
	const dialog = (/** @type {string} */ tsu) =>
		/** @type {HTMLDialogElement | null} */ (w.document.querySelector(`dialog[data-tsu="${tsu}"]`));
	/** What the browser does when it closes the dialog on its own: `open` drops, then `close` fires. */
	const nativeClose = (/** @type {HTMLDialogElement} */ el, { cancel = false } = {}) => {
		if (cancel) el.dispatchEvent(new w.Event('cancel', { cancelable: false }));
		el.removeAttribute('open');
		flushSync();
		el.dispatchEvent(new w.Event('close'));
		flushSync();
	};
	return { w, dialog, nativeClose, props: live, flush: flushSync };
}

for (const [name, key] of [
	['Modal', 'modalOpen'],
	['Drawer', 'drawerOpen']
]) {
	const tag = name.toLowerCase();

	for (const cancel of [false, true]) {
		const how = cancel ? 'after a non-cancelable cancel' : 'without a cancel';
		test(`${name} (bound open): a native close ${how} syncs open and calls onclose once`, () => {
			const r = render({ [key]: true });
			const el = /** @type {HTMLDialogElement} */ (r.dialog(name));
			assert.equal(el.open, true);
			r.nativeClose(el, { cancel });
			assert.equal(r.props[key], false);
			assert.equal(el.open, false);
			assert.deepEqual([...r.props.closed], [tag]);
		});

		test(`${name} (mount to show): a native close ${how} calls onclose once`, () => {
			const r = render({ controlled: false, [key]: true });
			r.nativeClose(/** @type {HTMLDialogElement} */ (r.dialog(name)), { cancel });
			assert.deepEqual([...r.props.closed], [tag]);
			assert.equal(r.props[key], false);
			assert.equal(r.dialog(name), null, 'consumer unmounted it from onclose');
		});
	}

	test(`${name}: a parent closing it through open does not call onclose`, () => {
		const r = render({ [key]: true });
		r.props[key] = false;
		r.flush();
		assert.equal(/** @type {HTMLDialogElement} */ (r.dialog(name)).open, false);
		assert.deepEqual([...r.props.closed], []);
	});

	test(`${name}: reopening after a native close works and a second native close reports again`, () => {
		const r = render({ [key]: true });
		const el = /** @type {HTMLDialogElement} */ (r.dialog(name));
		r.nativeClose(el, { cancel: true });
		r.props[key] = true;
		r.flush();
		assert.equal(el.open, true);
		r.nativeClose(el, { cancel: true });
		assert.deepEqual([...r.props.closed], [tag, tag]);
		assert.equal(r.props[key], false);
	});
}

test('Modal busy: a cancelable Escape is refused but a forced native close is accepted and reported', () => {
	const r = render({ busy: true, modalOpen: true });
	const el = /** @type {HTMLDialogElement} */ (r.dialog('Modal'));
	const esc = new r.w.Event('cancel', { cancelable: true });
	el.dispatchEvent(esc);
	r.flush();
	assert.equal(esc.defaultPrevented, true);
	assert.equal(el.open, true);
	assert.equal(r.props.modalOpen, true);
	assert.deepEqual([...r.props.closed], []);

	r.nativeClose(el, { cancel: true });
	assert.equal(r.props.modalOpen, false);
	assert.equal(el.open, false, 'not re-opened');
	assert.deepEqual([...r.props.closed], ['modal']);
});

test('Modal busy (mount to show): a forced native close reaches onclose', () => {
	const r = render({ controlled: false, busy: true, modalOpen: true });
	r.nativeClose(/** @type {HTMLDialogElement} */ (r.dialog('Modal')), { cancel: true });
	assert.deepEqual([...r.props.closed], ['modal']);
	assert.equal(r.dialog('Modal'), null);
});
