import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { JSDOM } from 'jsdom';
import { FAMILIES } from '../src/demo/framework/catalog';
import { LEGACY_IDS, resolveHash } from '../src/demo/framework/hash';
import { highlight } from '../src/demo/framework/highlight';
import { exampleOrder, exampleSlug, kebab, stripModuleScript } from '../src/demo/framework/snippet';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const DEMO = join(ROOT, 'src/demo');

/** @returns {Promise<{ family: string, name: string, dir: string, files: string[] }[]>} */
async function componentDirs() {
	const out = [];
	for (const family of FAMILIES) {
		let names = [];
		try {
			names = await readdir(join(DEMO, family));
		} catch {
			continue;
		}
		for (const name of names.sort()) {
			const dir = join(DEMO, family, name);
			const files = (await readdir(dir)).sort();
			out.push({ family, name, dir, files });
		}
	}
	return out;
}
const dirs = await componentDirs();

test('kebab ids and example slugs', () => {
	assert.equal(kebab('SegmentedControl'), 'segmented-control');
	assert.equal(kebab('NavBar'), 'nav-bar');
	assert.equal(kebab('Button'), 'button');
	assert.equal(kebab('ThemeTokens'), 'theme-tokens');
	assert.equal(kebab('AppShell'), 'app-shell');
	assert.equal(exampleSlug('03-States.svelte'), 'states');
	assert.equal(exampleSlug('10-LongContent.svelte'), 'long-content');
	assert.equal(exampleOrder('03-States.svelte'), 3);
	assert.ok(exampleOrder('States.svelte') > 1000);
});

test('stripModuleScript removes exactly the module script block', () => {
	const src = `<script module>\n\texport const meta = { title: 'x' };\n</script>\n\n<script lang="ts">\n\tlet a = 1;\n</script>\n\n<p>{a}</p>\n`;
	assert.equal(stripModuleScript(src), `<script lang="ts">\n\tlet a = 1;\n</script>\n\n<p>{a}</p>\n`);
	assert.equal(stripModuleScript(src.replace('<script module>', '<script module lang="ts">')), stripModuleScript(src));
	const plain = `<script lang="ts">\n\tlet a = 1;\n</script>\n`;
	assert.equal(stripModuleScript(plain), plain);
});

test('anchors of the former single-page showcase resolve to section ids', () => {
	assert.equal(resolveHash('#form-atoms'), 'input');
	assert.equal(resolveHash('player-sliders'), 'seek-slider');
	assert.equal(resolveHash('#button'), 'button');
	assert.equal(resolveHash('#g-forms'), 'input');
	assert.equal(resolveHash('#conversation'), 'conversation-panel');
	assert.equal(resolveHash(''), '');
	for (const target of Object.values(LEGACY_IDS)) assert.match(target, /^[a-z-]+$/);
});

test('highlight emits hljs classes and escapes markup', () => {
	const html = highlight(`<script lang="ts">\n\timport { Button } from '@dorsk/tsumikit';\n\tlet n = $state(3); // count\n</script>\n<Button variant="primary">Don't</Button>`);
	assert.match(html, /<span class="hljs-keyword">import<\/span>/);
	assert.match(html, /<span class="hljs-string">'@dorsk\/tsumikit'<\/span>/);
	assert.match(html, /<span class="hljs-built_in">\$state<\/span>/);
	assert.match(html, /<span class="hljs-comment">\/\/ count<\/span>/);
	assert.match(html, /<span class="hljs-attr">variant<\/span>=/);
	assert.match(html, /<span class="hljs-tag">&lt;<span class="hljs-name">Button<\/span><\/span>/);
	assert.match(html, /Don't/);
	assert.doesNotMatch(html, /<Button/);
});

test('every demo directory has a meta.ts with a description and well-named examples', async () => {
	assert.ok(dirs.length >= 1);
	for (const d of dirs) {
		assert.ok(d.files.includes('meta.ts'), `${d.family}/${d.name} has no meta.ts`);
		const meta = await readFile(join(d.dir, 'meta.ts'), 'utf8');
		assert.match(meta, /export const meta/, `${d.name}/meta.ts must export const meta`);
		assert.match(meta, /description:/, `${d.name}/meta.ts needs a description`);
		const examples = d.files.filter((f) => f.endsWith('.svelte'));
		for (const f of examples) {
			assert.match(f, /^\d{2}-[A-Z][A-Za-z0-9]*\.svelte$/, `${d.name}/${f}: name as NN-Title.svelte`);
			const src = await readFile(join(d.dir, f), 'utf8');
			assert.match(src, /^\s*<script module(?: lang="ts")?>[\s\S]*?export const meta = \{[\s\S]*?title:/, `${d.name}/${f}: needs a <script module> meta with a title`);
			assert.doesNotMatch(src, /from '\$lib/, `${d.name}/${f}: import from '@dorsk/tsumikit', not $lib`);
			assert.doesNotMatch(stripModuleScript(src), /<script module/);
		}
		const slugs = examples.map(exampleSlug);
		assert.equal(new Set(slugs).size, slugs.length, `${d.name}: duplicate example slugs`);
	}
});

test('section ids are unique across families', () => {
	const ids = dirs.map((d) => kebab(d.name));
	assert.equal(new Set(ids).size, ids.length);
});

/**
 * Bundle the framework with the Button examples wired by hand: esbuild has no
 * import.meta.glob, so the registry module is replaced by a stub holding one entry.
 */
async function buildFramework() {
	const dir = join(DEMO, 'atoms/Button');
	const files = (await readdir(dir)).filter((f) => f.endsWith('.svelte')).sort();
	const imports = files
		.map((f, i) => `import Ex${i}, { meta as m${i} } from '../atoms/Button/${f}';\nimport raw${i} from '../atoms/Button/${f}?raw';`)
		.join('\n');
	const examples = files
		.map((f, i) => `{ id: 'button--' + exampleSlug('${f}'), slug: exampleSlug('${f}'), file: '${f}', meta: m${i}, component: Ex${i}, source: stripModuleScript(raw${i}) }`)
		.join(',\n');
	const registry = `
import { meta } from '../atoms/Button/meta.ts';
import { exampleSlug, stripModuleScript } from './snippet.ts';
${imports}
const button = { id: 'button', name: 'Button', family: 'atoms', meta, examples: [${examples}] };
const scrim = { id: 'scrim', name: 'Scrim', family: 'atoms', meta: { description: '' }, examples: [] };
const appShell = { id: 'app-shell', name: 'AppShell', family: 'layouts', meta: { description: '' }, examples: [] };
export const entries = [button, scrim, appShell];
export const byName = new Map(entries.map((e) => [e.name, e]));
export const groups = [{ family: 'atoms', entries: [button, scrim] }, { family: 'layouts', entries: [appShell] }];
export const searchText = (e) => [e.name, e.id, e.family, e.meta.description, ...(e.meta.keywords ?? [])].join(' ').toLowerCase();
export const resolveRef = (ref) => byName.get(ref)?.id ?? ref;
`;
	const entry = `
import { flushSync, mount } from 'svelte';
import DemoShell from '../../src/demo/framework/DemoShell.svelte';
import DemoSection from '../../src/demo/framework/DemoSection.svelte';
import { entries } from '../../src/demo/framework/registry';
globalThis.__fixture = { mount, flushSync, DemoShell, DemoSection, entries };
`;
	const out = await esbuild.build({
		stdin: { contents: entry, resolveDir: join(ROOT, 'tests/fixtures'), loader: 'js' },
		bundle: true,
		write: false,
		format: 'iife',
		platform: 'browser',
		conditions: ['svelte', 'browser', 'import'],
		define: { 'import.meta.env.DEV': 'false' },
		alias: { $lib: join(ROOT, 'src/lib'), '@dorsk/tsumikit': join(ROOT, 'src/lib') },
		plugins: [
			{
				name: 'demo-virtuals',
				setup(build) {
					build.onResolve({ filter: /^\$app\/paths$/ }, () => ({ path: 'app-paths', namespace: 'virtual' }));
					build.onLoad({ filter: /^app-paths$/, namespace: 'virtual' }, () => ({ contents: "export const base = '';", loader: 'js' }));
					build.onResolve({ filter: /framework\/registry$|^\.\/registry$/ }, () => ({ path: 'registry', namespace: 'virtual' }));
					build.onLoad({ filter: /^registry$/, namespace: 'virtual' }, () => ({
						contents: registry,
						resolveDir: join(DEMO, 'framework'),
						loader: 'js'
					}));
					build.onResolve({ filter: /\?raw$/ }, (args) => ({
						path: join(args.resolveDir, args.path.replace(/\?raw$/, '')),
						namespace: 'raw'
					}));
					build.onLoad({ filter: /.*/, namespace: 'raw' }, async (args) => ({ contents: await readFile(args.path, 'utf8'), loader: 'text' }));
				}
			},
			sveltePlugin({ compilerOptions: { css: 'injected' } })
		]
	});
	return out.outputFiles[0].text;
}
const bundle = await buildFramework();

function dom() {
	const d = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/tsumikit/' });
	d.window.matchMedia = /** @type {any} */ (
		() => ({ matches: true, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
	);
	d.window.Element.prototype.scrollIntoView = () => {};
	d.window.eval(bundle);
	return d;
}

test('DemoSection renders the Button examples with anchors, previews and verbatim snippets', () => {
	const d = dom();
	const { mount, flushSync, DemoSection, entries } = d.window.__fixture;
	const entry = entries[0];
	mount(DemoSection, { target: d.window.document.body, props: { entry } });
	flushSync();
	const doc = d.window.document;

	const section = doc.getElementById('button');
	assert.ok(section, '#button section');
	assert.equal(section.getAttribute('data-demo-section'), '');
	assert.equal(section.querySelector('h2')?.textContent?.trim(), 'Button');
	assert.ok(section.textContent?.includes(entry.meta.description));

	const cards = [...section.querySelectorAll('[data-tsu="Card"].example')];
	assert.equal(cards.length, entry.examples.length);
	assert.ok(cards.length >= 3);
	for (const [i, card] of cards.entries()) {
		const ex = entry.examples[i];
		assert.equal(card.id, ex.id);
		assert.equal(card.querySelector('h3 a')?.getAttribute('href'), `#${ex.id}`);
		assert.equal(card.querySelector('h3')?.textContent?.trim(), ex.meta.title);
		assert.ok(card.querySelector('.example__preview [data-tsu="Button"]'), `${ex.file} renders a Button`);
		const toggle = /** @type {HTMLButtonElement} */ (card.querySelector('[data-tsu="Disclosure"] button'));
		assert.equal(toggle.getAttribute('aria-expanded'), 'false');
		toggle.click();
		flushSync();
		assert.equal(toggle.getAttribute('aria-expanded'), 'true');
		const code = card.querySelector('[data-tsu="CodeBlock"] pre, [data-tsu="CodeBlock"] code');
		assert.ok(code, `${ex.file} has a CodeBlock`);
		assert.equal(code.textContent, ex.source);
		assert.doesNotMatch(ex.source, /<script module/);
		assert.ok(card.querySelector('[data-tsu="CodeBlock"] [data-tsu="CopyButton"]'), `${ex.file} has a copy button`);
		assert.ok(card.querySelector('.example__head [data-tsu="CopyButton"]'), `${ex.file} has a copy-link button`);
	}
	assert.equal(section.querySelectorAll('.example__preview--stack').length, cards.length);
});

test('a section without examples renders no migration notice or legacy link', () => {
	const d = dom();
	const { mount, flushSync, DemoSection, entries } = d.window.__fixture;
	mount(DemoSection, { target: d.window.document.body, props: { entry: entries[1] } });
	flushSync();
	const doc = d.window.document;
	assert.ok(doc.getElementById('scrim'));
	assert.equal(doc.querySelector('[data-tsu="Callout"]'), null);
	assert.equal(doc.querySelector('a[href*="legacy"]'), null);
	assert.equal(doc.querySelectorAll('.example').length, 0);
});

test('DemoShell: AppShell nav grouped by family, filter hides sections, toolbar keeps theme controls', () => {
	const d = dom();
	const { mount, flushSync, DemoShell } = d.window.__fixture;
	mount(DemoShell, { target: d.window.document.body });
	flushSync();
	const doc = d.window.document;

	assert.ok(doc.querySelector('[data-tsu="AppShell"]'));
	const nav = doc.querySelector('[data-demo-nav]');
	assert.ok(nav, 'sidebar nav');
	const sections = [...nav.querySelectorAll('[data-tsu="NavSection"]')];
	assert.ok(sections.length >= 2, 'NavSection per family');
	assert.deepEqual(
		[...nav.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')),
		['#button', '#scrim', '#app-shell']
	);
	assert.equal(nav.querySelector('a[href="#button"] [data-tsu="Badge"]')?.textContent?.trim(), String(doc.querySelectorAll('#button .example').length));

	const toolbar = doc.querySelector('[data-tsu="AppShell"] > header .demo-toolbar');
	assert.ok(toolbar, 'toolbar in the header');
	assert.ok(toolbar.querySelector('[data-tsu="ThemePicker"]'), 'theme picker');
	assert.ok(toolbar.querySelector('[data-tsu="FontScalePicker"]'), 'font scale picker');
	assert.equal(toolbar.querySelector('a[href*="legacy"]'), null);
	assert.ok(toolbar.querySelector('a[href="/shell"]'));
	assert.ok(toolbar.querySelector('a[href="https://github.com/DorskFR/tsumikit"]'));
	assert.match(toolbar.textContent, /v\d+\.\d+\.\d+/);

	assert.equal(doc.querySelectorAll('[data-demo-section]').length, 3);
	assert.equal(doc.querySelectorAll('[data-demo-section][hidden]').length, 0);
	const filter = /** @type {HTMLInputElement} */ (nav.querySelector('input'));
	filter.value = 'scr';
	filter.dispatchEvent(new d.window.Event('input', { bubbles: true }));
	flushSync();
	assert.deepEqual([...nav.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')), ['#scrim']);
	assert.equal(doc.getElementById('button')?.hidden, true);
	assert.equal(doc.getElementById('scrim')?.hidden, false);
	filter.value = 'zzz';
	filter.dispatchEvent(new d.window.Event('input', { bubbles: true }));
	flushSync();
	assert.match(nav.textContent, /No component matches/);
});
