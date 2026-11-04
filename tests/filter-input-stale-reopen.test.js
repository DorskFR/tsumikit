import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const bundle = await buildFixture('mount-filter-input.js');

/** A provider whose every call stays pending until the test resolves it. */
function deferredProvider() {
	/** @type {Array<(opts: { value: string, label: string }[]) => void>} */
	const pending = [];
	return {
		pending,
		provider: () => new Promise((resolve) => pending.push(resolve)),
		/** Resolve the most recent call. */
		resolveLast: (opts = [{ value: '/srv/app', label: 'app' }]) => pending.at(-1)?.(opts)
	};
}

/** @param {{ key?: string, schema: import('../src/lib/query/schema.ts').Schema }} props */
function render(props) {
	const dom = new JSDOM('<!doctype html><html><body><button id="away">away</button></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	dom.window.eval(bundle);
	const { mount, flushSync, FilterInput } = dom.window.__fixture;
	const doc = dom.window.document;
	mount(FilterInput, { target: doc.body, props: { 'aria-label': 'Working directory', ...props } });
	flushSync();
	const input = /** @type {HTMLInputElement} */ (doc.querySelector('input.fi__input'));
	const settle = async (ms = 0) => {
		await new Promise((r) => dom.window.setTimeout(r, ms));
		flushSync();
	};
	return {
		doc,
		input,
		settle,
		menu: () => doc.querySelector('.fi__menu'),
		options: () => [...doc.querySelectorAll('.fi__opt')].map((o) => o.textContent?.trim()),
		type: async (/** @type {string} */ v) => {
			input.value = v;
			input.setSelectionRange(v.length, v.length);
			input.dispatchEvent(new dom.window.InputEvent('input', { bubbles: true, inputType: 'insertText' }));
			await settle();
		},
		key: async (/** @type {string} */ key) => {
			input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true }));
			await settle();
		}
	};
}

/**
 * @param {import('../src/lib/query/schema.ts').ValueProvider} provider
 * @returns {{ key: string, schema: import('../src/lib/query/schema.ts').Schema }}
 */
const cwd = (provider) => ({
	key: 'cwd',
	schema: { fields: [{ name: 'cwd', label: 'Working directory', type: 'string', provider }] }
});

test('picking an option before the provider resolves keeps the menu closed', async () => {
	const d = deferredProvider();
	const ui = render(cwd(d.provider));
	ui.input.focus();
	d.resolveLast();
	await ui.settle();
	assert.ok(ui.menu(), 'menu opens on focus');

	await ui.type('/srv');
	assert.equal(d.pending.length, 2);
	/** @type {HTMLElement} */ (ui.doc.querySelector('.fi__opt')).click();
	await ui.settle();
	assert.equal(ui.menu(), null);
	assert.ok(ui.input.value.startsWith('/srv/app'));

	d.pending[1]([{ value: '/srv/app', label: 'app' }]);
	await ui.settle();
	assert.equal(ui.menu(), null, 'late result must not reopen the menu');
});

test('blurring before the provider resolves keeps the menu closed', async () => {
	const d = deferredProvider();
	const ui = render(cwd(d.provider));
	ui.input.focus();
	await ui.settle();
	/** @type {HTMLElement} */ (ui.doc.getElementById('away')).focus();
	d.resolveLast();
	await ui.settle();
	assert.equal(ui.menu(), null, 'result landing inside the blur delay stays closed');
	await ui.settle(150);
	assert.equal(ui.menu(), null);
});

test('a result resolving after the blur delay cannot leave the menu stuck open', async () => {
	const d = deferredProvider();
	const ui = render(cwd(d.provider));
	ui.input.focus();
	await ui.settle();
	ui.input.blur();
	await ui.settle(150);
	d.resolveLast();
	await ui.settle();
	assert.equal(ui.menu(), null);
});

test('Escape with a pending provider keeps the menu closed', async () => {
	const d = deferredProvider();
	const ui = render(cwd(d.provider));
	ui.input.focus();
	await ui.settle();
	await ui.key('Escape');
	d.resolveLast();
	await ui.settle();
	assert.equal(ui.menu(), null);
	assert.equal(ui.doc.activeElement, ui.input);
});

test('Escape on an open menu invalidates the in-flight refresh', async () => {
	const d = deferredProvider();
	const ui = render(cwd(d.provider));
	ui.input.focus();
	d.resolveLast();
	await ui.settle();
	await ui.type('/sr');
	assert.ok(ui.menu());
	await ui.key('Escape');
	assert.equal(ui.menu(), null);
	d.resolveLast();
	await ui.settle();
	assert.equal(ui.menu(), null);
});

test('typing still opens suggestions once the provider resolves', async () => {
	const d = deferredProvider();
	const ui = render(cwd(d.provider));
	ui.input.focus();
	await ui.settle();
	await ui.key('Escape');
	await ui.type('/s');
	assert.equal(ui.menu(), null);
	d.resolveLast([{ value: '/srv/app', label: 'app' }]);
	await ui.settle();
	assert.deepEqual(ui.options(), ['app']);
});

test('a field pick with advance still opens the next step', async () => {
	const ui = render({
		schema: {
			fields: [
				{
					name: 'status',
					label: 'Status',
					type: 'enum',
					options: [
						{ value: 'open', label: 'open' },
						{ value: 'done', label: 'done' }
					]
				}
			]
		}
	});
	ui.input.focus();
	await ui.settle();
	assert.ok(ui.menu(), 'field list on focus');
	/** @type {HTMLElement} */ (ui.doc.querySelector('.fi__opt')).click();
	await ui.settle();
	await ui.settle();
	assert.ok(ui.input.value.startsWith('status'));
	assert.ok(ui.menu(), 'next step opens after an advancing pick');
	assert.notEqual(ui.doc.querySelector('.fi__menu-head')?.textContent, 'Fields');
});
