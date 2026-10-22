import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';
import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { JSDOM } from 'jsdom';
import { compile } from 'svelte/compiler';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const SECTION = join(ROOT, 'src/demo/framework/DemoSection.svelte');
const LAZY = join(ROOT, 'src/demo/framework/lazy.ts');
const COUNTER = `<script>let n = $state(0);</script><button class="counter" onclick={() => n++}>n={n}</button>`;
const IDS = ['button', 'toaster', 'rich-select'];

/** @param {'server' | 'client'} generate */
async function bundle(generate) {
	const entries = `[${IDS.map(
		(id) =>
			`{ id: '${id}', name: '${id}', family: 'atoms', meta: { description: 'd' }, examples: [{ id: '${id}--one', slug: 'one', file: '01-One.svelte', meta: { title: 'One' }, component: Counter, source: '<button />' }] }`,
	).join(',')}]`;
	const entry =
		generate === 'server'
			? `import { render } from 'svelte/server'; import DemoSection from ${JSON.stringify(SECTION)}; import Counter from 'virtual:counter'; globalThis.__ssr = { render, DemoSection, entries: ${entries} };`
			: `import { hydrate, flushSync } from 'svelte'; import DemoSection from ${JSON.stringify(SECTION)}; import { wake } from ${JSON.stringify(LAZY)}; import Counter from 'virtual:counter'; globalThis.__csr = { hydrate, flushSync, wake, DemoSection, entries: ${entries} };`;
	/** @type {esbuild.Plugin} */
	const virtual = {
		name: 'virtual',
		setup(b) {
			b.onResolve({ filter: /^virtual:counter$/ }, () => ({ path: 'counter', namespace: 'v' }));
			b.onResolve({ filter: /^\.\/registry$/ }, () => ({ path: 'registry', namespace: 'v' }));
			b.onLoad({ filter: /^counter$/, namespace: 'v' }, () => ({
				contents: compile(COUNTER, { generate, filename: 'Counter.svelte' }).js.code,
				loader: 'js',
				resolveDir: ROOT,
			}));
			b.onLoad({ filter: /^registry$/, namespace: 'v' }, () => ({
				contents: 'export const resolveRef = (r) => r;',
				loader: 'js',
			}));
		},
	};
	const out = await esbuild.build({
		stdin: { contents: entry, resolveDir: ROOT, loader: 'js' },
		bundle: true,
		write: false,
		format: 'iife',
		platform: generate === 'server' ? 'node' : 'browser',
		conditions: generate === 'server' ? ['svelte', 'node', 'import'] : ['svelte', 'browser', 'import'],
		define: { 'import.meta.env.DEV': 'false' },
		alias: { $lib: join(ROOT, 'src/lib'), '@dorsk/tsumikit': join(ROOT, 'src/lib') },
		plugins: [virtual, sveltePlugin({ compilerOptions: { css: 'injected', generate } })],
	});
	return out.outputFiles[0].text;
}

const [serverCode, clientCode] = await Promise.all([bundle('server'), bundle('client')]);

function ssr() {
	const ctx = vm.createContext({ console, URL, TextEncoder, TextDecoder, setTimeout, clearTimeout, queueMicrotask, Promise });
	ctx.globalThis = ctx;
	vm.runInContext(serverCode, ctx);
	const { render, DemoSection, entries } = ctx.__ssr;
	return entries.map((/** @type {any} */ entry) => render(DemoSection, { props: { entry } }).body);
}

/** @param {string} hash */
function boot(hash) {
	const html = ssr();
	const d = new JSDOM(
		`<!doctype html><html><body>${html.map((h, i) => `<div id="t${i}">${h}</div>`).join('')}</body></html>`,
		{ runScripts: 'outside-only', pretendToBeVisual: true, url: `http://localhost/${hash}` },
	);
	const w = /** @type {any} */ (d.window);
	w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
	w.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
	/** @type {{ cb: (r: any[]) => void, els: Set<Element> }[]} */
	const ios = [];
	w.IntersectionObserver = class {
		/** @param {(r: any[]) => void} cb */
		constructor(cb) {
			this.io = { cb, els: new Set() };
			ios.push(this.io);
		}
		/** @param {Element} el */
		observe(el) {
			this.io.els.add(el);
		}
		/** @param {Element} el */
		unobserve(el) {
			this.io.els.delete(el);
		}
		disconnect() {}
	};
	/** @type {(() => void)[]} */
	const idle = [];
	w.requestIdleCallback = (/** @type {(d: any) => void} */ fn) => idle.push(() => fn({ timeRemaining: () => 0 }));
	/** @type {string[]} */
	const warnings = [];
	w.console = { ...console, warn: (/** @type {unknown[]} */ ...a) => warnings.push(a.join(' ')) };
	const before = IDS.map((id) => w.document.querySelector(`#${id} .counter`));
	w.eval(clientCode);
	const { hydrate, flushSync, wake, DemoSection, entries } = w.__csr;
	entries.forEach((/** @type {any} */ entry, /** @type {number} */ i) =>
		hydrate(DemoSection, { target: w.document.getElementById(`t${i}`), props: { entry } }),
	);
	flushSync();
	const section = (/** @type {string} */ id) => w.document.getElementById(id);
	return {
		w,
		flushSync,
		wake,
		before,
		warnings,
		section,
		live: (/** @type {string} */ id) => section(id).hasAttribute('data-demo-live'),
		click(/** @type {string} */ id) {
			section(id).querySelector('.counter').click();
			flushSync();
			return section(id).querySelector('.counter').textContent;
		},
		/** @param {string} id @param {number} top */
		approach(id, top) {
			const el = section(id);
			for (const io of ios) if (io.els.has(el)) io.cb([{ target: el, isIntersecting: true, boundingClientRect: { top, bottom: top + 100 } }]);
			flushSync();
		},
		runIdle() {
			const n = idle.length;
			idle.splice(0).forEach((fn) => fn());
			flushSync();
			return n;
		},
	};
}

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

test('the server output keeps every example of every section', () => {
	for (const [i, body] of ssr().entries()) {
		assert.match(body, new RegExp(`id="${IDS[i]}--one"`));
		assert.match(body, /<button class="counter[^"]*">n=0<\/button>/);
		assert.doesNotMatch(body, /data-demo-live/);
	}
});

test('hydration adopts the prerendered DOM of dormant sections and makes the deep-linked one live', () => {
	const t = boot('#rich-select--one');
	assert.equal(t.live('rich-select'), true);
	assert.equal(t.click('rich-select'), 'n=1');
	for (const [i, id] of ['button', 'toaster'].entries()) {
		assert.equal(t.live(id), false);
		assert.equal(t.section(id).querySelector('.counter'), t.before[i], `${id}: server node kept`);
		assert.equal(t.click(id), 'n=0', `${id}: inert while dormant`);
	}
	assert.deepEqual(t.warnings, []);
});

test('a section on screen mounts at once, one within the margin at the next idle slot', () => {
	const t = boot('');
	assert.equal(IDS.some(t.live), false);
	t.approach('button', 10);
	assert.equal(t.live('button'), true);
	assert.equal(t.click('button'), 'n=1');
	t.approach('toaster', 3000);
	assert.equal(t.live('toaster'), false);
	assert.ok(t.runIdle() > 0);
	assert.equal(t.live('toaster'), true);
	assert.equal(t.live('rich-select'), false, 'the background trickle waits for load');
});

test('after load the remaining sections mount one idle slot at a time', async () => {
	const t = boot('');
	await tick(400);
	t.runIdle();
	assert.equal(IDS.filter(t.live).length, 1);
	t.runIdle();
	t.runIdle();
	assert.equal(IDS.every(t.live), true);
	assert.equal(t.click('toaster'), 'n=1');
	assert.equal(t.runIdle(), 1, 'the loop stops once the queue is empty');
	assert.equal(t.runIdle(), 0);
});

test('navigation mounts its target section at once', () => {
	const t = boot('');
	t.wake('toaster');
	assert.equal(t.live('toaster'), true);
	assert.equal(t.live('button'), false);
	assert.equal(t.click('toaster'), 'n=1');
});

test('a dormant section above the viewport mounts without moving what is on screen', () => {
	const t = boot('');
	let y = 0;
	const tops = { button: -2000, toaster: 40, 'rich-select': 900 };
	for (const [id, top] of Object.entries(tops))
		t.section(id).getBoundingClientRect = () => ({ top: top - y, bottom: top - y + 600 });
	t.w.scrollBy = (/** @type {{ top: number }} */ o) => {
		y += o.top;
	};
	const toaster = t.section('toaster');
	toaster.getBoundingClientRect = () => {
		const top = tops.toaster - y + (t.live('button') ? 300 : 0);
		return { top, bottom: top + 600 };
	};
	t.wake('button');
	assert.equal(t.live('button'), true);
	assert.equal(toaster.getBoundingClientRect().top, 40);
});

test('focusing into a dormant section mounts it and keeps focus on the live control', () => {
	const t = boot('');
	t.section('toaster').querySelector('.counter').focus();
	t.flushSync();
	assert.equal(t.live('toaster'), true);
	const live = t.section('toaster').querySelector('.counter');
	assert.notEqual(live, t.before[1]);
	assert.equal(t.w.document.activeElement, live);
	assert.equal(t.click('toaster'), 'n=1');
});

test('sectionOf maps example anchors and former anchors to their section', async () => {
	const { sectionOf } = await import('../src/demo/framework/hash.ts');
	assert.equal(sectionOf('#rich-select--states'), 'rich-select');
	assert.equal(sectionOf('#toasts'), 'toaster');
	assert.equal(sectionOf('button'), 'button');
	assert.equal(sectionOf(''), '');
});
