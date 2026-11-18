import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { compile } from 'svelte/compiler';
import { buildFixture } from './fixtures/build.mjs';

const bundle = await buildFixture('mount-form-validity.svelte.js');

/** @param {Record<string, unknown>} init */
function render(init = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true });
	const win = dom.window;
	win.eval(bundle);
	const { mount, flushSync, Fixture, props, announce } = win.__fixture;
	const live = props(init);
	mount(Fixture, { target: win.document.body, props: live });
	flushSync();
	const doc = win.document;
	/** @param {string} id */
	const el = (id) => /** @type {HTMLInputElement} */ (doc.getElementById(id));
	/** @param {Element} node @param {string} type */
	const fire = (node, type) => {
		node.dispatchEvent(new win.Event(type, { bubbles: type !== 'blur' }));
		flushSync();
	};
	/** @param {HTMLInputElement} node @param {string} value */
	const type = (node, value) => {
		node.value = value;
		fire(node, 'input');
	};
	const error = (/** @type {string} */ id) => doc.getElementById(`${id}-err`);
	const region = () => doc.querySelector('[data-tsu="Announcer"]');
	return { win, doc, live, flushSync, announce, el, fire, type, error, region };
}

const wait = (/** @type {number} */ ms) => new Promise((r) => setTimeout(r, ms));

test('untouched required controls carry no invalid state on load', () => {
	const ui = render();
	for (const id of ['email', 'notes', 'plan', 'terms', 'loose']) {
		const node = ui.el(id);
		assert.equal(node.validity.valid, false, id);
		assert.equal(node.getAttribute('aria-invalid'), null, id);
		assert.equal(ui.error(id), null, id);
		assert.doesNotMatch(node.getAttribute('aria-describedby') ?? '', /-err/, id);
	}
});

test('blur after interaction marks the control invalid and links the native message', () => {
	const ui = render();
	const email = ui.el('email');
	ui.type(email, 'nope');
	assert.equal(email.getAttribute('aria-invalid'), null, 'typing alone does not flag an untouched field');
	ui.fire(email, 'blur');
	assert.equal(email.getAttribute('aria-invalid'), 'true');
	const err = /** @type {HTMLElement} */ (ui.error('email'));
	assert.ok(err);
	assert.match(email.getAttribute('aria-describedby') ?? '', /\bemail-err\b/);
	const icon = /** @type {Element} */ (err.querySelector('svg'));
	assert.equal(icon.getAttribute('role'), 'img');
	assert.equal(icon.getAttribute('aria-label'), 'Error');
	assert.equal(err.textContent?.trim(), email.validationMessage || 'Invalid value');
});

test('fixing the value clears the state live once touched', () => {
	const ui = render();
	const email = ui.el('email');
	ui.fire(email, 'blur');
	assert.equal(email.getAttribute('aria-invalid'), 'true');
	ui.type(email, 'a@b.co');
	assert.equal(email.getAttribute('aria-invalid'), null);
	assert.equal(ui.error('email'), null);
	assert.doesNotMatch(email.getAttribute('aria-describedby') ?? '', /-err/);
	ui.type(email, '');
	assert.equal(email.getAttribute('aria-invalid'), 'true');
});

test('every constraint-capable control reports through change and submit-time invalid', () => {
	const ui = render();
	ui.fire(ui.el('terms'), 'change');
	assert.equal(ui.el('terms').getAttribute('aria-invalid'), 'true');
	assert.ok(ui.error('terms'));
	const form = /** @type {HTMLFormElement} */ (ui.doc.getElementById('form'));
	assert.equal(form.checkValidity(), false);
	ui.flushSync();
	for (const id of ['email', 'notes', 'plan', 'loose']) {
		assert.equal(ui.el(id).getAttribute('aria-invalid'), 'true', id);
	}
	for (const id of ['email', 'notes', 'plan']) assert.ok(ui.error(id), id);
	form.reset();
	ui.flushSync();
	for (const id of ['email', 'notes', 'plan', 'terms', 'loose']) {
		assert.equal(ui.el(id).getAttribute('aria-invalid'), null, `${id} after reset`);
	}
});

test('a consumer error wins over the native message and the invalid prop still applies', () => {
	const ui = render({ emailError: 'Use your work address' });
	const email = ui.el('email');
	assert.equal(email.getAttribute('aria-invalid'), 'true');
	ui.fire(email, 'blur');
	assert.equal(ui.error('email')?.textContent?.trim(), 'Use your work address');
	ui.live.emailError = undefined;
	ui.flushSync();
	assert.equal(ui.error('email')?.textContent?.trim(), email.validationMessage || 'Invalid value');
});

test('an error that appears after focus left the field is announced once, politely', async () => {
	const ui = render({ presetError: 'Server says no' });
	assert.equal(ui.region(), null, 'an error present on load is not announced');
	const email = ui.el('email');
	email.focus();
	ui.el('other').focus();
	ui.fire(email, 'blur');
	const region = /** @type {HTMLElement} */ (ui.region());
	assert.ok(region);
	assert.equal(region.getAttribute('aria-live'), 'polite');
	await wait(150);
	assert.equal(region.textContent, email.validationMessage || 'Invalid value');
	ui.announce('Saved');
	await wait(150);
	assert.equal(ui.doc.querySelectorAll('[data-tsu="Announcer"]').length, 1);
	assert.equal(region.textContent, 'Saved');
});

test('an error set while the user is still in the field is not announced', async () => {
	const ui = render();
	ui.el('email').focus();
	ui.live.emailError = 'Taken';
	ui.flushSync();
	await wait(150);
	assert.equal(ui.region(), null);
});

/** @param {string} p */
const css = async (p) => {
	const source = await readFile(new URL(`../src/lib/components/${p}.svelte`, import.meta.url), 'utf8');
	const code = compile(source, { filename: `${p}.svelte`, css: 'external' }).css?.code ?? '';
	return code.replace(/:where\(\.svelte-[\w-]+\)|\.svelte-[\w-]+/g, '');
};

test(':user-invalid joins aria-invalid in each control\'s error and hover selectors', async () => {
	const pins = {
		'atoms/Input': [/\.input:is\(\[aria-invalid='true'\], :user-invalid\)[^{]*\{\s*border-color: var\(--danger\)/, /\.input:hover:not\([^)]*:user-invalid\)/],
		'atoms/Textarea': [/\.textarea:is\(\[aria-invalid='true'\], :user-invalid\)[^{]*\{\s*border-color: var\(--danger\)/, /\.textarea:hover:not\([^)]*:user-invalid\)/],
		'atoms/Select': [/\.select:is\(\[aria-invalid='true'\], :user-invalid\)[^{]*\{\s*border-color: var\(--danger\)/, /\.select:hover:not\([^)]*:user-invalid/],
		'atoms/Checkbox': [/input:is\(\[aria-invalid='true'\], :user-invalid\):not\(:checked\):not\(:indeterminate\) \+ \.box/],
		'molecules/Field': [/:has\(:is\(\[aria-invalid='true'\], :user-invalid\)\) > \.label/]
	};
	for (const [file, res] of Object.entries(pins)) {
		const code = await css(file);
		for (const re of res) assert.match(code, re, file);
	}
});
