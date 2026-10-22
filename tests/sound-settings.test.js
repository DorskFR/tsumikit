import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { JSDOM } from 'jsdom';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (/** @type {string} */ p) => readFile(new URL(p, import.meta.url), 'utf8');

const STUB_SYNTH = {
	name: 'stub-synth',
	setup(/** @type {import('esbuild').PluginBuild} */ b) {
		b.onResolve({ filter: /sound-synth$/ }, () => ({ path: 'stub-synth', namespace: 'stub' }));
		b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
			contents: `globalThis.__synth.loads++;
export function play(name, volume) { globalThis.__synth.played.push([name, volume]); }
export function unlock() { globalThis.__synth.unlocks++; }`,
			loader: 'js'
		}));
	}
};

const bundle = (
	await esbuild.build({
		stdin: {
			contents: `import { flushSync, mount } from 'svelte';
import SoundSettings from '../src/lib/components/molecules/SoundSettings.svelte';
import { sound } from '../src/lib/stores/sound.svelte.ts';
globalThis.__fixture = { mount, flushSync, SoundSettings, sound };`,
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
		plugins: [STUB_SYNTH, sveltePlugin({ compilerOptions: { css: 'injected' } })]
	})
).outputFiles[0].text;

/** @param {{ seed?: string, reduce?: boolean, props?: Record<string, unknown> }} [opts] */
function render({ seed, reduce = false, props = {} } = {}) {
	const dom = new JSDOM('<!doctype html><body></body>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true,
		url: 'http://localhost/'
	});
	const win = dom.window;
	if (seed) win.localStorage.setItem('tsumikit-sound', seed);
	const frames = /** @type {Function[]} */ ([]);
	win.requestAnimationFrame = (/** @type {Function} */ cb) => frames.push(cb);
	win.matchMedia = /** @type {any} */ ((/** @type {string} */ q) => ({
		matches: reduce && q.includes('reduced-motion'),
		media: q,
		addEventListener() {},
		removeEventListener() {}
	}));
	Object.defineProperty(win.navigator, 'userActivation', { configurable: true, value: { hasBeenActive: true } });
	win.AudioContext = class {};
	win.__synth = { loads: 0, unlocks: 0, played: /** @type {[string, number][]} */ ([]) };
	win.eval(bundle);
	const { mount, flushSync, SoundSettings, sound } = win.__fixture;
	mount(SoundSettings, { target: win.document.body, props });
	flushSync();
	const doc = win.document;
	const panel = /** @type {HTMLElement} */ (doc.querySelector('[popover]'));
	panel.dispatchEvent(Object.assign(new win.Event('toggle'), { newState: 'open' }));
	flushSync();
	win.__synth.played.length = 0;
	const q = (/** @type {string} */ sel) => /** @type {HTMLElement} */ (doc.querySelector(sel));
	const tick = async () => {
		for (const f of frames.splice(0)) f();
		await new Promise((r) => setImmediate(r));
		flushSync();
	};
	return {
		win,
		doc,
		q,
		sound,
		synth: win.__synth,
		played: () => JSON.parse(JSON.stringify(win.__synth.played)),
		flush: flushSync,
		tick,
		trigger: () => q('button[aria-label="Sound"]'),
		sw: () => q('[role="switch"]'),
		slider: () => /** @type {HTMLInputElement} */ (q('input[type="range"]')),
		preview: () => /** @type {HTMLButtonElement} */ ([...doc.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Preview')),
		hint: () => q('.hint')
	};
}

test('off by default: trigger has an accessible name, switch off, slider disabled, hint says off, nothing loads', () => {
	const r = render();
	assert.ok(r.trigger(), 'trigger with aria-label="Sound"');
	assert.equal(r.sw().getAttribute('aria-checked'), 'false');
	assert.equal(r.sw().getAttribute('aria-label'), null);
	assert.match(r.sw().parentElement?.textContent ?? '', /Sound effects/);
	assert.equal(r.slider().disabled, true);
	assert.equal(r.preview().disabled, true);
	assert.match(r.hint().textContent ?? '', /Off/);
	assert.equal(r.synth.loads, 0);
	assert.ok(r.q('[data-tsu="SoundSettings"]')?.innerHTML.includes('m2 2 20 20'), 'volume-off glyph while off');
});

test('the switch drives sound.setEnabled: persists, enables the slider and preview, loads the synth once', async () => {
	const r = render();
	r.sw().click();
	r.flush();
	assert.equal(r.sound.enabled, true);
	assert.equal(r.sw().getAttribute('aria-checked'), 'true');
	assert.equal(r.slider().disabled, false);
	assert.equal(r.preview().disabled, false);
	assert.equal(r.hint(), null);
	assert.equal(r.win.localStorage.getItem('tsumikit-sound'), '{"enabled":true,"volume":0.5}');
	await r.tick();
	assert.equal(r.synth.loads, 1);
	assert.deepEqual(r.played(), [['toggle-on', 0.5]]);
	r.sw().click();
	r.flush();
	await r.tick();
	assert.equal(r.sound.enabled, false);
	assert.equal(r.slider().disabled, true);
	assert.deepEqual(r.played(), [['toggle-on', 0.5]]);
	assert.equal(r.win.localStorage.getItem('tsumikit-sound'), '{"enabled":false,"volume":0.5}');
});

test('the slider drives sound.setVolume and the value label; the preview plays success', async () => {
	const r = render({ seed: '{"enabled":true,"volume":0.5}' });
	assert.equal(r.sw().getAttribute('aria-checked'), 'true');
	assert.equal(r.slider().value, '0.5');
	assert.equal(r.slider().getAttribute('aria-valuetext'), '50%');
	r.slider().value = '0.2';
	r.slider().dispatchEvent(new r.win.Event('input', { bubbles: true }));
	r.flush();
	assert.equal(r.sound.volume, 0.2);
	assert.equal(r.slider().getAttribute('aria-valuetext'), '20%');
	assert.equal(r.win.localStorage.getItem('tsumikit-sound'), '{"enabled":true,"volume":0.2}');
	assert.match(r.q('.value').textContent ?? '', /20%/);
	r.preview().click();
	await r.tick();
	assert.deepEqual(r.played(), [['success', 0.2]]);
});

test('reduced motion shows its hint while on; sizes map to the panel density', () => {
	const r = render({ seed: '{"enabled":true,"volume":0.5}', reduce: true });
	assert.equal(r.sound.muted, 'reduced-motion');
	assert.match(r.hint().textContent ?? '', /reduced motion/);
	const sm = render({ props: { size: 'sm' } });
	assert.ok(sm.q('.panel.panel-sm'));
	assert.ok(sm.q('.switch.switch-sm'));
	assert.ok(!r.q('.panel-sm'));
});

test('SoundSettings is exported and demoed, with prop surface', async () => {
	const index = await read('../src/lib/index.ts');
	assert.match(index, /export { default as SoundSettings } from '\.\/components\/molecules\/SoundSettings\.svelte';/);
	const meta = await read('../src/demo/molecules/SoundSettings/meta.ts');
	assert.match(meta, /export const meta/);
	const source = await read('../src/lib/components/molecules/SoundSettings.svelte');
	assert.match(source, /size\?: 'sm' \| 'md';/);
	assert.match(source, /class\?: string;/);
	assert.match(source, /style\?: string;/);
	assert.match(source, /bind:checked={\(\) => sound\.enabled, \(on\) => sound\.setEnabled\(on\)}/);
	assert.match(source, /sound\.setVolume\(/);
	assert.match(source, /sound\.play\('success'\)/);
	assert.doesNotMatch(source, /sound-synth|AudioContext/);
});
