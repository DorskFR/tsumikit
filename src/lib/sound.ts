// What components import to play a sound. No audio code lives here: the synth
// is a separate chunk that `playSound` imports on demand once sounds are on.
export { playSound, type SoundMuted, type SoundName } from './stores/sound.svelte';
