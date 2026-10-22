<script module>
	export const meta = {
		title: 'Playback settings',
		caption: 'showValue adds a bound <output>; format shapes it; marks are clickable labelled stops; --slider-accent recolours one instance.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Field, Slider, Stack, Text } from '@dorsk/tsumikit';

	let volume = $state(72);
	let speed = $state(1);
	let crossfade = $state(4);
	const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2].map((v) => ({ value: v, label: `${v}×` }));
</script>

<Stack gap="var(--sp-4)" style="max-width: 28rem">
	<Field label="Volume">
		<Slider bind:value={volume} showValue format={(v) => `${v}%`} />
	</Field>
	<Field label="Playback speed">
		<Slider bind:value={speed} min={0.5} max={2} step={0.25} marks={speeds} showValue />
	</Field>
	<Field label="Crossfade" hint="Seconds of overlap between tracks.">
		<Slider bind:value={crossfade} min={0} max={12} ticks showValue format={(v) => (v ? `${v}s` : 'Off')} style="--slider-accent: var(--c-teal)" />
	</Field>
	<Text size="xs" tone="muted">{volume}% · {speed}× · crossfade {crossfade}s</Text>
</Stack>
