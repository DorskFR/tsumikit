<script module>
	export const meta = {
		title: 'Player transport',
		caption: 'current and duration in seconds; the readout is a button that flips to the remaining time, and bind:remaining keeps the choice.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, IconButton, SeekSlider, Text, TimeDisplay } from '@dorsk/tsumikit';
	import { tracks } from '../../fixtures';

	const track = tracks[0];
	let position = $state(74);
	let playing = $state(true);
	let remaining = $state(false);
	$effect(() => {
		if (!playing) return;
		const t = setInterval(() => (position = (position + 1) % track.durationS), 1000);
		return () => clearInterval(t);
	});
</script>

<div style="max-width: 28rem">
	<Text weight="medium">{track.title}</Text>
	<Text size="sm" tone="muted">{track.artist} · {track.album}</Text>
	<SeekSlider bind:value={position} max={track.durationS} />
	<Cluster justify="space-between">
		<Cluster gap="var(--sp-1)">
			<IconButton icon={playing ? 'pause' : 'play'} label={playing ? 'Pause' : 'Play'} onclick={() => (playing = !playing)} />
			<IconButton icon="volume" label="Volume" />
		</Cluster>
		<TimeDisplay current={position} duration={track.durationS} bind:remaining />
	</Cluster>
</div>
