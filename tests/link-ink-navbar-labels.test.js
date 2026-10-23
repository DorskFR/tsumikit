import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';
import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { compile } from 'svelte/compiler';
import { JSDOM } from 'jsdom';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const LINK = join(ROOT, 'src/lib/components/atoms/Link.svelte');
const NAVBAR = join(ROOT, 'src/lib/components/layouts/NavBar.svelte');
const read = (/** @type {string} */ p) => readFile(join(ROOT, p), 'utf8');
const linkSrc = await readFile(LINK, 'utf8');
const navSrc = await readFile(NAVBAR, 'utf8');
const linkCss = compile(linkSrc, { filename: LINK, css: 'external' }).css?.code ?? '';
const navCss = compile(navSrc, { filename: NAVBAR, css: 'external' }).css?.code ?? '';
const flat = (/** @type {string} */ s) => s.replace(/\.svelte-[\w-]+/g, '').replace(/:where\(\)/g, '').replace(/\s+/g, ' ');

const STUDY = ['Today', 'Practice', 'Lecture', 'Grammar', 'Tasks', 'Progress', 'Me'].map((label, i) => ({ href: `/${i}`, label, icon: 'home', current: i === 0 }));

/** @param {'server' | 'client'} generate @param {string} entry */
async function bundle(generate, entry) {
	const out = await esbuild.build({
		stdin: { contents: entry, resolveDir: ROOT, loader: 'js' },
		bundle: true,
		write: false,
		format: 'iife',
		platform: generate === 'server' ? 'node' : 'browser',
		conditions: generate === 'server' ? ['svelte', 'node', 'import'] : ['svelte', 'browser', 'import'],
		define: { 'import.meta.env.DEV': 'false' },
		alias: { $lib: join(ROOT, 'src/lib') },
		plugins: [sveltePlugin({ compilerOptions: { css: 'injected', generate } })]
	});
	return out.outputFiles[0].text;
}

const entry = `import { createRawSnippet } from 'svelte';
import Link from ${JSON.stringify(LINK)};
import NavBar from ${JSON.stringify(NAVBAR)};
const text = (t) => createRawSnippet(() => ({ render: () => '<span>' + t + '</span>' }));`;

const ctx = vm.createContext({ console, URL, TextEncoder, TextDecoder, setTimeout, clearTimeout, queueMicrotask, Promise });
ctx.globalThis = ctx;
vm.runInContext(await bundle('server', `${entry}\nimport { render } from 'svelte/server';\nglobalThis.__t = { render, Link, NavBar, text };`), ctx);
const { render, Link, NavBar, text } = ctx.__t;
const html = (/** @type {any} */ C, /** @type {Record<string, unknown>} */ props) => {
	const { window } = new JSDOM(`<!doctype html><body>${render(C, { props }).body}</body>`);
	return window.document;
};
const client = await bundle('client', `${entry}\nimport { mount, flushSync } from 'svelte';\nglobalThis.__t = { mount, flushSync, Link, NavBar, text };`);

test('Link wraps its text in an inline run that paints the fx, for both the anchor and the button', () => {
	for (const props of [{ href: '/a' }, {}]) {
		const doc = html(Link, { ...props, children: text('Exam tasks') });
		const link = /** @type {HTMLElement} */ (doc.querySelector('[data-tsu="Link"]'));
		assert.equal(link.tagName, props.href ? 'A' : 'BUTTON');
		const outer = /** @type {HTMLElement} */ (link.firstElementChild);
		assert.ok(outer.classList.contains('link-text'), link.outerHTML);
		assert.equal(link.children.length, 1);
		const ink = /** @type {HTMLElement} */ (outer.firstElementChild);
		assert.ok(ink.classList.contains('link-ink'));
		assert.equal(ink.textContent, 'Exam tasks');
		assert.equal(link.textContent, 'Exam tasks');
	}
});

test('sweep and highlight paint on .link-ink, never on the link box', () => {
	const css = flat(linkCss);
	const scope = (/** @type {string} */ v) => `[data-fx-link='${v}'] [data-fx-link]:not([data-fx-link='${v}'])`;
	assert.ok(css.includes(scope('sweep')) && css.includes(scope('highlight')), 'closest-ancestor selectors kept');
	assert.ok(css.includes(":not([data-fx-link]:not([data-fx-link='sweep'])"), 'sweep stays the default');
	const blocks = [...css.matchAll(/\.link-ink \{([^{}]*)\}/g)].map((m) => m[1]).filter((b) => b.includes('background'));
	assert.equal(blocks.length, 2, 'one ink block per variant');
	const [sweep, highlight] = blocks;
	assert.match(sweep, /background-image: linear-gradient\(currentColor, currentColor\)/);
	assert.match(sweep, /background-position: var\(--link-on, 100%\) 100%, 0 100%;/);
	assert.match(sweep, /background-size: var\(--link-draw, 0%\) 1\.5px, var\(--link-base\) 1px;/);
	assert.match(sweep, /transition: background-size var\(--dur-fast\) var\(--ease-out\);/);
	assert.match(highlight, /background-size: var\(--link-draw, 0%\) 100%;/);
	assert.match(css, /\.link-text, \.link-ink \{ margin-inline: -0\.18em; padding-inline: 0\.18em; \}/, 'each level holds the marker overhang in its own padding');
	assert.match(highlight, /transition: background-size var\(--link-grow, var\(--dur-instant\)\) var\(--ease-out\) var\(--link-hold, var\(--dur-exit\)\);/);
	const outside = css.replace(/\.link-ink \{[^{}]*\}/g, '');
	assert.doesNotMatch(outside, /background-(image|size|position)/, 'the link box paints nothing');
	assert.doesNotMatch(css, /display:/, 'the outer run keeps its default display so a flex link blockifies it, not the ink');
	assert.match(css, /@property --link-mark \{ syntax: '<color>'; inherits: true;/, 'the marker colour reaches the ink');
	assert.match(css, /--link-mark var\(--link-in, var\(--dur-exit\)\) ease/);
	assert.doesNotMatch(css, /prefers-reduced-motion/, 'reduced motion stays with the global reset');
	assert.doesNotMatch(css, /transition(-property)?:[^;]*\b(width|height|top|left|margin|padding|inset)\b/);
});

test('NavBar defaults to labels="fit" and sizes every label from the widest word', () => {
	const doc = html(NavBar, { items: STUDY, label: 'Main', placement: 'bar' });
	const nav = /** @type {HTMLElement} */ (doc.querySelector('nav'));
	assert.ok(nav.classList.contains('labels-fit'));
	assert.ok(nav.classList.contains('stacked'));
	assert.match(nav.getAttribute('style') ?? '', /^--navbar-label-em: 4\.60;/, 'Grammar = G r a m m a r');
	const labels = [...doc.querySelectorAll('.navbar-label')];
	assert.deepEqual(labels.map((l) => l.textContent), STUDY.map((i) => i.label));
	assert.ok(labels.every((l) => !l.hasAttribute('style')), 'one size for the whole bar');
	const multi = html(NavBar, { items: [{ value: 'a', label: 'Saturday farmers market' }, { value: 'b', label: 'Go' }], label: 'M', maxWidth: '20rem', style: 'color: red' });
	assert.equal(multi.querySelector('nav')?.getAttribute('style'), '--navbar-label-em: 4.52; --navbar-max: 20rem;color: red', 'longest word, not the whole label');
	const cjk = html(NavBar, { items: [{ value: 'a', label: '設定画面' }], label: 'M' });
	assert.match(cjk.querySelector('nav')?.getAttribute('style') ?? '', /--navbar-label-em: 4\.00;/);
	for (const labels of ['truncate', 'full']) {
		const d = html(NavBar, { items: STUDY, label: 'Main', labels });
		assert.ok(d.querySelector('nav')?.classList.contains(`labels-${labels}`), labels);
		assert.ok(!d.querySelector('nav')?.classList.contains('labels-fit'));
	}
});

test('NavBar label mode survives a client mount', () => {
	const { window } = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only', pretendToBeVisual: true });
	window.eval(client);
	const { mount, flushSync, NavBar: Nav } = /** @type {any} */ (window).__t;
	mount(Nav, { target: window.document.body, props: { items: STUDY, label: 'Main', labels: 'full' } });
	flushSync();
	const nav = /** @type {HTMLElement} */ (window.document.querySelector('nav'));
	assert.ok(nav.classList.contains('labels-full'));
	assert.match(nav.getAttribute('style') ?? '', /--navbar-label-em: 4\.60;/);
});

test('fit shrinks the stacked label with a container clamp, then wraps two lines, then ellipsis', () => {
	const css = flat(navCss);
	assert.match(navSrc, /labels\?: 'fit' \| 'truncate' \| 'full';/);
	assert.match(navSrc, /labels = 'fit',/);
	assert.match(navSrc, /`--navbar-label-min` \(10px\)/, 'the floor token is documented on the prop');
	assert.match(css, /\.stacked\.labels-fit :is\(\.navbar-inner, \.navbar-side\) \{ gap: 0; \}/, 'items give their gap to the label');
	const link = css.match(/\.stacked\.labels-fit \.navbar-link \{([^}]*)\}/)?.[1] ?? '';
	assert.match(link, /container-type: inline-size;/);
	assert.match(link, /contain-intrinsic-inline-size: 4rem;/, 'shrink-to-fit navs keep a sane width');
	assert.match(link, /padding-inline: 0;/);
	const label = css.match(/\.stacked\.labels-fit \.navbar-label \{([^}]*)\}/)?.[1] ?? '';
	assert.match(label, /font-size: clamp\(var\(--navbar-label-min, calc\(0\.625rem \* var\(--fs-scale\)\)\), 100cqi \/ var\(--navbar-label-em\), 1em\);/);
	assert.match(label, /-webkit-line-clamp: 2;/);
	assert.match(label, /white-space: normal;/);
	assert.match(label, /text-align: center;/);
	assert.match(css, /\.navbar-label \{ min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; \}/, 'truncate keeps the one-line ellipsis');
	assert.match(css, /\.labels-full \.navbar-label \{ max-width: none; overflow: visible; \}/);
	assert.ok(css.indexOf('.labels-full .navbar-label') > css.indexOf('.stacked .navbar-label {'), 'full wins over the stacked cap');
});

test('demos show tap-sized links and a seven-item phone bar in every label mode', async () => {
	const taps = await read('src/demo/atoms/Link/05-TapTargets.svelte');
	assert.match(taps, /\['sweep', 'highlight'\]/);
	assert.match(taps, /display: inline-flex;[\s\S]*min-height: var\(--touch-target\);/);
	assert.match(taps, /<Text>[\s\S]*<Link href="#link" underline="always">wraps across lines/);
	const many = await read('src/demo/layouts/NavBar/04-ManyItems.svelte');
	for (const l of ['Today', 'Practice', 'Lecture', 'Grammar', 'Tasks', 'Progress', 'Me']) assert.match(many, new RegExp(`label: '${l}'`));
	assert.match(many, /\['fit', 'truncate'\]/);
	assert.match(many, /max-width: 24\.375rem;/, '390px');
	assert.doesNotMatch(many + taps, /\.navbar-label|\.link-ink/, 'demos use the public API only');
});
