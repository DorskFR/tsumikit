import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { JSDOM } from 'jsdom';

const HERE = dirname(fileURLToPath(import.meta.url));
const LIB = join(HERE, '../src/lib');
const read = (/** @type {string} */ p) => readFile(new URL(p, import.meta.url), 'utf8');

/** @param {string} dir @returns {Promise<string[]>} */
async function walk(dir) {
	const out = [];
	for (const e of await readdir(dir, { withFileTypes: true })) {
		const p = join(dir, e.name);
		if (e.isDirectory()) out.push(...(await walk(p)));
		else if (/\.(ts|js|svelte)$/.test(e.name)) out.push(p);
	}
	return out;
}

/** @param {string} contents @param {import('esbuild').Plugin[]} plugins */
async function build(contents, plugins = []) {
	const out = await esbuild.build({
		stdin: { contents, resolveDir: HERE, loader: 'js' },
		bundle: true,
		write: false,
		format: 'iife',
		platform: 'browser',
		conditions: ['svelte', 'browser', 'import'],
		define: { 'import.meta.env.DEV': 'false' },
		alias: { $lib: LIB },
		plugins: [...plugins, sveltePlugin({ compilerOptions: { css: 'injected' } })]
	});
	return out.outputFiles[0].text;
}

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

const [storeBundle, synthBundle] = await Promise.all([
	build(`import { sound, playSound } from '../src/lib/stores/sound.svelte.ts';
globalThis.__fixture = { sound, playSound };`, [STUB_SYNTH]),
	build(`import * as synth from '../src/lib/sound-synth.ts'; globalThis.__fixture = synth;`)
]);

/** @param {{ blocked?: boolean, seed?: Record<string, string>, active?: boolean }} [opts] */
function env({ blocked = false, seed = {}, active } = {}) {
	const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
	const win = dom.window;
	if (blocked) {
		Object.defineProperty(win, 'localStorage', {
			configurable: true,
			get() {
				throw new win.DOMException('The operation is insecure.', 'SecurityError');
			}
		});
	} else {
		for (const [k, v] of Object.entries(seed)) win.localStorage.setItem(k, v);
	}
	const state = { clock: 1000, reduce: false, hidden: false, frames: /** @type {Function[]} */ ([]), listeners: /** @type {string[]} */ ([]), audioContexts: 0 };
	win.performance.now = () => state.clock;
	win.requestAnimationFrame = (/** @type {Function} */ cb) => state.frames.push(cb);
	win.matchMedia = /** @type {any} */ ((/** @type {string} */ q) => ({ matches: state.reduce && q.includes('reduced-motion'), media: q }));
	Object.defineProperty(win.document, 'hidden', { configurable: true, get: () => state.hidden });
	if (active !== undefined) Object.defineProperty(win.navigator, 'userActivation', { configurable: true, value: { hasBeenActive: active } });
	const add = win.addEventListener.bind(win);
	const remove = win.removeEventListener.bind(win);
	win.addEventListener = (/** @type {string} */ type, /** @type {any} */ fn, /** @type {any} */ o) => {
		state.listeners.push(type);
		add(type, fn, o);
	};
	win.removeEventListener = (/** @type {string} */ type, /** @type {any} */ fn, /** @type {any} */ o) => {
		state.listeners.splice(state.listeners.indexOf(type), 1);
		remove(type, fn, o);
	};
	win.AudioContext = class {
		constructor() {
			state.audioContexts++;
		}
	};
	win.__synth = { loads: 0, unlocks: 0, played: /** @type {[string, number][]} */ ([]) };
	win.eval(storeBundle);
	const tick = async (ms = 16) => {
		const frames = state.frames.splice(0);
		for (const f of frames) f();
		state.clock += ms;
		await new Promise((r) => setImmediate(r));
	};
	const played = () => JSON.parse(JSON.stringify(win.__synth.played));
	return { win, doc: win.document, fx: win.__fixture, synth: win.__synth, state, tick, played };
}

test('no static import of the synth; the gate module holds no audio code; sideEffects stays CSS-only', async () => {
	for (const file of await walk(LIB)) {
		const src = await readFile(file, 'utf8');
		assert.doesNotMatch(src, /^\s*import\s[^;]*['"][./]*sound-synth['"]/m, `${file} imports the synth statically`);
		assert.doesNotMatch(src, /^\s*export\s[^;]*from\s*['"][./]*sound-synth['"]/m, `${file} re-exports the synth`);
	}
	const store = await read('../src/lib/stores/sound.svelte.ts');
	assert.match(store, /import\('\.\.\/sound-synth'\)/);
	assert.doesNotMatch(store, /new AudioContext|createOscillator/);
	assert.doesNotMatch(await read('../src/lib/sound.ts'), /AudioContext|import\(/);
	assert.doesNotMatch(store, /localStorage/);
	const pkg = JSON.parse(await read('../package.json'));
	assert.ok(pkg.sideEffects.every((/** @type {string} */ s) => s.endsWith('.css')));
});

test('off by default: nothing loads, no AudioContext, no listener, play is a no-op', async () => {
	const { fx, synth, state, tick } = env({ active: true });
	assert.equal(fx.sound.enabled, false);
	assert.equal(fx.sound.volume, 0.5);
	assert.equal(fx.sound.muted, 'off');
	fx.playSound('click');
	fx.sound.play('success');
	await tick();
	assert.equal(synth.loads, 0);
	assert.equal(synth.played.length, 0);
	assert.equal(state.audioContexts, 0);
	assert.deepEqual(state.listeners, []);
	assert.deepEqual(state.frames, []);
});

test('enabling persists, preloads the synth and arms a one-shot gesture unlock', async () => {
	const { win, fx, synth, state, tick } = env({ active: true });
	fx.sound.setEnabled(true);
	assert.equal(win.localStorage.getItem('tsumikit-sound'), '{"enabled":true,"volume":0.5}');
	assert.deepEqual(state.listeners, ['pointerdown', 'keydown']);
	await tick();
	assert.equal(synth.loads, 1);
	win.document.body.dispatchEvent(new win.Event('pointerdown', { bubbles: true }));
	assert.equal(synth.unlocks, 1);
	assert.deepEqual(state.listeners, []);
	fx.sound.setEnabled(false);
	assert.equal(fx.sound.muted, 'off');
	assert.equal(win.localStorage.getItem('tsumikit-sound'), '{"enabled":false,"volume":0.5}');
	assert.equal(state.audioContexts, 0);
});

test('boot with a persisted setting restores it; bad values fall back', () => {
	const a = env({ seed: { 'tsumikit-sound': '{"enabled":true,"volume":0.25}' } });
	assert.equal(a.fx.sound.enabled, true);
	assert.equal(a.fx.sound.volume, 0.25);
	assert.deepEqual(a.state.listeners, ['pointerdown', 'keydown']);
	const b = env({ seed: { 'tsumikit-sound': '{"enabled":"yes","volume":7}' } });
	assert.equal(b.fx.sound.enabled, false);
	assert.equal(b.fx.sound.volume, 1);
	const c = env({ seed: { 'tsumikit-sound': 'not json' } });
	assert.equal(c.fx.sound.enabled, false);
	assert.equal(c.fx.sound.volume, 0.5);
});

test('blocked storage: defaults load and writes do not throw', () => {
	const { fx } = env({ blocked: true });
	assert.equal(fx.sound.enabled, false);
	assert.doesNotThrow(() => fx.sound.setEnabled(true));
	assert.doesNotThrow(() => fx.sound.setVolume(0.3));
	assert.equal(fx.sound.enabled, true);
	assert.equal(fx.sound.volume, 0.3);
});

test('volume clamps to 0..1 and ignores non-finite values', () => {
	const { win, fx } = env();
	fx.sound.setVolume(2);
	assert.equal(fx.sound.volume, 1);
	fx.sound.setVolume(-1);
	assert.equal(fx.sound.volume, 0);
	fx.sound.setVolume(0.7);
	fx.sound.setVolume(Number.NaN);
	assert.equal(fx.sound.volume, 0.7);
	assert.equal(win.localStorage.getItem('tsumikit-sound'), '{"enabled":false,"volume":0.7}');
});

test('plays through the lazily loaded synth with the current volume', async () => {
	const { fx, synth, tick, played } = env({ active: true });
	fx.sound.setEnabled(true);
	fx.sound.setVolume(0.8);
	fx.playSound('click');
	await tick();
	assert.deepEqual(played(), [['click', 0.8]]);
	assert.equal(synth.loads, 1);
});

test('volume 0, a hidden tab, allow=false and no user activation stay silent', async () => {
	const { fx, state, tick, played } = env({ active: true });
	fx.sound.setEnabled(true);
	fx.sound.setVolume(0);
	fx.playSound('click');
	await tick();
	fx.sound.setVolume(0.5);
	state.hidden = true;
	fx.playSound('click');
	await tick();
	state.hidden = false;
	fx.playSound('click', false);
	await tick();
	assert.deepEqual(played(), []);
	fx.playSound('click', true);
	await tick();
	assert.deepEqual(played(), [['click', 0.5]]);

	const inactive = env({ active: false });
	inactive.fx.sound.setEnabled(true);
	inactive.fx.playSound('success');
	await inactive.tick();
	assert.deepEqual(inactive.synth.played, []);
});

test('reduced motion mutes decorative sounds but keeps success and error', async () => {
	const { fx, synth, state, tick } = env({ active: true });
	fx.sound.setEnabled(true);
	state.reduce = true;
	assert.equal(fx.sound.muted, 'reduced-motion');
	for (const name of ['click', 'tick', 'toggle-on', 'toggle-off', 'open', 'close']) {
		fx.playSound(name);
		await tick(100);
	}
	assert.deepEqual(synth.played, []);
	fx.playSound('success');
	await tick(100);
	fx.playSound('error');
	await tick(100);
	assert.deepEqual(synth.played.map((/** @type {any[]} */ p) => p[0]), ['success', 'error']);
	state.reduce = false;
	assert.equal(fx.sound.muted, null);
	fx.playSound('click');
	await tick();
	assert.equal(synth.played.at(-1)[0], 'click');
});

test('same-frame calls coalesce to the highest priority sound', async () => {
	const { fx, synth, tick } = env({ active: true });
	fx.sound.setEnabled(true);
	await tick();
	fx.playSound('tick');
	fx.playSound('click');
	fx.playSound('close');
	fx.playSound('toggle-on');
	await tick();
	assert.deepEqual(synth.played.map((/** @type {any[]} */ p) => p[0]), ['close']);
	fx.playSound('click');
	fx.playSound('error');
	fx.playSound('success');
	await tick(100);
	assert.deepEqual(synth.played.map((/** @type {any[]} */ p) => p[0]), ['close', 'error']);
});

test('the same sound plays at most once per 50 ms (tick: 40 ms)', async () => {
	const { fx, synth, tick } = env({ active: true });
	fx.sound.setEnabled(true);
	await tick();
	const count = (/** @type {string} */ n) => synth.played.filter((/** @type {any[]} */ p) => p[0] === n).length;
	fx.playSound('click');
	await tick(20);
	fx.playSound('click');
	await tick(20);
	fx.playSound('click');
	await tick(20);
	assert.equal(count('click'), 1);
	fx.playSound('click');
	await tick(20);
	assert.equal(count('click'), 2);
	fx.playSound('tick');
	await tick(30);
	fx.playSound('tick');
	await tick(16);
	assert.equal(count('tick'), 1);
	fx.playSound('tick');
	await tick(16);
	assert.equal(count('tick'), 2);
});

/** A recording Web Audio stub: enough surface for the synth, no sound. */
function audioStub() {
	const log = { contexts: 0, resumes: 0, sources: /** @type {{ kind: string, start: number, stop: number }[]} */ ([]), gains: /** @type {number[][]} */ ([]), master: /** @type {{ value: number } | null} */ (null) };
	const param = (/** @type {number[]} */ ramps = []) => ({
		value: 0,
		setValueAtTime(/** @type {number} */ v) {
			ramps.push(v);
		},
		exponentialRampToValueAtTime(/** @type {number} */ v) {
			ramps.push(v);
		}
	});
	const node = (/** @type {object} */ extra = {}) => /** @type {any} */ ({
		connect(/** @type {object} */ target) {
			return target;
		},
		disconnect() {},
		...extra
	});
	const source = (/** @type {string} */ kind) => {
		const s = node({ kind, start(/** @type {number} */ t) { s.startAt = t; }, stop(/** @type {number} */ t) { log.sources.push({ kind, start: s.startAt, stop: t }); } });
		return s;
	};
	class AudioContext {
		state = 'suspended';
		currentTime = 0;
		sampleRate = 48000;
		destination = node();
		constructor() {
			log.contexts++;
		}
		resume() {
			log.resumes++;
			this.state = 'running';
			return Promise.resolve();
		}
		createGain() {
			/** @type {any[]} */
			const ramps = [];
			const g = node({ gain: param(ramps) });
			g.gain.ramps = ramps;
			log.gains.push(ramps);
			log.master ??= g.gain;
			return g;
		}
		createOscillator() {
			return { ...source('osc'), type: '', frequency: param() };
		}
		createBufferSource() {
			return { ...source('noise'), buffer: null };
		}
		createBiquadFilter() {
			return node({ type: '', frequency: param(), Q: param() });
		}
		createBuffer(/** @type {number} */ _ch, /** @type {number} */ len) {
			return { getChannelData: () => new Float32Array(len) };
		}
	}
	return { log, AudioContext };
}

test('synth: one AudioContext, master gain = volume, every voice is scheduled and short', () => {
	const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only', url: 'http://localhost/' });
	const win = dom.window;
	const { log, AudioContext } = audioStub();
	win.AudioContext = AudioContext;
	win.eval(synthBundle);
	const synth = win.__fixture;
	assert.equal(log.contexts, 0);
	synth.unlock();
	assert.equal(log.contexts, 1);
	assert.equal(log.resumes, 1);
	const names = ['click', 'toggle-on', 'toggle-off', 'open', 'close', 'success', 'error', 'tick'];
	for (const name of names) {
		const before = log.sources.length;
		log.gains.length = 1;
		synth.play(name, 0.4);
		assert.ok(log.sources.length > before, `${name} schedules a voice`);
		const end = Math.max(...log.sources.slice(before).map((s) => s.stop)) - 0.005;
		const limit = name === 'success' || name === 'error' ? 0.2 : 0.12;
		assert.ok(end <= limit, `${name} ends at ${end}s, limit ${limit}s`);
		const peak = Math.max(...log.gains.slice(1).flat());
		assert.ok(peak <= 0.3, `${name} peak gain ${peak}`);
	}
	assert.equal(log.contexts, 1);
	assert.equal(log.master?.value, 0.4);
	assert.ok(log.sources.some((s) => s.kind === 'noise') && log.sources.some((s) => s.kind === 'osc'));
	synth.play('nope', 1);
});
