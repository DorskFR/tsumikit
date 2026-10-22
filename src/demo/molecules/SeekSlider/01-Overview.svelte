<script module>
	export const meta = {
		title: 'Now playing',
		caption: 'bind:value moves only on commit; oninput previews the target while dragging and onchange is where the player seeks.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Artwork, Card, Cluster, IconButton, SeekSlider, Stack, Text, TimeDisplay, VolumeSlider, formatMediaTime } from '@dorsk/tsumikit';
	import { tracks } from '../../fixtures';

	const track = tracks[2];
	let position = $state(96);
	let scrubTo = $state<number | null>(null);
	let playing = $state(false);
	let volume = $state(0.7);
	let muted = $state(false);
	let seeks = $state(0);
</script>

<Card>
	<Stack gap="var(--sp-3)">
		<Cluster gap="var(--sp-3)" align="center">
			<Artwork alt={track.album} seed={track.album} size="3rem" radius="md" />
			<Stack gap="0" style="min-width: 0; flex: 1">
				<Text weight="semibold" truncate>{track.title}</Text>
				<Text size="sm" tone="muted" truncate>{track.artist} · {track.album}</Text>
			</Stack>
		</Cluster>
		<SeekSlider
			bind:value={position}
			max={track.durationS}
			buffered={[[0, 180]]}
			label="Seek {track.title}"
			oninput={(s) => (scrubTo = s)}
			onscrubend={() => (scrubTo = null)}
			onchange={() => seeks++}
		/>
		<Cluster justify="space-between" align="center">
			<Cluster gap="var(--sp-2)" align="center">
				<IconButton icon={playing ? 'pause' : 'play'} label={playing ? 'Pause' : 'Play'} onclick={() => (playing = !playing)} />
				<TimeDisplay current={position} duration={track.durationS} />
			</Cluster>
			<VolumeSlider bind:value={volume} bind:muted />
		</Cluster>
		<Text size="xs" tone="muted">
			{scrubTo === null ? `${seeks} seek${seeks === 1 ? '' : 's'} committed` : `Release to seek to ${formatMediaTime(scrubTo)}`}
		</Text>
	</Stack>
</Card>
