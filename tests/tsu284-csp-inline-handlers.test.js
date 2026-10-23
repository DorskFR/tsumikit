import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';
import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { JSDOM } from 'jsdom';
import { hasDecl } from './helpers.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const ARTWORK = join(ROOT, 'src/lib/components/atoms/Artwork.svelte');
const AVATAR = join(ROOT, 'src/lib/components/atoms/Avatar.svelte');
const INLINE_HANDLER = /<[^>]*\son[a-z]+=/i;

async function demoExamples() {
	const out = [];
	for (const family of ['atoms', 'molecules', 'organisms', 'layouts', 'foundations']) {
		const base = join(ROOT, 'src/demo', family);
		let names = [];
		try {
			names = await readdir(base);
		} catch {
			continue;
		}
		for (const name of names.sort()) {
			const files = (await readdir(join(base, name))).filter((f) => f.endsWith('.svelte')).sort();
			for (const file of files) out.push({ id: `${family}/${name}/${file}`, path: join(base, name, file) });
		}
	}
	return out;
}

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
		alias: { $lib: join(ROOT, 'src/lib'), '@dorsk/tsumikit': join(ROOT, 'src/lib') },
		plugins: [sveltePlugin({ compilerOptions: { css: 'injected', generate } })]
	});
	return out.outputFiles[0].text;
}

const examples = await demoExamples();
const ssrCode = await bundle(
	'server',
	`import { render } from 'svelte/server';
import Artwork from ${JSON.stringify(ARTWORK)};
import Avatar from ${JSON.stringify(AVATAR)};
${examples.map((ex, i) => `import Ex${i} from ${JSON.stringify(ex.path)};`).join('\n')}
globalThis.__ssr = { render, Artwork, Avatar, examples: [${examples.map((ex, i) => `{ id: ${JSON.stringify(ex.id)}, component: Ex${i} }`).join(',')}] };`
);
const ssr = (() => {
	const ctx = vm.createContext({ console, File, Blob, URL, TextEncoder, TextDecoder, setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask, Promise, globalThis: {} });
	ctx.globalThis = ctx;
	vm.runInContext(ssrCode, ctx);
	return ctx.__ssr;
})();

test('Artwork and Avatar server-render without inline on* event-handler attributes', () => {
	const artwork = ssr.render(ssr.Artwork, { props: { src: '/cover.jpg', srcset: '/cover.jpg 1x', alt: 'Cover', onerror: () => {} } }).body;
	assert.match(artwork, /<img [^>]*src="\/cover.jpg"/);
	assert.doesNotMatch(artwork, INLINE_HANDLER, artwork);
	const avatar = ssr.render(ssr.Avatar, { props: { name: 'Dorsk' } }).body;
	assert.doesNotMatch(avatar, INLINE_HANDLER, avatar);
});

test('no demo example server-renders an inline on* event-handler attribute', () => {
	const offenders = [];
	for (const ex of ssr.examples) {
		const { body } = ssr.render(ex.component);
		const m = body.match(INLINE_HANDLER);
		if (m) offenders.push(`${ex.id}: ${m[0].slice(-120)}`);
	}
	assert.deepEqual(offenders, []);
});

const csrCode = await bundle(
	'client',
	`import { mount, hydrate, unmount, flushSync } from 'svelte';
import Artwork from ${JSON.stringify(ARTWORK)};
globalThis.__csr = { mount, hydrate, unmount, flushSync, Artwork };`
);

/** @param {{ broken?: boolean }} [opts] */
function browser({ broken = false } = {}) {
	const d = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
	if (broken) {
		Object.defineProperty(d.window.HTMLImageElement.prototype, 'complete', { configurable: true, get: () => true });
		Object.defineProperty(d.window.HTMLImageElement.prototype, 'naturalWidth', { configurable: true, get: () => 0 });
	}
	d.window.eval(csrCode);
	return { window: d.window, ...d.window.__csr };
}

test('Artwork swaps to the fallback when the image fires error, and calls onerror once', () => {
	const { window, mount, unmount, flushSync, Artwork } = browser();
	const target = window.document.createElement('div');
	window.document.body.append(target);
	let calls = 0;
	const app = mount(Artwork, { target, props: { src: '/missing.jpg', alt: 'Kusaritoi Radio', onerror: () => calls++ } });
	flushSync();
	const img = target.querySelector('img');
	assert.ok(img);
	assert.equal(img.getAttribute('onerror'), null);
	img.dispatchEvent(new window.Event('error'));
	flushSync();
	assert.equal(target.querySelector('img'), null);
	assert.equal(target.querySelector('.initials')?.textContent, 'KR');
	assert.equal(calls, 1);
	unmount(app);
});

test('Artwork falls back when the image already failed before mount', () => {
	const { window, mount, unmount, flushSync, Artwork } = browser({ broken: true });
	const target = window.document.createElement('div');
	window.document.body.append(target);
	let calls = 0;
	const app = mount(Artwork, { target, props: { src: '/missing.jpg', alt: 'Kusaritoi Radio', onerror: () => calls++ } });
	flushSync();
	assert.equal(target.querySelector('img'), null);
	assert.equal(target.querySelector('.initials')?.textContent, 'KR');
	assert.equal(calls, 1);
	unmount(app);
});

test('Artwork falls back when the server-rendered image failed before hydration', () => {
	const props = { src: '/missing.jpg', alt: 'Kusaritoi Radio' };
	const { body } = ssr.render(ssr.Artwork, { props });
	const { window, hydrate, unmount, flushSync, Artwork } = browser({ broken: true });
	const target = window.document.createElement('div');
	target.innerHTML = body;
	window.document.body.append(target);
	assert.ok(target.querySelector('img'));
	const app = hydrate(Artwork, { target, props });
	flushSync();
	assert.equal(target.querySelector('img'), null);
	assert.equal(target.querySelector('.initials')?.textContent, 'KR');
	unmount(app);
});

test('Artwork keeps a healthy image after mount', () => {
	const { window, mount, unmount, flushSync, Artwork } = browser();
	const target = window.document.createElement('div');
	window.document.body.append(target);
	const app = mount(Artwork, { target, props: { src: '/cover.jpg', alt: 'Cover' } });
	flushSync();
	assert.ok(target.querySelector('img'));
	unmount(app);
});

test('SectionHeader collapse toggle inherits font, text-transform and letter-spacing from the heading', async () => {
	const src = await readFile(join(ROOT, 'src/lib/components/molecules/SectionHeader.svelte'), 'utf8');
	const css = src.slice(src.indexOf('<style>'));
	assert.ok(hasDecl(css, '.sh-toggle', 'font', 'inherit'));
	assert.ok(hasDecl(css, '.sh-toggle', 'text-transform', 'inherit'));
	assert.ok(hasDecl(css, '.sh-toggle', 'letter-spacing', 'inherit'));
	assert.ok(hasDecl(css, '.sh-uppercase :global(.sh-title)', 'text-transform', 'uppercase'));
});
