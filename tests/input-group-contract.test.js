import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { compile } from 'svelte/compiler';
import { buildFixture } from './fixtures/build.mjs';
import { inputGroupPadding } from '../src/lib/input-group-context.ts';
import { hasDecl, readDocs, rule } from './helpers.mjs';

// jsdom has no layout engine: the geometry contract (the field's border box
// spanning the group, text clear of the adornments, bottom alignment while
// growing, the 390px zoom rect) is asserted structurally here — the field is
// the full-width element, the adornments are overlays, the ResizeObserver
// feeds the measured widths to the group context and the field pads inline from it.

const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/${p}`, import.meta.url), 'utf8');
const [group, input, textarea, composer, index, readme] = await Promise.all([
	read('components/molecules/InputGroup.svelte'),
	read('components/atoms/Input.svelte'),
	read('components/atoms/Textarea.svelte'),
	read('components/molecules/Composer.svelte'),
	read('index.ts'),
	readDocs('components.md')
]);
const bundle = await buildFixture('mount-input-group.js');

const FUSE = 'calc(var(--r-md) - var(--sp-px))';
/** The outer adornment and the buttons nested in it share one corner-fusing rule. */
const fused = (/** @type {string} */ root, /** @type {string} */ side, /** @type {string} */ edge, /** @type {string} */ radius) =>
	group.includes(
		`\t${root} ${side} > :global(${edge}),\n\t${root} ${side} > :global(${edge} :is(.btn, .btn-control)) {\n\t\tborder-radius: ${radius};\n\t}`
	);

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
		pad: () => doc.getElementById('msg')?.getAttribute('style') ?? '',
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
		assert.equal(rule(src, sel)['padding-inline'], undefined, `${sel} takes its padding inline`);
		assert.match(src, /style:padding-inline-start={pad\?\.start}\s+style:padding-inline-end={pad\?\.end}/);
		assert.ok(hasDecl(src, sel, 'border-radius', 'var(--r-md)'));
	}
	assert.doesNotMatch(group + input + textarea, /--ig-/);
	assert.ok(hasDecl(input, '.input.grouped', 'width', '100%'));
	assert.ok(hasDecl(textarea, '.textarea-wrap.grouped', 'width', '100%'));

	const ctx = { size: 'md', disabled: false, invalid: false, leadingW: 40, trailingW: 0, bar: false, setBar() {} };
	assert.deepEqual(inputGroupPadding(ctx), {
		start: 'max(var(--control-px-md), 40px + var(--sp-2))',
		end: 'max(var(--control-px-md), 0px + var(--sp-2))'
	});
	assert.deepEqual(inputGroupPadding({ ...ctx, size: 'sm', trailingW: 96 }), {
		start: 'max(var(--control-px-sm), 40px + var(--sp-1))',
		end: 'max(var(--control-px-sm), 96px + var(--sp-1))'
	});
	assert.equal(inputGroupPadding({ ...ctx, size: 'lg' }).start, 'max(var(--control-px-lg), 40px + var(--sp-2))');
	assert.deepEqual(inputGroupPadding({ ...ctx, bar: true }), { start: 'var(--control-px-md)', end: 'var(--control-px-md)' });
});

test('a ResizeObserver per adornment feeds the field its inline padding', () => {
	const ui = render();
	const lead = /** @type {HTMLElement} */ (ui.leading());
	const trail = /** @type {HTMLElement} */ (ui.trailing());
	assert.ok(ui.observers.some((o) => o.observed.includes(lead)), 'leading cell observed');
	assert.ok(ui.observers.some((o) => o.observed.includes(trail)), 'trailing cell observed');
	assert.match(ui.pad(), /padding-inline-start: max\(var\(--control-px-md\), 0px \+ var\(--sp-2\)\)/);
	assert.match(ui.pad(), /padding-inline-end: max\(var\(--control-px-md\), 0px \+ var\(--sp-2\)\)/);
	assert.doesNotMatch(ui.ig.getAttribute('style') ?? '', /--ig-/, 'the group itself carries no measured variable');

	ui.resize(lead, 40);
	ui.resize(trail, 96);
	assert.match(ui.pad(), /padding-inline-start: max\(var\(--control-px-md\), 40px \+ var\(--sp-2\)\)/);
	assert.match(ui.pad(), /padding-inline-end: max\(var\(--control-px-md\), 96px \+ var\(--sp-2\)\)/);
});

test('a trailing label that changes width re-pads the field (the padding follows the observer)', () => {
	const ui = render({ sendLabel: 'Send' });
	const trail = /** @type {HTMLElement} */ (ui.trailing());
	ui.resize(trail, 64);
	assert.match(ui.pad(), /padding-inline-end: max\(var\(--control-px-md\), 64px \+ var\(--sp-2\)\)/);
	ui.resize(trail, 132);
	assert.match(ui.pad(), /padding-inline-end: max\(var\(--control-px-md\), 132px \+ var\(--sp-2\)\)/);
	assert.ok(ui.field().classList.contains('grouped'));
});

test('without an adornment its side keeps the tier padding and no empty cell renders', () => {
	const ui = render({ withLeading: false });
	assert.equal(ui.leading(), null);
	assert.equal(ui.ig.children.length, 2);
	assert.match(ui.pad(), /padding-inline-start: max\(var\(--control-px-md\), 0px \+ var\(--sp-2\)\)/);
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
	assert.match(group, /\.ig:has\(:global\(:focus-visible\)\)::after\s*{[^}]*outline: var\(--focus-ring\);/s);
	assert.ok(hasDecl(group, '.ig:has(:global(:focus-visible))::after', 'inset', '0'));
	assert.ok(hasDecl(group, '.ig:has(:global(:focus-visible))::after', 'border-radius', 'var(--r-md)'));
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
	const ui = render({ resize: 'top' });
	const handle = /** @type {HTMLElement} */ (ui.ig.querySelector('.resize-handle.resize-top'));
	assert.ok(handle, 'top handle rendered inside the group');
	ui.resize(/** @type {HTMLElement} */ (ui.leading()), 40);
	ui.resize(/** @type {HTMLElement} */ (ui.trailing()), 96);
	assert.equal(handle.style.left, '40px');
	assert.equal(handle.style.right, '96px');
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
	for (const [tier, height] of [['', 'default'], ['.ig-sm', 'compact'], ['.ig-lg', 'large']]) {
		const bar = tier ? `${tier}.ig-bar` : '.ig-bar';
		assert.ok(hasDecl(group, `${bar} .ig-field`, 'padding-bottom', `var(--control-height-${height})`));
		assert.ok(hasDecl(group, `${bar}::before`, 'height', `var(--control-height-${height})`));
		assert.ok(hasDecl(group, `${bar} .ig-adorn`, 'height', `calc(var(--control-height-${height}) - var(--sp-px))`));
	}
	assert.ok(hasDecl(group, '.ig-bar::before', 'inset', 'auto 0 0 0'));
	assert.ok(hasDecl(group, '.ig-bar::before', 'border-top', '0'));
	assert.ok(hasDecl(group, '.ig-bar:has(.ig-field :global(:focus))::before', 'border-color', 'var(--accent)'));
	assert.ok(hasDecl(group, ".ig-bar:has(.ig-field :global([aria-invalid='true']))::before", 'border-color', 'var(--danger)'));
	assert.ok(hasDecl(textarea, '.textarea.grouped.bar', 'border-bottom', '0'));
	assert.ok(hasDecl(textarea, '.textarea.grouped.bar', 'border-end-start-radius', '0'));
	assert.ok(hasDecl(textarea, '.textarea.grouped.bar', 'border-end-end-radius', '0'));

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
	assert.match(ui.pad(), /padding-inline-start: var\(--control-px-md\); padding-inline-end: var\(--control-px-md\)/);
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
	assert.match(readme, /measured with a `ResizeObserver` and applied as the\s+field's inline padding/);
	assert.doesNotMatch(readme, /--ig-/);
});

test('adornments fill the field inside its border and follow its outer corners', () => {
	assert.ok(hasDecl(group, '.ig-adorn', 'top', 'var(--sp-px)'));
	assert.ok(hasDecl(group, '.ig-adorn', 'bottom', 'var(--sp-px)'));
	assert.ok(hasDecl(group, '.ig-leading', 'inset-inline-start', 'var(--sp-px)'));
	assert.ok(hasDecl(group, '.ig-trailing', 'inset-inline-end', 'var(--sp-px)'));
	const child = '.ig-adorn > :global(*)';
	assert.ok(hasDecl(group, child, 'align-self', 'stretch'));
	assert.ok(hasDecl(group, child, 'border-radius', '0'));
	const nested = ':is(.btn, .btn-control)';
	assert.ok(hasDecl(group, `.ig .ig-adorn :global(:is(.btn, .btn-control, .pop-trigger))`, 'border-radius', '0'));
	assert.ok(hasDecl(group, `.ig .ig-adorn :global(${nested})`, 'min-height', '100%'));
	assert.ok(fused('.ig', '.ig-leading', ':first-child', `${FUSE} 0 0 ${FUSE}`));
	assert.ok(fused('.ig', '.ig-trailing', ':last-child', `0 ${FUSE} ${FUSE} 0`));
	assert.ok(hasDecl(group, '.ig .ig-trailing > :global(:last-child .split-caret .pop-trigger)', 'border-radius', `0 ${FUSE} ${FUSE} 0`));
	assert.ok(hasDecl(group, `.ig .ig-trailing > :global(:last-child .split-main ${nested})`, 'border-radius', '0'));
	assert.doesNotMatch(group, /--(btn|pop-trigger)-/);
	assert.doesNotMatch(group, /\.ig:not\(\.ig-bar\)/, 'the bar keeps the adornments flush too');
});

test('a fixed-box adornment (FileButton box) still stretches square to the slot, so its glyph centres', async () => {
	const fileButton = await read('components/molecules/FileButton.svelte');
	assert.ok(hasDecl(fileButton, '.file-btn.box-sm', 'height', 'var(--box-sm)'));
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
	assert.ok(fused('.ig-bar', '.ig-leading', ':first-child', `0 0 0 ${FUSE}`));
	assert.ok(fused('.ig-bar', '.ig-trailing', ':last-child', `0 0 ${FUSE} 0`));
	assert.ok(hasDecl(group, '.ig-bar .ig-trailing > :global(:last-child .split-caret .pop-trigger)', 'border-radius', `0 0 ${FUSE} 0`));
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
