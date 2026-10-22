<script module>
	export const meta = {
		title: 'Disk usage breakdown',
		caption: 'mode="stacked" sizes slices by value against max; legend="below" lists them; the remainder shows as empty track.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, SegmentedProgress, Text } from '@dorsk/tsumikit';

	const total = 512;
	const usage = [
		{ value: 212, max: 0, tone: 'accent', label: 'Media' },
		{ value: 96, max: 0, tone: 'info', label: 'Snapshots' },
		{ value: 61, max: 0, tone: 'warn', label: 'Logs' },
		{ value: 18, max: 0, tone: 'danger', label: 'Core dumps' },
	] as const;
	const used = usage.reduce((s, u) => s + u.value, 0);
</script>

<div style="max-width: 32rem">
	<Cluster justify="space-between">
		<Text weight="medium">cyberia-media</Text>
		<Text size="sm" tone="muted" numeric>{used} / {total} GB</Text>
	</Cluster>
	<SegmentedProgress mode="stacked" max={total} segments={[...usage]} legend="below" label="Disk usage" />
</div>
