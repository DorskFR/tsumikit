// Lazily imported Web Audio synth: one shared AudioContext, a master gain and a
// cached noise buffer. Never import this statically; `playSound` loads it on demand.
import type { SoundName } from './stores/sound.svelte';

type Wave = OscillatorType | 'n';
// [wave, startHz, endHz, offsetS, durationS, gain]; 'n' = band-passed noise at startHz.
type Voice = [Wave, number, number, number, number, number];

const PALETTE: Record<SoundName, Voice[]> = {
	click: [
		['n', 3000, 0, 0, 0.012, 0.18],
		['sine', 620, 380, 0, 0.04, 0.22],
	],
	'toggle-on': [
		['n', 2600, 0, 0, 0.012, 0.3],
		['sine', 520, 520, 0, 0.03, 0.14],
		['triangle', 660, 880, 0.035, 0.05, 0.3],
	],
	'toggle-off': [
		['n', 2600, 0, 0, 0.012, 0.3],
		['sine', 520, 520, 0, 0.03, 0.14],
		['triangle', 880, 620, 0.035, 0.05, 0.3],
	],
	open: [['sine', 420, 760, 0, 0.09, 0.25]],
	close: [['sine', 700, 380, 0, 0.08, 0.25]],
	success: [
		['sine', 698, 698, 0, 0.055, 0.25],
		['sine', 1047, 1047, 0.058, 0.085, 0.2],
	],
	error: [
		['triangle', 330, 300, 0, 0.065, 0.28],
		['triangle', 262, 240, 0.06, 0.08, 0.28],
	],
	tick: [
		['n', 3800, 0, 0, 0.008, 0.3],
		['sine', 2400, 1900, 0, 0.012, 0.14],
	],
};

let ctx: AudioContext | undefined;
let out: GainNode | undefined;
let noise: AudioBuffer | undefined;

function context(): AudioContext {
	ctx ??= new AudioContext();
	if (ctx.state === 'suspended') ctx.resume().catch(() => {});
	return ctx;
}

// Call synchronously inside a user gesture so Safari lets the context start.
export function unlock(): void {
	context();
}

export function play(name: SoundName, volume: number): void {
	const voices = PALETTE[name];
	if (!voices) return;
	const c = context();
	if (!out) {
		out = c.createGain();
		out.connect(c.destination);
	}
	out.gain.value = volume;
	const t = c.currentTime + 0.005;
	for (const [wave, f0, f1, at, d, g] of voices) {
		const env = c.createGain();
		const s = t + at;
		env.gain.setValueAtTime(0.0001, s);
		env.gain.exponentialRampToValueAtTime(g, s + 0.004);
		env.gain.exponentialRampToValueAtTime(0.0001, s + d);
		env.connect(out);
		let src: AudioScheduledSourceNode;
		if (wave === 'n') {
			if (!noise) {
				noise = c.createBuffer(1, c.sampleRate * 0.05, c.sampleRate);
				const data = noise.getChannelData(0);
				for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
			}
			const buf = c.createBufferSource();
			buf.buffer = noise;
			const bp = c.createBiquadFilter();
			bp.type = 'bandpass';
			bp.frequency.value = f0;
			bp.Q.value = 1.2;
			buf.connect(bp).connect(env);
			src = buf;
		} else {
			const osc = c.createOscillator();
			osc.type = wave;
			osc.frequency.setValueAtTime(f0, s);
			osc.frequency.exponentialRampToValueAtTime(f1, s + d);
			osc.connect(env);
			src = osc;
		}
		src.start(s);
		src.stop(s + d + 0.02);
		src.onended = () => env.disconnect();
	}
}
