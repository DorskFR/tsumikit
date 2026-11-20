<script module>
	export const meta = {
		title: 'Segment mode, sizes, gaps and legends',
		caption: 'default mode gives each segment its own value/max track (widths ∝ max); size sm/md/lg; gap spaces them; legend inline, below or a snippet.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { SegmentedProgress, Text } from '@dorsk/tsumikit';

	const seasons = [
		{ value: 10, max: 10, tone: 'success', label: 'Season 1 · 10/10' },
		{ value: 6, max: 13, tone: 'warn', label: 'Season 2 · 6/13' },
		{ value: 0, max: 8, tone: 'muted', label: 'Season 3 · 0/8' },
	] as const;
	const checks = [
		{ value: 412, max: 0, tone: 'ok', label: 'conforming' },
		{ value: 12, max: 0, tone: 'warn', label: 'nonconforming' },
		{ value: 3, max: 0, tone: 'danger', label: 'blocked' },
	] as const;
	const tones = [
		{ value: 4, max: 5, tone: 'accent', label: 'accent' },
		{ value: 4, max: 5, tone: 'ok', label: 'ok' },
		{ value: 4, max: 5, tone: 'warn', label: 'warn' },
		{ value: 4, max: 5, tone: 'danger', label: 'danger' },
		{ value: 4, max: 5, tone: 'info', label: 'info' },
		{ value: 4, max: 5, tone: 'neutral', label: 'neutral' },
	] as const;
</script>

<SegmentedProgress label="Series completion by season" segments={[...seasons]} />
<SegmentedProgress size="sm" label="Thin" segments={[...seasons]} />
<SegmentedProgress size="lg" gap={6} label="Tall, wide gap" segments={[...seasons]} />
<SegmentedProgress label="Every tone" legend segments={[...tones]} />
<SegmentedProgress mode="stacked" label="Maintenance checks" legend="inline" segments={[...checks]} />
<SegmentedProgress mode="stacked" label="Maintenance checks" segments={[...checks]}>
	{#snippet legend(segs)}
		<Text size="xs" tone="muted">{segs.map((s) => `${s.value} ${s.label}`).join(' · ')}</Text>
	{/snippet}
</SegmentedProgress>
