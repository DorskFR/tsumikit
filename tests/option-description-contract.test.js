import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { hasDecl } from './helpers.mjs';

const radio = await readFile(
	new URL('../src/lib/components/molecules/RadioGroup.svelte', import.meta.url),
	'utf8'
);
const option = await readFile(
	new URL('../src/lib/components/molecules/OptionButton.svelte', import.meta.url),
	'utf8'
);
const bundle = await buildFixture('mount-option-description.js');

/**
 * @param {{ variant?: 'list' | 'rows' | 'swatch' }} props
 */
function render(props = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	dom.window.eval(bundle);
	const { mount, flushSync, Fixture } = dom.window.__fixture;
	/** @type {string[]} */
	const calls = [];
	/** @type {string[]} */
	const buttonCalls = [];
	mount(Fixture, { target: dom.window.document.body, props: { ...props, calls, buttonCalls } });
	flushSync();
	const doc = dom.window.document;
	return {
		doc,
		win: dom.window,
		calls,
		buttonCalls,
		flush: flushSync,
		radios: () => /** @type {HTMLInputElement[]} */ ([...doc.querySelectorAll('input[type="radio"]')]),
		buttons: () => /** @type {HTMLButtonElement[]} */ ([...doc.querySelectorAll('[data-tsu="OptionButton"]')]),
		/** @param {Element} el */
		hover: (el) => {
			el.dispatchEvent(new dom.window.Event('pointerenter', { bubbles: false }));
			flushSync();
		}
	};
}

test('RadioGroup: the public surface gains onfocuschange and documents description', () => {
	assert.match(radio, /onfocuschange\?: \(value: string\) => void/);
	assert.match(radio, /description\?: string/);
	assert.match(radio, /const uid = \$props\.id\(\)/);
});

test('OptionButton: the public surface gains value, description and onfocuschange', () => {
	assert.match(option, /value\?: string;/);
	assert.match(option, /description\?: string;/);
	assert.match(option, /onfocuschange\?: \(value: string\) => void/);
	assert.match(option, /Omit<HTMLButtonAttributes, 'value'>/);
	assert.match(option, /{#if description}<span class="description" id={descId}>{description}<\/span>{\/if}/);
	assert.ok(hasDecl(option, '.description', 'font-size', 'var(--fs-xs)'));
	assert.ok(hasDecl(option, '.description', 'color', 'var(--faint-color, var(--text-muted))'));
});

for (const variant of /** @type {const} */ (['list', 'rows'])) {
	test(`RadioGroup ${variant}: description renders and is wired through aria-describedby`, () => {
		const ui = render({ variant });
		const [fast, , plain] = ui.radios();
		const id = fast.getAttribute('aria-describedby');
		assert.ok(id, 'described option carries aria-describedby');
		const desc = ui.doc.getElementById(id);
		assert.equal(desc?.textContent, 'Skips the review pass.');
		assert.ok(desc?.classList.contains('description'));
		assert.equal(plain.getAttribute('aria-describedby'), null);
		assert.equal(ui.doc.querySelectorAll('[data-tsu="RadioGroup"] .description').length, 2);
	});
}

test('RadioGroup swatch: description is visually hidden but still described', () => {
	const ui = render({ variant: 'swatch' });
	const [fast] = ui.radios();
	const id = fast.getAttribute('aria-describedby');
	assert.ok(id);
	const desc = ui.doc.getElementById(id);
	assert.equal(desc?.textContent, 'Skips the review pass.');
	assert.ok(desc?.classList.contains('sr-only'));
	assert.ok(hasDecl(radio, '.sr-only', 'clip', 'rect(0 0 0 0)'));
});

test('RadioGroup: the same option is never announced twice in a row', () => {
	const ui = render();
	const [fast, careful] = ui.radios();
	fast.focus();
	ui.flush();
	fast.focus();
	ui.flush();
	assert.deepEqual(ui.calls, ['fast']);
	ui.hover(/** @type {Element} */ (fast.closest('label')));
	assert.deepEqual(ui.calls, ['fast']);
	careful.focus();
	ui.flush();
	assert.deepEqual(ui.calls, ['fast', 'careful']);
	ui.hover(/** @type {Element} */ (fast.closest('label')));
	assert.deepEqual(ui.calls, ['fast', 'careful', 'fast']);
});

test('RadioGroup rows: pointer hover on the row label activates its option', () => {
	const ui = render({ variant: 'rows' });
	const [, careful] = ui.radios();
	ui.hover(/** @type {Element} */ (careful.closest('label')));
	assert.deepEqual(ui.calls, ['careful']);
});

test('OptionButton: description gets its own id, merged with a consumer aria-describedby', () => {
	const ui = render();
	const [a, b, c] = ui.buttons();
	const aId = a.getAttribute('aria-describedby');
	assert.ok(aId);
	assert.equal(ui.doc.getElementById(aId)?.textContent, 'First card.');
	assert.equal(a.querySelector('.description')?.id, aId);
	assert.equal(b.getAttribute('aria-describedby'), 'ext');
	assert.equal(b.querySelector('.description'), null);
	assert.equal(c.getAttribute('aria-describedby'), null);
});

test('OptionButton: onfocuschange fires with value on focus and hover, never without a value', () => {
	const ui = render();
	const [a, b, c] = ui.buttons();
	a.focus();
	ui.flush();
	ui.hover(b);
	c.focus();
	ui.flush();
	ui.hover(c);
	assert.deepEqual(ui.buttonCalls, ['a', 'b']);
	assert.equal(a.getAttribute('value'), 'a');
});
