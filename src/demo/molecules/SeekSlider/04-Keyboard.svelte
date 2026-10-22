<script module>
	export const meta = {
		title: 'Keyboard and events',
		caption: 'step seconds per arrow, bigStep of the duration per PageUp/PageDown, Home/End; every key press is one onchange.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { SeekSlider, Text, formatMediaTime } from '@dorsk/tsumikit';

	let value = $state(60);
	let log = $state<string[]>([]);
	const push = (line: string) => (log = [line, ...log].slice(0, 4));
</script>

<SeekSlider
	bind:value
	max={600}
	step={10}
	bigStep={0.25}
	label="Seek lecture"
	onscrubstart={() => push('scrub start')}
	onchange={(s) => push(`seek → ${formatMediaTime(s)}`)}
/>
<Text size="sm" tone="muted">Focus the track, then try ← → PageUp PageDown Home End.</Text>
<Text size="xs" mono tone="muted">{log.join(' · ') || 'no events yet'}</Text>
