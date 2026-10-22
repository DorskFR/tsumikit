import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';
import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { JSDOM } from 'jsdom';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const DEMO = join(ROOT, 'src/demo');
const COMPONENTS = [
	'Tabs', 'Breadcrumb', 'Pagination', 'Carousel', 'Accordion', 'Disclosure',
	'SectionHeader', 'KeyValue', 'LoadMore', 'Metric', 'Meter', 'CapBar'
];

const index = (await readFile(join(ROOT, 'src/lib/index.ts'), 'utf8')).replace(/\/\/.*$/gm, '');
const exportedNames = new Set(
	[...index.matchAll(/export\s*\{([^}]+)\}|export (?:const|function|type|class) (\w+)/g)]
		.flatMap((m) => (m[1] ? m[1].split(',').map((s) => s.trim().replace(/^type\s+/, '').replace(/^default as\s+/, '')) : [m[2]]))
		.filter(Boolean)
);

/** @returns {Promise<{ name: string, file: string, path: string }[]>} */
async function examples() {
	const out = [];
	for (const name of COMPONENTS) {
		const dir = join(DEMO, 'molecules', name);
		const files = (await readdir(dir)).filter((f) => f.endsWith('.svelte')).sort();
		assert.ok(files.length >= 3, `${name}: ${files.length} examples, need 3`);
		assert.ok((await readdir(dir)).includes('meta.ts'), `${name}: meta.ts`);
		for (const file of files) out.push({ name, file, path: join(dir, file) });
	}
	return out;
}
const all = await examples();

test('every example imports only names the library exports, from @dorsk/tsumikit or its own directory', async () => {
	for (const ex of all) {
		const src = await readFile(ex.path, 'utf8');
		for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s*'([^']+)'/g)) {
			const from = m[2];
			assert.ok(from === '@dorsk/tsumikit' || from.startsWith('./') || from === '../../fixtures', `${ex.name}/${ex.file}: import from ${from}`);
			if (from !== '@dorsk/tsumikit') continue;
			for (const raw of m[1].split(',')) {
				const n = raw.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0];
				if (n) assert.ok(exportedNames.has(n), `${ex.name}/${ex.file}: '${n}' is not exported by src/lib/index.ts`);
			}
		}
		assert.doesNotMatch(src, /^\s*\/\/|\/\*/m, `${ex.name}/${ex.file}: no comments`);
	}
});

/** @param {'server' | 'client'} generate */
async function bundle(generate) {
	const imports = all.map((ex, i) => `import Ex${i} from ${JSON.stringify(ex.path)};`).join('\n');
	const list = all.map((ex, i) => `{ id: ${JSON.stringify(`${ex.name}/${ex.file}`)}, component: Ex${i} }`).join(',');
	const entry =
		generate === 'server'
			? `import { render } from 'svelte/server';\n${imports}\nglobalThis.__ssr = { render, examples: [${list}] };`
			: `import { mount, unmount, flushSync } from 'svelte';\n${imports}\nglobalThis.__csr = { mount, unmount, flushSync, examples: [${list}] };`;
	const out = await esbuild.build({
		stdin: { contents: entry, resolveDir: ROOT, loader: 'js' },
		bundle: true,
		write: false,
		format: 'iife',
		platform: generate === 'server' ? 'node' : 'browser',
		conditions: generate === 'server' ? ['svelte', 'node', 'import'] : ['svelte', 'browser', 'import'],
		define: { 'import.meta.env.DEV': 'false' },
		alias: { $lib: join(ROOT, 'src/lib'), '@dorsk/tsumikit': join(ROOT, 'src/lib') },
		plugins: [sveltePlugin({ compilerOptions: { css: 'injected', generate } })]
	});
	return out.outputFiles[0].text;
}

test('every example prerenders on the server without touching window or document', async () => {
	const code = await bundle('server');
	const ctx = vm.createContext({ console, setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask, Promise, globalThis: {} });
	ctx.globalThis = ctx;
	vm.runInContext(code, ctx);
	assert.equal(typeof ctx.window, 'undefined');
	for (const ex of ctx.__ssr.examples) {
		const { body } = ctx.__ssr.render(ex.component);
		assert.ok(body.length > 20, `${ex.id}: empty server output`);
	}
});

test('every example mounts, flushes and unmounts in a browser DOM without errors', async () => {
	const code = await bundle('client');
	const d = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
	d.window.matchMedia = /** @type {any} */ (() => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
	d.window.Element.prototype.scrollIntoView = () => {};
	d.window.Element.prototype.setPointerCapture = () => {};
	d.window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
	/** @type {unknown[]} */
	const errors = [];
	d.window.addEventListener('error', (e) => errors.push(e.error ?? e.message));
	d.window.eval(code);
	const { mount, unmount, flushSync, examples } = d.window.__csr;
	for (const ex of examples) {
		const target = d.window.document.createElement('div');
		d.window.document.body.append(target);
		const app = mount(ex.component, { target });
		flushSync();
		await new Promise((r) => setTimeout(r, 0));
		assert.ok(target.innerHTML.length > 20, `${ex.id}: empty client output`);
		unmount(app);
		target.remove();
	}
	assert.deepEqual(errors, []);
});
