import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { compile } from 'svelte/compiler';
import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { JSDOM } from 'jsdom';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const FILES = {
	Input: 'atoms/Input.svelte',
	Textarea: 'atoms/Textarea.svelte',
	Select: 'atoms/Select.svelte',
	Field: 'molecules/Field.svelte',
	Tabs: 'molecules/Tabs.svelte',
	CopyButton: 'molecules/CopyButton.svelte',
	Link: 'atoms/Link.svelte',
	Card: 'atoms/Card.svelte'
};
/** @type {Record<string, string>} */
const src = {};
/** @type {Record<string, string>} */
const css = {};
for (const [name, file] of Object.entries(FILES)) {
	const path = join(ROOT, 'src/lib/components', file);
	src[name] = await readFile(path, 'utf8');
	css[name] = compile(src[name], { filename: path, css: 'external' }).css?.code ?? '';
}
/** @type {Record<string, string>} */
const FAMILY = {
	Input: 'focus',
	Textarea: 'focus',
	Select: 'focus',
	Field: 'focus',
	Tabs: 'tabs',
	CopyButton: 'copy',
	Link: 'link',
	Card: 'card'
};
const fxCss = (/** @type {string} */ name) => {
	const c = css[name];
	const at = c.indexOf(`[data-fx-${FAMILY[name]}`);
	assert.ok(at >= 0, `${name} has data-fx-${FAMILY[name]} rules`);
	return c.slice(c.lastIndexOf('}', at) + 1);
};

test('every picked variant has a closest-ancestor selector', () => {
	const scoped = (/** @type {string} */ fam, /** @type {string} */ v) =>
		`[data-fx-${fam}='${v}'] [data-fx-${fam}]:not([data-fx-${fam}='${v}'])`;
	for (const name of ['Input', 'Textarea', 'Select']) {
		assert.match(css[name], /:not\(\[data-fx-focus='none'\] :where/, `${name} bloom default`);
		assert.ok(css[name].includes(":is([data-fx-focus='bloom'], [data-fx-focus='label'])"), `${name} bloom and label scope`);
	}
	assert.ok(css.Field.includes(scoped('focus', 'label')));
	for (const v of ['pill', 'stretch', 'ink']) assert.ok(css.Tabs.includes(scoped('tabs', v)), v);
	for (const v of ['burst', 'tick']) assert.ok(css.CopyButton.includes(scoped('copy', v)), v);
	for (const v of ['sweep', 'highlight']) assert.ok(css.Link.includes(scoped('link', v)), v);
	for (const v of ['spotlight', 'orbit']) assert.ok(css.Card.includes(scoped('card', v)), v);
});

test('the first variant applies with no attribute on any ancestor', () => {
	const defaults = { Tabs: ['tabs', 'pill'], CopyButton: ['copy', 'burst'], Link: ['link', 'sweep'], Card: ['card', 'spotlight'] };
	for (const [name, [fam, v]] of Object.entries(defaults)) {
		assert.ok(css[name].includes(`:not([data-fx-${fam}]:not([data-fx-${fam}='${v}'])`), `${name} defaults to ${v}`);
	}
	const { window } = new JSDOM('<!doctype html><html><body><div id="w"><input class="input"></div></body></html>');
	const input = /** @type {Element} */ (window.document.querySelector('input'));
	const sel = ":not([data-fx-focus='none'] *)";
	assert.ok(input.matches(`.input${sel}`), 'bloom with no attribute');
	window.document.documentElement.setAttribute('data-fx-focus', 'none');
	assert.ok(!input.matches(`.input${sel}`), 'none on the root turns bloom off');
	window.document.documentElement.removeAttribute('data-fx-focus');
	window.document.getElementById('w')?.setAttribute('data-fx-focus', 'none');
	assert.ok(!input.matches(`.input${sel}`), 'none on a wrapper turns bloom off');
});

test('reduced motion is left to the global reset: no per-component media blocks', () => {
	for (const name of Object.keys(FILES)) assert.doesNotMatch(css[name], /prefers-reduced-motion/, `${name} leaves reduce to the global rule`);
	for (const name of ['Tabs', 'Card']) assert.doesNotMatch(css[name], /@keyframes/, name);
	assert.match(src.Card, /matchMedia\?\.\('\(prefers-reduced-motion: reduce\)'\)\.matches\) return;/);
	assert.match(src.Tabs, /prefers-reduced-motion: reduce\)'\)\.matches/);
});

test('colours come from theme tokens only', () => {
	for (const name of Object.keys(FILES)) {
		const block = fxCss(name);
		assert.doesNotMatch(block, /#[0-9a-f]{3,8}\b|\b(rgb|rgba|hsl|hsla|oklch|oklab)\(/i, name);
		assert.doesNotMatch(block, /:\s*(white|black|red|blue|green)\b/i, name);
	}
});

test('hover effects sit behind the fine-pointer query and never animate layout', () => {
	for (const name of Object.keys(FILES)) {
		const style = css[name];
		const gated = style.match(/@media \(hover: hover\) and \(pointer: fine\)\s*\{[\s\S]*?\n\t\}\n/g) ?? [];
		const outside = gated.reduce((/** @type {string} */ acc, /** @type {string} */ block) => acc.replace(block, ''), style);
		assert.equal((outside.match(/:hover/g) ?? []).length, 0, `${name} has an ungated :hover`);
		const block = fxCss(name);
		assert.doesNotMatch(block, /transition:\s*all/, name);
		assert.doesNotMatch(block, /transition(-property)?:[^;]*\b(width|height|top|left|margin|padding|inset)\b/, name);
	}
});

test('the card orbit makes exactly one ease-out revolution per hover-enter, then rests', () => {
	assert.match(css.Card, /@property --card-orbit \{\s*syntax: '<angle>';\s*inherits: false;\s*initial-value: 0deg;/);
	assert.match(css.Card, /--card-orbit var\(--card-spin, var\(--dur-instant\)\) var\(--ease-out\)/);
	assert.match(css.Card, /--card-orbit-spin: calc\(var\(--dur-slow\) \* 4\);/);
	assert.match(css.Card, /conic-gradient\(\s*from var\(--card-orbit\)/);
	assert.doesNotMatch(css.Card, /animation|infinite/);
	const hover = css.Card.match(/@media \(hover: hover\) and \(pointer: fine\)\s*\{[\s\S]*?\n\t\}\n/g)?.join('') ?? '';
	assert.match(hover, /--card-spin: var\(--card-orbit-spin\);/);
	assert.match(hover, /\.card-fx(:where\(\.svelte-\w+\))? \{\s*--card-orbit: 360deg;/);
});

const bundle = (
	await esbuild.build({
		stdin: {
			contents: `import { flushSync, mount, createRawSnippet } from 'svelte';
import Card from '../src/lib/components/atoms/Card.svelte';
import CopyButton from '../src/lib/components/molecules/CopyButton.svelte';
import Field from '../src/lib/components/molecules/Field.svelte';
import Input from '../src/lib/components/atoms/Input.svelte';
import Tabs from '../src/lib/components/molecules/Tabs.svelte';
globalThis.__fixture = { mount, flushSync, createRawSnippet, Card, CopyButton, Field, Input, Tabs };`,
			resolveDir: HERE,
			loader: 'js'
		},
		bundle: true,
		write: false,
		format: 'iife',
		platform: 'browser',
		conditions: ['svelte', 'browser', 'import'],
		define: { 'import.meta.env.DEV': 'false' },
		alias: { $lib: `${HERE}/../src/lib` },
		plugins: [sveltePlugin({ compilerOptions: { css: 'injected' } })]
	})
).outputFiles[0].text;

function boot() {
	const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	dom.window.eval(bundle);
	return { dom, f: /** @type {any} */ (dom.window).__fixture };
}

test('only tappable cards carry the light layer', () => {
	const { dom, f } = boot();
	const doc = dom.window.document;
	const children = f.createRawSnippet(() => ({ render: () => '<span>Body</span>' }));
	for (const props of [{ children }, { children, interactive: true, onclick() {} }, { children, tap: true }]) {
		const host = doc.createElement('div');
		doc.body.append(host);
		f.mount(f.Card, { target: host, props });
		f.flushSync();
		const fx = host.querySelector('.card-fx');
		assert.equal(!!fx, !!(props.interactive || props.tap));
		if (fx) assert.equal(fx.getAttribute('aria-hidden'), 'true');
	}
});

test('copy keeps both words in one cell so the label swap never changes the width', () => {
	const { dom, f } = boot();
	const host = dom.window.document.createElement('div');
	dom.window.document.body.append(host);
	f.mount(f.CopyButton, { target: host, props: { text: 'x', label: 'Copy', copiedLabel: 'Copied' } });
	f.flushSync();
	const words = host.querySelector('.words');
	assert.ok(words);
	assert.equal(words.getAttribute('aria-hidden'), 'true');
	assert.deepEqual([...words.querySelectorAll('.word')].map((w) => w.textContent), ['Copy', 'Copied']);
	assert.ok(host.querySelector('.glyphs svg.tick path'));
	assert.match(src.CopyButton, /<path d="[^"]+" pathLength="1" \/>/);
	assert.ok(host.querySelector('.glyphs .sparks'));
	assert.equal(host.querySelector('[data-tsu="CopyButton"]')?.getAttribute('aria-label'), 'Copy');
	assert.match(css.CopyButton, /\.word(\.svelte-\w+)? \{\s*grid-area: 1 \/ 1;/);
	assert.match(src.CopyButton, /& \.tick \{\s*display: block;\s*width: 1em;\s*height: 1em;\s*opacity: 0;/);
	assert.match(src.CopyButton, /&\.copied \.tick \{\s*opacity: 1;/);
});

test('a Field label can float: text wrapped in a span, the control gets a blank placeholder', () => {
	const { dom, f } = boot();
	const host = dom.window.document.createElement('div');
	dom.window.document.body.append(host);
	const children = f.createRawSnippet(() => ({ render: () => '<i></i>', setup() {} }));
	f.mount(f.Field, { target: host, props: { label: 'Name', children } });
	f.flushSync();
	assert.equal(host.querySelector('label.label > span.label-text')?.textContent, 'Name');
	assert.match(src.Input, /placeholder=\{rest\.placeholder \?\? \(field \? ' ' : undefined\)\}/);
	assert.equal((src.Textarea.match(/placeholder=\{rest\.placeholder \?\? \(field \? ' ' : undefined\)\}/g) ?? []).length, 2);
	assert.match(css.Field, /:not\(:focus\)::placeholder \{\s*color: transparent;/);
	assert.match(css.Field, /:is\(:focus, :not\(:placeholder-shown\), :autofill\)/);
	assert.match(src.Field, /--float-h: 3\.25rem;\s*position: relative;\s*& > \.label \{\s*position: absolute;/);
	assert.doesNotMatch(src.Field, /grid-area/);
	const loose = dom.window.document.createElement('div');
	dom.window.document.body.append(loose);
	f.mount(f.Input, { target: loose, props: { 'aria-label': 'Free' } });
	f.flushSync();
	assert.equal(loose.querySelector('input')?.hasAttribute('placeholder'), false);
});

test('ink tabs remember the click point; keyboard selection spreads from the centre', () => {
	const { dom, f } = boot();
	const host = dom.window.document.createElement('div');
	dom.window.document.body.append(host);
	const tabs = [
		{ id: 'a', label: 'A' },
		{ id: 'b', label: 'B' }
	];
	f.mount(f.Tabs, { target: host, props: { tabs, sound: false } });
	f.flushSync();
	const tab = /** @type {HTMLElement} */ (host.querySelectorAll('[role=tab]')[1]);
	tab.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, detail: 1, clientX: 7, clientY: 3 }));
	f.flushSync();
	assert.match(tab.style.getPropertyValue('--ink-x'), /px$/);
	assert.match(src.Tabs, /if \(fx === 'stretch' && typeof ind\.animate === 'function'\)/);
	assert.match(src.Tabs, /el\?\.style\.removeProperty\('--ink-x'\);/);
});
