<script module>
	export const meta = {
		title: 'Tones, sizes, surfaces and inline',
		caption: 'tone tints the chip; size="sm" is the dense tile; surface="base" | "raised" | "sunken" matches sibling Cards; layout="inline" drops the Card.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { AutoGrid, Cluster, Metric } from '@dorsk/tsumikit';

	const tones = ['neutral', 'accent', 'info', 'ok', 'warn', 'danger'] as const;
</script>

<AutoGrid min="150px">
	{#each tones as tone (tone)}
		<Metric label={tone} value={42} unit="%" icon="disc" {tone} tintValue size="sm" />
	{/each}
</AutoGrid>
<AutoGrid min="180px">
	<Metric label="Base" value="base" icon="file" />
	<Metric label="Raised" value="raised" icon="file" surface="raised" />
	<Metric label="Sunken" value="sunken" icon="file" surface="sunken" />
</AutoGrid>
<Cluster gap="var(--sp-6)">
	<Metric layout="inline" label="Tracks" value={1284} />
	<Metric layout="inline" label="Size" value="42.7" unit="GB" tone="info" tintValue />
	<Metric layout="inline" label="Quality" value="FLAC" sub="16-bit" tone="ok" />
</Cluster>
