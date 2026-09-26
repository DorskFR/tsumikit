import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { compile } from 'svelte/compiler';
import { buildFixture } from './fixtures/build.mjs';
import { hasDecl, rule } from './helpers.mjs';

// jsdom has no layout engine: the geometry contract (the field's border box
// spanning the group, text clear of the adornments, bottom alignment while
// growing, the 390px zoom rect) is asserted structurally here — the field is
// the full-width element, the adornments are overlays, the padding reads the
// measured vars and the ResizeObserver writes them.

const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/${p}`, import.meta.url), 'utf8');
const [group, input, textarea, composer, index, readme] = await Promise.all([
	read('components/molecules/InputGroup.svelte'),
	read('components/atoms/Input.svelte'),
	read('components/atoms/Textarea.svelte'),
	read('components/molecules/Composer.svelte'),
	read('index.ts'),
	readFile(new URL('../README.md', import.meta.url), 'utf8')
]);
const bundle = await buildFixture('mount-input-group.js');

const TABBABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * @typedef {{ target: Element, borderBoxSize?: { inlineSize: number }[], contentRect: { width: number } }} Entry
 * @typedef {{ observed: Element[], fire: (entries: Entry[]) => void, disconnected: number }} RoSpy
 */


function render(/** @type {Record<string, unknown>} */ props = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	const win = dom.window;
	/** @type {RoSpy[]} */
	const observers = [];
	win.ResizeObserver = class {
		/** @param {(entries: Entry[]) => void} cb */
		constructor(cb) {
			/** @type {RoSpy} */
			const spy = { observed: [], fire: cb, disconnected: 0 };
			observers.push(spy);
			this.spy = spy;
		}
		/** @param {Element} el */
		observe(el) {
			this.spy.observed.push(el);
		}
		disconnect() {
			this.spy.disconnected++;
		}
	};
	win.HTMLElement.prototype.setPointerCapture = () => {};
	win.HTMLElement.prototype.releasePointerCapture = () => {};
	win.eval(bundle);
	const { mount, flushSync, Fixture } = win.__fixture;
	mount(Fixture, { target: win.document.body, props });
	flushSync();
	const doc = win.document;
	const ig = /** @type {HTMLElement} */ (doc.querySelector('[data-tsu="InputGroup"]'));
	return {
		doc,
		win,
		ig,
		observers,
		flush: flushSync,
		field: () => /** @type {HTMLElement} */ (doc.getElementById('msg')),
		leading: () => /** @type {HTMLElement | null} */ (ig.querySelector('.ig-leading')),
		trailing: () => /** @type {HTMLElement | null} */ (ig.querySelector('.ig-trailing')),
		/** @param {Element} el @param {number} px */
		resize(el, px) {
			for (const o of observers)
				if (o.observed.includes(el)) o.fire([{ target: el, borderBoxSize: [{ inlineSize: px }], contentRect: { width: px } }]);
			flushSync();
		}
	};
}

test('the field wrapper is the full-width element and the adornments are overlays', () => {
	assert.ok(hasDecl(group, '.ig', 'position', 'relative'));
	assert.ok(hasDecl(group, '.ig', 'width', '100%'));
	assert.ok(hasDecl(group, '.ig-field', 'width', '100%'));
	assert.ok(hasDecl(group, '.ig-adorn', 'position', 'absolute'));
	assert.doesNotMatch(rule(group, '.ig').display ?? '', /grid/);
	assert.doesNotMatch(group, /\.ig-adorn\s*{[^}]*flex:/);

	const ui = render();
	assert.equal(ui.ig.children.length, 3);
	assert.ok(ui.ig.children[1].classList.contains('ig-field'));
	assert.ok(ui.ig.children[1].contains(ui.field()));
});

test('the grouped field pads its text from the measured adornment widths', () => {
	for (const [src, sel] of [
		[textarea, '.textarea.grouped'],
		[input, '.input.grouped']
	]) {
		const pad = rule(src, sel)['padding-inline'];
		assert.ok(pad, `${sel} declares padding-inline`);
		assert.match(pad, /max\(var\(--ig-pad-x\), var\(--ig-leading-w, 0px\) \+ var\(--ig-gap\)\)/);
		assert.match(pad, /max\(var\(--ig-pad-x\), var\(--ig-trailing-w, 0px\) \+ var\(--ig-gap\)\)/);
		assert.ok(hasDecl(src, sel, 'border-radius', 'var(--ig-radius)'));
	}
	assert.ok(hasDecl(input, '.input.grouped', 'width', '100%'));
	assert.ok(hasDecl(textarea, '.textarea-wrap.grouped', 'width', '100%'));
	for (const size of ['sm', 'lg']) assert.ok(rule(group, `.ig-${size}`)['--ig-h'], `.ig-${size} sets --ig-h`);
	assert.ok(hasDecl(group, '.ig', '--ig-h', 'var(--control-height-default)'));
	assert.ok(hasDecl(group, '.ig-sm', '--ig-h', 'var(--control-height-compact)'));
	assert.ok(hasDecl(group, '.ig-lg', '--ig-h', 'var(--control-height-large)'));
});

test('a ResizeObserver per adornment writes --ig-leading-w / --ig-trailing-w on the group', () => {
	const ui = render();
	const lead = /** @type {HTMLElement} */ (ui.leading());
	const trail = /** @type {HTMLElement} */ (ui.trailing());
	assert.ok(ui.observers.some((o) => o.observed.includes(lead)), 'leading cell observed');
	assert.ok(ui.observers.some((o) => o.observed.includes(trail)), 'trailing cell observed');
	assert.equal(ui.ig.style.getPropertyValue('--ig-leading-w'), '0px');
	assert.equal(ui.ig.style.getPropertyValue('--ig-trailing-w'), '0px');

	ui.resize(lead, 40);
	ui.resize(trail, 96);
	assert.equal(ui.ig.style.getPropertyValue('--ig-leading-w'), '40px');
	assert.equal(ui.ig.style.getPropertyValue('--ig-trailing-w'), '96px');
});

test('a trailing label that changes width re-pads the field (the var follows the observer)', () => {
	const ui = render({ sendLabel: 'Send' });
	const trail = /** @type {HTMLElement} */ (ui.trailing());
	ui.resize(trail, 64);
	assert.equal(ui.ig.style.getPropertyValue('--ig-trailing-w'), '64px');
	ui.resize(trail, 132);
	assert.equal(ui.ig.style.getPropertyValue('--ig-trailing-w'), '132px');
	assert.ok(ui.field().classList.contains('grouped'));
});

test('without an adornment its var is 0px and no empty cell renders', () => {
	const ui = render({ withLeading: false });
	assert.equal(ui.leading(), null);
	assert.equal(ui.ig.children.length, 2);
	assert.equal(ui.ig.style.getPropertyValue('--ig-leading-w'), '0px');
});

test('Tab order is leading → field → trailing', () => {
	const ui = render();
	const ids = [...ui.doc.querySelectorAll(TABBABLE)].map((el) => el.id);
	assert.deepEqual(ids.slice(0, 5), ['before', 'attach', 'msg', 'send', 'after']);
	assert.equal(ui.field().tagName, 'TEXTAREA');
	const ui2 = render({ field: 'input' });
	assert.equal(ui2.field().tagName, 'INPUT');
	assert.ok(ui2.field().classList.contains('grouped'));
});

test('the group draws the focus ring around the whole unit; the grouped field yields its own', () => {
	assert.match(group, /\.ig:has\(:focus-visible\)::after\s*{[^}]*outline: var\(--focus-ring\);/s);
	assert.ok(hasDecl(group, '.ig:has(:focus-visible)::after', 'inset', '0'));
	assert.ok(hasDecl(group, '.ig:has(:focus-visible)::after', 'border-radius', 'var(--ig-radius)'));
	assert.ok(hasDecl(textarea, '.textarea.grouped:focus-visible', 'outline', 'none'));
	assert.ok(hasDecl(input, '.input.grouped:focus-visible', 'outline', 'none'));
	assert.ok(hasDecl(textarea, '.textarea:focus-visible', 'outline', 'var(--focus-ring)'));
	assert.ok(hasDecl(input, '.input:focus-visible', 'outline', 'var(--focus-ring)'));
});

test('size, disabled and error flow to the field through context; loose fields are untouched', () => {
	const ui = render({ size: 'sm', disabled: true, error: true });
	const field = /** @type {HTMLTextAreaElement} */ (ui.field());
	assert.ok(field.classList.contains('textarea-sm'));
	assert.equal(field.disabled, true);
	assert.equal(field.getAttribute('aria-invalid'), 'true');
	assert.ok(ui.ig.classList.contains('ig-sm'));
	assert.ok(ui.ig.classList.contains('disabled'));

	const loose = /** @type {HTMLTextAreaElement} */ (ui.doc.getElementById('loose'));
	assert.equal(loose.classList.contains('grouped'), false);
	assert.equal(loose.classList.contains('textarea-sm'), false);
	assert.equal(loose.disabled, false);
	assert.equal(loose.getAttribute('aria-invalid'), null);
	const looseInput = /** @type {HTMLInputElement} */ (ui.doc.getElementById('loose-input'));
	assert.equal(looseInput.classList.contains('grouped'), false);

	const lg = render({ size: 'lg', field: 'input' });
	assert.ok(lg.field().classList.contains('input-lg'));
	assert.ok(lg.ig.classList.contains('ig-lg'));
});

test('align, class, style and rest attributes land on the anchor element', () => {
	const ui = render({ align: 'center' });
	assert.ok(ui.ig.classList.contains('ig-center'));
	assert.ok(ui.ig.classList.contains('probe'));
	assert.equal(ui.ig.style.getPropertyValue('--probe'), '1');
	assert.equal(render().ig.classList.contains('ig-center'), false);
	assert.match(group, /\.\.\.rest\s*}: Omit<HTMLAttributes<HTMLDivElement>, keyof Own> & Own = \$props\(\);/);
	assert.match(group, /<div\s+{\.\.\.rest}\s+data-tsu="InputGroup"/);
});

test('the top resize handle stays between the adornments and still drags', async () => {
	assert.ok(hasDecl(textarea, '.textarea-wrap.grouped .resize-handle', 'left', 'var(--ig-leading-w, 0px)'));
	assert.ok(hasDecl(textarea, '.textarea-wrap.grouped .resize-handle', 'right', 'var(--ig-trailing-w, 0px)'));

	const ui = render({ resize: 'top' });
	const handle = /** @type {HTMLElement} */ (ui.ig.querySelector('.resize-handle.resize-top'));
	assert.ok(handle, 'top handle rendered inside the group');
	const field = ui.field();
	const wrap = /** @type {HTMLElement} */ (field.parentElement);
	assert.ok(wrap.classList.contains('grouped'));
	assert.equal(handle.parentElement, wrap);

	const ev = (/** @type {string} */ type, /** @type {number} */ clientY) =>
		new ui.win.PointerEvent(type, { clientY, pointerId: 1, bubbles: true });
	handle.dispatchEvent(ev('pointerdown', 200));
	ui.flush();
	assert.ok(wrap.classList.contains('dragging'));
	handle.dispatchEvent(ev('pointermove', 160));
	await new Promise((r) => ui.win.requestAnimationFrame(() => r(undefined)));
	assert.equal(field.style.minHeight, '40px');
	handle.dispatchEvent(ev('pointerup', 160));
	ui.flush();
	assert.equal(wrap.classList.contains('dragging'), false);
});

test('a field taller than one row moves the adornments into a bar under the text', () => {
	assert.ok(hasDecl(group, '.ig-bar .ig-field', 'padding-bottom', 'var(--ig-h)'));
	assert.ok(hasDecl(group, '.ig-bar::before', 'height', 'var(--ig-h)'));
	assert.ok(hasDecl(group, '.ig-bar::before', 'inset', 'auto 0 0 0'));
	assert.ok(hasDecl(group, '.ig-bar::before', 'border-top', '0'));
	assert.ok(hasDecl(group, '.ig-bar:has(.ig-field :global(:focus))::before', 'border-color', 'var(--accent)'));
	assert.ok(hasDecl(group, ".ig-bar:has(.ig-field :global([aria-invalid='true']))::before", 'border-color', 'var(--danger)'));
	assert.ok(hasDecl(textarea, '.textarea.grouped.bar', 'padding-inline', 'var(--ig-pad-x)'));
	assert.ok(hasDecl(textarea, '.textarea.grouped.bar', 'border-bottom', '0'));
	assert.ok(hasDecl(textarea, '.textarea.grouped.bar', 'border-end-start-radius', '0'));
	assert.ok(hasDecl(textarea, '.textarea.grouped.bar', 'border-end-end-radius', '0'));
	assert.ok(hasDecl(textarea, '.textarea-wrap.grouped.bar .resize-handle', 'left', '0'));
	assert.ok(hasDecl(textarea, '.textarea-wrap.grouped.bar .resize-handle', 'right', '0'));
	assert.doesNotMatch(rule(textarea, '.textarea.grouped.bar')['padding-inline'] ?? '', /--ig-leading-w|--ig-trailing-w/);

	const ui = render();
	const field = ui.field();
	const wrap = /** @type {HTMLElement} */ (field.parentElement);
	assert.ok(ui.observers.some((o) => o.observed.includes(field)), 'the textarea observes its own size');
	assert.equal(ui.ig.classList.contains('ig-bar'), false);
	assert.equal(field.classList.contains('bar'), false);

	field.style.minHeight = '120px';
	ui.resize(field, 300);
	assert.ok(ui.ig.classList.contains('ig-bar'));
	assert.ok(field.classList.contains('bar'));
	assert.ok(wrap.classList.contains('bar'));
	assert.equal(field.style.minHeight, '120px', 'the probe restores the drag floor');

	field.style.minHeight = '';
	ui.resize(field, 300);
	assert.equal(ui.ig.classList.contains('ig-bar'), false);
	assert.equal(field.classList.contains('bar'), false);
	assert.equal(wrap.classList.contains('bar'), false);

	const bare = render({ withLeading: false, withTrailing: false });
	bare.field().style.minHeight = '120px';
	bare.resize(bare.field(), 300);
	assert.equal(bare.ig.classList.contains('ig-bar'), false, 'nothing to clear without adornments');

	const single = render({ field: 'input' });
	assert.equal(single.ig.classList.contains('ig-bar'), false);
});

test('Composer is rebuilt on InputGroup with the send button trailing and the attach button leading', () => {
	assert.match(composer, /import InputGroup from '\$lib\/components\/molecules\/InputGroup\.svelte';/);
	assert.match(composer, /<InputGroup\s+align="end"/);
	assert.match(composer, /leading={!toolbar && \(leading \|\| hasAttach\) \? startControls : undefined}/);
	assert.match(composer, /trailing={toolbar \? undefined : endControls}/);
	assert.match(composer, /{#snippet endControls\(\)}[\s\S]*<Button variant="primary" box="sm" loading={busy}/);
	assert.match(composer, /{#snippet startControls\(\)}[\s\S]*<FileButton onfiles={addFiles}/);
	assert.match(composer, /resize\?: 'none' \| 'top';/);
	assert.match(composer, /\{resize\}/);
	assert.doesNotMatch(rule(composer, '.composer').border ?? '', /solid/);
});

test('exported and documented', () => {
	assert.match(index, /export { default as InputGroup } from '\.\/components\/molecules\/InputGroup\.svelte';/);
	assert.match(readme, /### InputGroup/);
	assert.match(readme, /--ig-leading-w/);
});

test('adornments fill the field inside its border and follow its outer corners', () => {
	assert.ok(hasDecl(group, '.ig-adorn', 'top', '1px'));
	assert.ok(hasDecl(group, '.ig-adorn', 'bottom', '1px'));
	assert.ok(hasDecl(group, '.ig-adorn', '--ig-fuse-r', 'calc(var(--ig-radius) - 1px)'));
	assert.ok(hasDecl(group, '.ig-leading', 'inset-inline-start', '1px'));
	assert.ok(hasDecl(group, '.ig-trailing', 'inset-inline-end', '1px'));
	const child = '.ig-adorn > :global(*)';
	assert.ok(hasDecl(group, child, 'align-self', 'stretch'));
	assert.ok(hasDecl(group, child, '--btn-size', '100%'));
	assert.ok(hasDecl(group, child, 'border-radius', '0'));
	assert.ok(hasDecl(group, '.ig-leading > :global(:first-child)', 'border-radius', 'var(--ig-fuse-r) 0 0 var(--ig-fuse-r)'));
	assert.ok(hasDecl(group, '.ig-trailing > :global(:last-child)', 'border-radius', '0 var(--ig-fuse-r) var(--ig-fuse-r) 0'));
	assert.ok(hasDecl(group, '.ig-trailing > :global(:last-child .split-caret)', '--pop-trigger-radius', '0 var(--ig-fuse-r) var(--ig-fuse-r) 0'));
	assert.doesNotMatch(group, /\.ig:not\(\.ig-bar\)/, 'the bar keeps the adornments flush too');
});

test('a fixed-box adornment (FileButton box) still stretches square to the slot, so its glyph centres', async () => {
	const fileButton = await read('components/molecules/FileButton.svelte');
	assert.ok(hasDecl(fileButton, '.file-btn.box', 'height', 'var(--file-box)'));
	const sizing = '.ig.ig .ig-adorn > :global(*)';
	assert.ok(hasDecl(group, sizing, 'height', 'auto'));
	assert.ok(hasDecl(group, sizing, 'min-height', '0'));
	const square = '.ig .ig-adorn > :global(:is(.btn-box, .btn-square, .btn-icon, .icon-only))';
	assert.ok(hasDecl(group, square, 'width', 'auto'));
	assert.ok(hasDecl(group, square, 'min-width', '0'));
	assert.ok(hasDecl(group, square, 'aspect-ratio', '1'));
	assert.equal(rule(group, '.ig-adorn > :global(*)').height, undefined, 'the corner-fusing radius rules must keep outranking border-radius: 0');
});

test('in the bar the adornments hug the bottom and side borders, rounding only the bottom-outer corner', () => {
	assert.ok(hasDecl(group, '.ig-bar .ig-adorn', 'top', 'auto'));
	assert.ok(hasDecl(group, '.ig-bar .ig-adorn', 'height', 'calc(var(--ig-h) - 1px)'));
	assert.ok(hasDecl(group, '.ig-bar .ig-leading > :global(:first-child)', 'border-radius', '0 0 0 var(--ig-fuse-r)'));
	assert.ok(hasDecl(group, '.ig-bar .ig-trailing > :global(:last-child)', 'border-radius', '0 0 var(--ig-fuse-r) 0'));
	assert.ok(hasDecl(group, '.ig-bar .ig-leading > :global(:first-child .split-main)', '--btn-radius', '0 0 0 var(--ig-fuse-r)'));
	assert.ok(hasDecl(group, '.ig-bar .ig-trailing > :global(:last-child .split-caret)', '--pop-trigger-radius', '0 0 var(--ig-fuse-r) 0'));
});

/** @param {string} sel */
function specificity(sel) {
	const bare = sel.replace(/:where\([^)]*\)/g, '').replace(/:is\(([^)]*)\)/g, (_, list) => list.split(',')[0]);
	return [(bare.match(/#[\w-]+/g) ?? []).length, (bare.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g) ?? []).length];
}
/** @param {string} src @param {string} filename @param {RegExp} decl */
function selectorsDeclaring(src, filename, decl) {
	const css = compile(src, { filename, css: 'external' }).css?.code ?? '';
	return [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+){([^}]*)}/g)]
		.filter(([, , body]) => decl.test(body))
		.flatMap(([, sel]) => sel.split(',').map((s) => s.trim()));
}

test('the adornment height reset outranks every FileButton box rule, whatever the stylesheet order', async () => {
	const fileButton = await read('components/molecules/FileButton.svelte');
	const [reset] = selectorsDeclaring(group, 'InputGroup.svelte', /min-height: 0/);
	assert.ok(reset, 'InputGroup declares the reset');
	const [rid, rcls] = specificity(reset);
	for (const sel of selectorsDeclaring(fileButton, 'FileButton.svelte', /(^|[;\s])(min-)?height:/)) {
		const [id, cls] = specificity(sel);
		assert.ok(rid > id || (rid === id && rcls > cls), `${reset} must outrank ${sel}`);
	}
});

test('a FileButton box="sm" in leading drops its fixed box and stretches to the slot', () => {
	const ui = render({ attachBox: 'sm' });
	const btn = /** @type {HTMLElement} */ (ui.ig.querySelector('.ig-leading [data-tsu="FileButton"]'));
	assert.ok(btn.classList.contains('box'));
	const cs = ui.win.getComputedStyle(btn);
	assert.equal(cs.height, 'auto');
	assert.match(cs.minHeight, /^0(px)?$/);
	assert.equal(cs.alignSelf, 'stretch');
});

test('an empty field whose placeholder wraps stays single-row; typing past a row and clearing round-trips', () => {
	assert.ok(hasDecl(textarea, '.textarea.grouped:not(.bar)::placeholder', 'white-space', 'nowrap'));
	assert.ok(hasDecl(textarea, '.textarea.grouped:not(.bar)::placeholder', 'overflow', 'hidden'));

	const ui = render({ placeholder: 'Message… (Enter to send, Shift+Enter for newline)' });
	const field = /** @type {HTMLTextAreaElement} */ (ui.field());
	Object.defineProperty(field, 'scrollHeight', { configurable: true, get: () => 200 });
	ui.resize(field, 300);
	assert.equal(ui.ig.classList.contains('ig-bar'), false, 'the placeholder height is not content');

	field.value = 'x '.repeat(80);
	field.dispatchEvent(new ui.win.Event('input', { bubbles: true }));
	ui.flush();
	assert.ok(ui.ig.classList.contains('ig-bar'), 'real content past one row moves to the bar');

	field.value = '';
	field.dispatchEvent(new ui.win.Event('input', { bubbles: true }));
	ui.flush();
	assert.equal(ui.ig.classList.contains('ig-bar'), false, 'clearing returns inline');
});
