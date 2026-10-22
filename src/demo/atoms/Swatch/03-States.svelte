<script module>
	export const meta = {
		title: 'Selected, decorative and legend',
		caption: 'selected draws the ring on static or interactive swatches; without a label the swatch is aria-hidden so the adjacent text carries the name.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Swatch, Text } from '@dorsk/tsumikit';

	const legend = [
		{ name: 'Healthy', color: 'var(--ok)' },
		{ name: 'Degraded', color: 'var(--warn)' },
		{ name: 'Down', color: 'var(--danger)' },
		{ name: 'Unknown', color: 'var(--text-muted)' }
	];
</script>

<Cluster>
	<Swatch color="var(--accent)" size="lg" label="Static selected" selected />
	<Swatch color="var(--accent)" size="lg" label="Static" />
	<Swatch color="var(--info)" size="lg" label="Pressed" interactive selected />
	<Swatch color="var(--info)" size="lg" label="Unpressed" interactive />
</Cluster>
<Cluster gap="var(--sp-4)">
	{#each legend as l (l.name)}
		<Cluster gap="var(--sp-1)" align="center">
			<Swatch color={l.color} size="sm" shape="square" />
			<Text size="sm">{l.name}</Text>
		</Cluster>
	{/each}
</Cluster>
