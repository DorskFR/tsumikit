import { browser } from '$lib/env';
import { readStorage, writeStorage } from './storage';

// OPT-IN UI sound effects. Off by default and persisted; while off nothing is
// imported, no AudioContext exists and no listener is attached. The synth is a
// separate chunk loaded on first play (or eagerly when enabling, so a gesture
// listener can unlock audio for Safari).
//
// With `prefers-reduced-motion: reduce` only the feedback sounds (success,
// error) play: they carry information, the decorative ones are muted.
// Calls inside one frame are coalesced and the highest priority wins
// (error > success > open/close > toggle > click > tick); the same sound plays
// at most once per 50 ms (tick: 40 ms). Hidden tabs are silent.
const KEY = 'tsumikit-sound';
const DEFAULT_VOLUME = 0.5;

export type SoundName =
	| 'click'
	| 'toggle-on'
	| 'toggle-off'
	| 'open'
	| 'close'
	| 'success'
	| 'error'
	| 'tick';
export type SoundMuted = 'off' | 'reduced-motion' | null;

type Synth = typeof import('../sound-synth');

// Lowest to highest priority; the last two are feedback and survive reduced motion.
const ORDER: SoundName[] = [
	'tick',
	'click',
	'toggle-on',
	'toggle-off',
	'open',
	'close',
	'success',
	'error',
];
const GAP_MS = 50;
const TICK_GAP_MS = 40;

let synth: Synth | null = null;
let loading: Promise<Synth> | null = null;
let armed = false;
let pending: SoundName | null = null;
const last = new Map<SoundName, number>();

function clamp(v: number, fallback: number): number {
	return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback;
}

function reducedMotion(): boolean {
	return !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function load(): Promise<Synth> {
	loading ??= import('../sound-synth').then((m) => (synth = m));
	return loading;
}

function unlock(): void {
	if (!synth) return;
	synth.unlock();
	listen(false);
}

function listen(on: boolean): void {
	if (armed === on) return;
	armed = on;
	for (const type of ['pointerdown', 'keydown']) {
		if (on) addEventListener(type, unlock, { capture: true });
		else removeEventListener(type, unlock, { capture: true });
	}
}

function flush(): void {
	const name = pending;
	pending = null;
	if (!name || !sound.enabled) return;
	const now = performance.now();
	if (now - (last.get(name) ?? -1e9) < (name === 'tick' ? TICK_GAP_MS : GAP_MS)) return;
	last.set(name, now);
	const volume = sound.volume;
	if (synth) synth.play(name, volume);
	else
		load().then(
			(m) => m.play(name, volume),
			() => {},
		);
}

/**
 * Play a UI sound if the user enabled sounds. `allow` is the per-component
 * opt-out (`sound={false}`). Safe to call during SSR: it is a no-op there.
 */
export function playSound(name: SoundName, allow: boolean | undefined = true): void {
	if (!browser || allow === false || !sound.enabled || sound.volume <= 0) return;
	if (document.hidden) return;
	if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
	const rank = ORDER.indexOf(name);
	if (rank < ORDER.length - 2 && reducedMotion()) return;
	if (pending === null) {
		requestAnimationFrame(flush);
		pending = name;
	} else if (rank > ORDER.indexOf(pending)) pending = name;
}

class Sound {
	enabled = $state(false);
	volume = $state(DEFAULT_VOLUME);

	constructor() {
		if (!browser) return;
		const raw = readStorage(KEY);
		if (raw) {
			try {
				const saved = JSON.parse(raw);
				if (typeof saved?.enabled === 'boolean') this.enabled = saved.enabled;
				if (typeof saved?.volume === 'number') this.volume = clamp(saved.volume, DEFAULT_VOLUME);
			} catch {}
		}
		if (this.enabled) {
			load().catch(() => {});
			listen(true);
		}
	}

	/** Why nothing would play right now, for a settings hint. */
	get muted(): SoundMuted {
		if (!this.enabled) return 'off';
		return reducedMotion() ? 'reduced-motion' : null;
	}

	setEnabled(on: boolean) {
		this.enabled = on;
		this.save();
		if (!browser) return;
		if (on) {
			load().catch(() => {});
			listen(true);
			unlock();
		} else listen(false);
	}

	setVolume(v: number) {
		this.volume = clamp(v, this.volume);
		this.save();
	}

	play(name: SoundName) {
		playSound(name);
	}

	private save() {
		if (!browser) return;
		writeStorage(KEY, JSON.stringify({ enabled: this.enabled, volume: this.volume }));
	}
}

export const sound = new Sound();
