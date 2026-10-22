import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { JSDOM } from 'jsdom';
import { hasDecl, rule } from './helpers.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/components/${p}`, import.meta.url), 'utf8');
const css = (/** @type {string} */ src) => src.slice(src.indexOf('<style>'));

/** @type {Record<string, string>} */
const files = {
	Icon: await read('atoms/Icon.svelte'),
	Card: await read('atoms/Card.svelte'),
	Artwork: await read('atoms/Artwork.svelte'),
	AppShell: await read('layouts/AppShell.svelte'),
	MasterDetail: await read('layouts/MasterDetail.svelte'),
	NavBar: await read('layouts/NavBar.svelte'),
	NavItem: await read('layouts/NavItem.svelte'),
	Accordion: await read('molecules/Accordion.svelte'),
	Disclosure: await read('molecules/Disclosure.svelte'),
	SectionHeader: await read('molecules/SectionHeader.svelte'),
	Timestamp: await read('molecules/Timestamp.svelte'),
	GitRef: await read('molecules/GitRef.svelte'),
	WorkingDir: await read('molecules/WorkingDir.svelte'),
	ChatBubble: await read('molecules/ChatBubble.svelte'),
	ConversationFeed: await read('organisms/ConversationFeed.svelte'),
	DataTable: await read('organisms/DataTable.svelte')
};

/** Records every playSound call instead of touching the sound store. */
const STUB_SOUND = {
	name: 'stub-sound',
	setup(/** @type {import('esbuild').PluginBuild} */ b) {
		b.onResolve({ filter: /(^|\/)sound$/ }, () => ({ path: 'stub-sound', namespace: 'stub' }));
		b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
			contents: `export function playSound(name, allow = true) { globalThis.__sounds.push([name, allow]); }`,
			loader: 'js'
		}));
	}
};
const bundle = (
	await esbuild.build({
		entryPoints: [join(HERE, 'fixtures/mount-wave2-f6.js')],
		bundle: true,
		write: false,
		format: 'iife',
		platform: 'browser',
		conditions: ['svelte', 'browser', 'import'],
		define: { 'import.meta.env.DEV': 'false' },
		alias: { $lib: join(HERE, '../src/lib') },
		plugins: [STUB_SOUND, sveltePlugin({ compilerOptions: { css: 'injected' } })]
	})
).outputFiles[0].text;

function render(/** @type {Record<string, unknown>} */ props = {}) {
	const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only', pretendToBeVisual: true });
	const win = dom.window;
	win.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
	win.__sounds = [];
	win.eval(bundle);
	const { mount, flushSync, Fixture } = win.__fixture;
	mount(Fixture, { target: win.document.body, props });
	flushSync();
	const doc = win.document;
	const click = (/** @type {Element | null} */ el) => {
		/** @type {HTMLElement} */ (el).click();
		flushSync();
	};
	const sounds = /** @type {() => [string, boolean][]} */ (() => JSON.parse(JSON.stringify(win.__sounds.splice(0))));
	return { doc, click, sounds };
}

test('Icon reads --icon-size from the surrounding control and keeps 1em when unset', () => {
	assert.ok(hasDecl(css(files.Icon), '.icon', 'font-size', 'var(--icon-size, 1em)'));
	assert.ok(hasDecl(css(files.Icon), '.icon', 'width', '1em'));
	const r = render();
	assert.equal(r.doc.querySelector('[data-probe="icon-plain"]')?.getAttribute('style') ?? '', '');
	assert.match(r.doc.querySelector('[data-probe="icon-sized"]')?.getAttribute('style') ?? '', /font-size: 24px/);
});

test('nothing plays on mount with open panels', () => {
	assert.deepEqual(render().sounds(), []);
});

test('Disclosure and Accordion play open / close by the new state, once per toggle', () => {
	const r = render();
	const disc = r.doc.querySelector('[data-probe="disc"] .disclosure__button');
	r.click(disc);
	assert.deepEqual(r.sounds(), [['close', true]]);
	assert.equal(disc?.getAttribute('aria-expanded'), 'false');
	r.click(disc);
	assert.deepEqual(r.sounds(), [['open', true]]);

	const acc = r.doc.querySelectorAll('[data-probe="acc"] .disclosure__button');
	r.click(acc[1]);
	assert.deepEqual(r.sounds(), [['open', true]]);
	r.click(acc[0]);
	assert.deepEqual(r.sounds(), [['close', true]]);
});

test('sound={false} passes allow=false to every hook', () => {
	const r = render({ silent: true });
	r.click(r.doc.querySelector('[data-probe="disc"] .disclosure__button'));
	r.click(r.doc.querySelectorAll('[data-probe="acc"] .disclosure__button')[1]);
	const calls = r.sounds();
	assert.equal(calls.length, 2);
	assert.ok(calls.every(([, allow]) => allow === false));
});

test('DataTable sort arrow is one glyph that rotates for descending', () => {
	const r = render();
	const sort = r.doc.querySelector('.dt-sort');
	const arrow = () => r.doc.querySelector('.dt-arrow');
	assert.equal(arrow()?.textContent?.trim(), '↕');
	r.click(sort);
	assert.equal(arrow()?.textContent?.trim(), '↑');
	assert.ok(!arrow()?.classList.contains('desc'));
	r.click(sort);
	assert.equal(arrow()?.textContent?.trim(), '↑');
	assert.ok(arrow()?.classList.contains('desc'));
	assert.ok(hasDecl(css(files.DataTable), '.dt-arrow.desc', 'rotate', '180deg'));
	assert.match(rule(css(files.DataTable), '.dt-arrow').transition, /rotate var\(--dur-base\) var\(--ease-out\)/);
});

test('focus rings inside scrollers are drawn inset (NavItem, MasterDetail, WorkingDir, DataTable rows)', () => {
	assert.ok(hasDecl(css(files.NavItem), '.nav-item:focus-visible', 'outline-offset', 'var(--focus-ring-offset-inset)'));
	assert.ok(hasDecl(css(files.MasterDetail), '.md-back:focus-visible', 'outline-offset', 'var(--focus-ring-offset-inset)'));
	assert.ok(hasDecl(css(files.WorkingDir), '.rail', '--focus-ring-offset', 'var(--focus-ring-offset-inset)'));
	assert.ok(hasDecl(css(files.DataTable), 'tr.clickable:focus-visible', 'outline-offset', 'var(--focus-ring-offset-inset)'));
	assert.ok(hasDecl(css(files.ConversationFeed), '.feed', 'scroll-padding-block', 'var(--sp-2)'));
	for (const [name, src] of Object.entries(files)) {
		assert.doesNotMatch(css(src), /outline: 2px solid|outline-offset: -?\d/, `${name} has a literal focus ring`);
	}
});

test('feed rows never shrink and the last DataTable touch slab stays inside the scroller', () => {
	assert.ok(hasDecl(css(files.ConversationFeed), '.feed > *', 'flex-shrink', '0'));
	assert.match(css(files.DataTable), /@media \(pointer: coarse\)\s*{[^@]*tbody tr:last-child td :global\(\.checkbox::before\)\s*{\s*inset-block-end: 0;/s);
});

test('AppShell drawer, scrim and MasterDetail detail enter and exit on compositor properties with tokens', () => {
	const shell = css(files.AppShell);
	assert.match(rule(shell, '.shell-sidebar').transition, /^translate var\(--dur-exit-slow\) var\(--ease-drawer\)$/);
	assert.ok(hasDecl(shell, '.shell-sidebar', 'translate', '-100% 0'));
	assert.ok(hasDecl(shell, '.shell-sidebar.open', 'transition-duration', 'var(--dur-sheet)'));
	assert.match(rule(shell, '.shell-scrim').transition, /opacity var\(--dur-exit\) var\(--ease-out\), display var\(--dur-exit\) allow-discrete/);
	assert.ok(hasDecl(shell, '.shell-scrim.show', 'transition-duration', 'var(--dur-base)'));
	assert.match(shell, /@starting-style\s*{\s*\.shell-scrim\.show\s*{\s*opacity: 0;/);
	const md = css(files.MasterDetail);
	assert.match(rule(md, '.md.mobile .md-detail').transition, /display var\(--dur-base\) allow-discrete/);
	assert.ok(hasDecl(md, '.md.mobile .md-detail[hidden]', 'translate', 'var(--shift-md) 0'));
});

test('disclosure chevrons rotate and panels fade in from --shift-xs; closing stays instant', () => {
	for (const [name, chevron, panel] of [
		['Disclosure', '.disclosure__chevron', '.disclosure__panel'],
		['SectionHeader', '.section-header :global(.sh-chevron)', '.sh-panel']
	]) {
		const s = css(files[name]);
		assert.equal(rule(s, chevron).transition, 'rotate var(--dur-base) var(--ease-out)', name);
		assert.match(rule(s, panel).transition, /opacity var\(--dur-base\) var\(--ease-out\), translate var\(--dur-base\) var\(--ease-out\)/, name);
		assert.match(s, /@starting-style\s*{[^}]*{\s*opacity: 0;\s*translate: 0 calc\(-1 \* var\(--shift-xs\)\);/, name);
		assert.doesNotMatch(rule(s, panel).transition ?? '', /display|height/, name);
	}
	assert.ok(hasDecl(css(files.Disclosure), '.disclosure__panel[hidden]', 'display', 'none'));
	assert.ok(hasDecl(css(files.Disclosure), '.disclosure__button:disabled', 'opacity', 'var(--disabled-opacity)'));
});

test('clickable cards press to --press-scale-lg; rows and nav items light up instantly and fade out', () => {
	assert.ok(hasDecl(css(files.Card), '.card-tap:active', 'scale', 'var(--press-scale-lg)'));
	assert.ok(hasDecl(css(files.Artwork), '.hover:active', 'scale', 'var(--press-scale-lg)'));
	for (const [name, sel] of [
		['NavItem', '.nav-item:hover'],
		['NavBar', '.navbar-link:hover'],
		['DataTable', 'tr.clickable:hover'],
		['Timestamp', '.ts-mode:hover']
	]) {
		assert.ok(hasDecl(css(files[name]), sel, 'transition-duration', 'var(--dur-instant)'), `${name} ${sel}`);
	}
});

test('every :hover rule sits under the fine-pointer hover media query', () => {
	for (const [name, src] of Object.entries(files)) {
		const style = css(src);
		const gated = style.match(/@media [^{]*\(hover: hover\) and \(pointer: fine\)\s*{[\s\S]*?\n\t}\n/g) ?? [];
		const outside = gated.reduce((acc, block) => acc.replace(block, ''), style);
		assert.equal((outside.match(/:hover/g) ?? []).length, 0, `${name} has an ungated :hover`);
	}
});

test('motion reads tokens only: no duration, easing or layout literals, no reduce blocks', () => {
	for (const [name, src] of Object.entries(files)) {
		const style = css(src);
		if (name !== 'Icon') assert.doesNotMatch(style, /\d+m?s\b/, `${name} has a duration literal`);
		assert.doesNotMatch(style, /cubic-bezier/, `${name} has an easing literal`);
		assert.doesNotMatch(style, /transition:\s*all/, name);
		if (name !== 'Icon') assert.doesNotMatch(style, /prefers-reduced-motion|@keyframes/, `${name} keeps a reduce block or keyframes`);
		assert.doesNotMatch(style, /transition:[^;]*\b(width|height|margin|padding|top|left)\b/, `${name} transitions layout`);
	}
});
