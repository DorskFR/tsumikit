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

test('every seeAlso names a demoed component, so it links to a page', async () => {
	const ids = new Set(dirs.map((d) => kebab(d.name)));
	/** @type {string[]} */
	const dangling = [];
	for (const d of dirs) {
		const meta = await readFile(join(d.dir, 'meta.ts'), 'utf8');
		const list = meta.match(/seeAlso:\s*\[([^\]]*)\]/)?.[1] ?? '';
		for (const [, ref] of list.matchAll(/'([^']+)'/g)) if (!ids.has(kebab(ref))) dangling.push(`${d.name} → ${ref}`);
	}
	assert.deepEqual(dangling, []);
});

test('section ids are unique across families', () => {
	const ids = dirs.map((d) => kebab(d.name));
	assert.equal(new Set(ids).size, ids.length);
});

const FIXTURE_META = ['atoms/Button', 'atoms/Scrim', 'layouts/AppShell'];
const FIXTURE_EXAMPLES = ['atoms/Button'];

/** @param {string} pattern @param {(rel: string) => boolean} pick */
async function globFiles(pattern, pick) {
	const re = new RegExp(`^${pattern.replace(/[.]/g, '\\.').replace(/\*/g, '[^/]*')}$`);
	/** @type {string[]} */
	const out = [];
	for (const d of dirs)
		for (const f of d.files) {
			const rel = `../${d.family}/${d.name}/${f}`;
			if (re.test(rel) && pick(rel)) out.push(rel);
		}
	return out;
}

/**
 * esbuild has no import.meta.glob: expand the globs of the real registry over a
 * few demo directories, lazy ones recording each import in `globalThis.__imported`.
 * @param {string} src
 */
async function expandGlobs(src) {
	/** @type {string[]} */
	const hoisted = [];
	let n = 0;
	const calls = [...src.matchAll(/import\.meta\.glob<[^>]*>\(\s*'([^']+)'\s*(?:,\s*(\{[\s\S]*?\}))?\s*\)/g)];
	for (const [call, pattern, opts = ''] of calls) {
		const eager = /eager:\s*true/.test(opts);
		const raw = /'\?raw'/.test(opts);
		const only = pattern.endsWith('meta.ts') ? FIXTURE_META : FIXTURE_EXAMPLES;
		const files = await globFiles(pattern, (rel) => only.some((dir) => rel.startsWith(`../${dir}/`)));
		const props = files.map((rel) => {
			const spec = JSON.stringify(raw ? `${rel}?raw` : rel);
			if (eager) {
				hoisted.push(`import * as __glob${n} from ${spec};`);
				return `${JSON.stringify(rel)}: __glob${n++}`;
			}
			const pick = /import:\s*'default'/.test(opts) ? '.then((m) => m.default)' : '';
			return `${JSON.stringify(rel)}: () => ((globalThis.__imported ??= []).push(${spec}), import(${spec})${pick})`;
		});
		src = src.replace(call, `{ ${props.join(', ')} }`);
	}
	return `${hoisted.join('\n')}\n${src}`;
}

async function buildFramework() {
	const entry = `
import { flushSync, mount } from 'svelte';
import DemoShell from '../../src/demo/framework/DemoShell.svelte';
import DemoSection from '../../src/demo/framework/DemoSection.svelte';
import DemoIndex from '../../src/demo/framework/DemoIndex.svelte';
import { entries, loadSection, loadedSection } from '../../src/demo/framework/registry';
globalThis.__fixture = { mount, flushSync, DemoShell, DemoSection, DemoIndex, entries, loadSection, loadedSection };
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
					build.onLoad({ filter: /framework[\\/]registry\.ts$/ }, async (args) => ({
						contents: await expandGlobs(await readFile(args.path, 'utf8')),
						resolveDir: dirname(args.path),
						loader: 'ts'
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
	d.window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
	d.window.eval(bundle);
	return d;
}

const settle = () => new Promise((r) => setTimeout(r, 0));

test('the registry keeps meta eager and imports a section only on demand', async () => {
	const src = await readFile(join(DEMO, 'framework/registry.ts'), 'utf8');
	const globs = [...src.matchAll(/import\.meta\.glob<[^>]*>\(\s*'([^']+)'\s*(?:,\s*(\{[\s\S]*?\}))?\s*\)/g)];
	assert.deepEqual(
		globs.map(([, pattern, opts = '']) => [pattern, /eager:\s*true/.test(opts)]),
		[['../*/*/meta.ts', true], ['../*/*/*.svelte', false], ['../*/*/*.svelte', false]]
	);
	assert.doesNotMatch(src, /^import [^t].*from '\.\/props'/m, 'props JSON stays out of the page chunk');
	assert.doesNotMatch(await readFile(join(DEMO, 'framework/PropsTable.svelte'), 'utf8'), /^\s*import \{[^}]*\} from '\.\/props'/m);

	const d = dom();
	const w = /** @type {any} */ (d.window);
	const { entries, loadSection, loadedSection } = w.__fixture;
	const plain = (/** @type {unknown} */ v) => JSON.parse(JSON.stringify(v));
	assert.deepEqual(plain(entries.map((/** @type {any} */ e) => [e.id, e.count])), [['button', dirs.find((x) => x.name === 'Button')?.files.filter((f) => f.endsWith('.svelte')).length], ['scrim', 0], ['app-shell', 0]]);
	assert.equal(w.__imported, undefined, 'no example imported at startup');
	assert.equal(loadedSection(entries[0]), undefined);
	const load = loadSection(entries[0]);
	assert.equal(loadSection(entries[0]), load, 'one load per section');
	const content = await load;
	assert.equal(loadedSection(entries[0]), content);
	assert.ok(w.__imported.length > 0 && w.__imported.every((/** @type {string} */ p) => p.startsWith('../atoms/Button/')));
	assert.equal(w.__imported.length, content.examples.length * 2, 'component and raw source per example');
	const files = plain(content.examples.map((/** @type {any} */ e) => e.file));
	assert.deepEqual(files, [...files].sort((/** @type {string} */ a, /** @type {string} */ b) => exampleOrder(a) - exampleOrder(b)));
	assert.equal(content.examples[0].id, `button--${exampleSlug(content.examples[0].file)}`);
	assert.ok(content.props?.some((/** @type {any} */ p) => p.name === 'variant'));
	assert.equal((await loadSection(entries[1])).examples.length, 0);
});

test('DemoSection renders the Button examples with anchors, previews and verbatim snippets', async () => {
	const d = dom();
	const { mount, flushSync, DemoSection, entries, loadSection } = d.window.__fixture;
	const content = await loadSection(entries[0]);
	const entry = { ...entries[0], examples: content.examples };
	mount(DemoSection, { target: d.window.document.body, props: { entry: entries[0], content } });
	await settle();
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

	const props = section.querySelector('.props-table');
	assert.ok(props, 'props table after the examples');
	assert.equal(props.previousElementSibling, cards.at(-1));
	assert.equal(props.querySelector('h3')?.textContent?.trim(), 'Props');
	assert.equal(props.getAttribute('aria-labelledby'), 'button--props');
	const names = [...props.querySelectorAll('tbody tr')].map((tr) => tr.querySelector('td code')?.textContent);
	assert.deepEqual(names.slice(0, 3), ['variant', 'tone', 'size']);
	assert.ok(names.includes('children'));
	assert.ok(!names.includes('disabled'));
});

test('a section without examples renders no migration notice or legacy link', async () => {
	const d = dom();
	const { mount, flushSync, DemoSection, entries, loadSection } = d.window.__fixture;
	mount(DemoSection, { target: d.window.document.body, props: { entry: entries[1], content: await loadSection(entries[1]) } });
	await settle();
	flushSync();
	const doc = d.window.document;
	assert.ok(doc.getElementById('scrim'));
	assert.equal(doc.querySelector('[data-tsu="Callout"]'), null);
	assert.equal(doc.querySelector('a[href*="legacy"]'), null);
	assert.equal(doc.querySelectorAll('.example').length, 0);
});

test('DemoShell: AppShell nav links each component page, filter narrows nav and index, toolbar keeps theme controls', async () => {
	const d = dom();
	const { mount, flushSync, DemoShell, DemoIndex } = d.window.__fixture;
	const doc = d.window.document;
	mount(DemoShell, { target: doc.body, props: { active: 'scrim' } });
	const index = doc.createElement('div');
	doc.body.append(index);
	mount(DemoIndex, { target: index });
	await settle();
	flushSync();

	assert.ok(doc.querySelector('[data-tsu="AppShell"]'));
	const nav = doc.querySelector('[data-demo-nav]');
	assert.ok(nav, 'sidebar nav');
	const sections = [...nav.querySelectorAll('[data-tsu="NavSection"]')];
	assert.ok(sections.length >= 2, 'NavSection per family');
	const links = (/** @type {Element} */ root) => [...root.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
	assert.deepEqual(links(nav), ['/atoms/button', '/atoms/scrim', '/layouts/app-shell']);
	assert.equal(nav.querySelector('[aria-current="page"]')?.getAttribute('href'), '/atoms/scrim');
	assert.equal(nav.querySelector('a[href="/atoms/button"] [data-tsu="Badge"]')?.textContent?.trim(), String(dirs.find((x) => x.name === 'Button')?.files.filter((f) => f.endsWith('.svelte')).length));

	const toolbar = doc.querySelector('[data-tsu="AppShell"] > header .demo-toolbar');
	assert.ok(toolbar, 'toolbar in the header');
	assert.ok(toolbar.querySelector('[data-tsu="ThemePicker"]'), 'theme picker');
	assert.ok(toolbar.querySelector('[data-tsu="FontScalePicker"]'), 'font scale picker');
	assert.equal(toolbar.querySelector('a[href*="legacy"]'), null);
	assert.ok(toolbar.querySelector('a[href="/shell"]'));
	assert.ok(toolbar.querySelector('a[href="https://github.com/DorskFR/tsumikit"]'));
	assert.match(toolbar.textContent, /v\d+\.\d+\.\d+/);

	const grid = /** @type {Element} */ (doc.querySelector('[data-demo-index]'));
	assert.deepEqual(links(grid), ['/atoms/button', '/atoms/scrim', '/layouts/app-shell']);
	assert.equal(doc.querySelectorAll('[data-demo-section]').length, 0, 'the index mounts no section');
	const filter = /** @type {HTMLInputElement} */ (nav.querySelector('input'));
	filter.value = 'scr';
	filter.dispatchEvent(new d.window.Event('input', { bubbles: true }));
	flushSync();
	assert.deepEqual(links(nav), ['/atoms/scrim']);
	assert.deepEqual(links(grid), ['/atoms/scrim']);
	filter.value = 'zzz';
	filter.dispatchEvent(new d.window.Event('input', { bubbles: true }));
	flushSync();
	assert.match(nav.textContent, /No component matches/);
	assert.match(grid.textContent, /No component matches/);
});
