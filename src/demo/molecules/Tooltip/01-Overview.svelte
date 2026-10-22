<script module>
	export const meta = {
		title: 'Player toolbar hints',
		caption: 'text names each icon-only control; the bubble opens on hover after delay and on keyboard focus, Escape hides it.',
	};
</script>

<script lang="ts">
	import { Cluster, IconButton, Kbd, Text, Tooltip } from '@dorsk/tsumikit';

	let playing = $state(false);
	let muted = $state(false);
</script>

<Cluster align="center" gap="var(--sp-1)">
	<Tooltip text="Previous track">
		{#snippet trigger()}<IconButton icon="chevron-left" label="Previous track" />{/snippet}
	</Tooltip>
	<Tooltip text={playing ? 'Pause' : 'Play'}>
		{#snippet trigger()}
			<IconButton icon={playing ? 'pause' : 'play'} label={playing ? 'Pause' : 'Play'} variant="primary" onclick={() => (playing = !playing)} />
		{/snippet}
	</Tooltip>
	<Tooltip text="Next track">
		{#snippet trigger()}<IconButton icon="chevron-right" label="Next track" />{/snippet}
	</Tooltip>
	<Tooltip placement="bottom">
		{#snippet trigger()}
			<IconButton icon={muted ? 'volume-mute' : 'volume'} label={muted ? 'Unmute' : 'Mute'} onclick={() => (muted = !muted)} />
		{/snippet}
		{#snippet content()}
			<Cluster align="center" gap="var(--sp-2)"><Text size="sm">{muted ? 'Unmute' : 'Mute'}</Text><Kbd keys="m" /></Cluster>
		{/snippet}
	</Tooltip>
</Cluster>
