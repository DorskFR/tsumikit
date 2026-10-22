<script module>
	export const meta = {
		title: 'States',
		caption: 'all-empty segments, a single segment, a zero-value slice collapsing in stacked mode, a remainder against max, and many thin segments.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { SegmentedProgress } from '@dorsk/tsumikit';

	const many = Array.from({ length: 24 }, (_, i) => ({
		value: i % 5 === 0 ? 0 : 1,
		max: 1,
		tone: i % 7 === 0 ? 'danger' : i % 5 === 0 ? 'muted' : 'success',
		label: `Shard ${i + 1}`,
	})) as { value: number; max: number; tone: 'danger' | 'muted' | 'success'; label: string }[];
</script>

<SegmentedProgress label="Nothing started" segments={[{ value: 0, max: 5, tone: 'muted' }, { value: 0, max: 5, tone: 'muted' }]} />
<SegmentedProgress label="Single segment" segments={[{ value: 3, max: 4, tone: 'accent', label: '3 of 4' }]} legend="inline" />
<SegmentedProgress mode="stacked" label="Zero slice collapses" legend segments={[{ value: 40, max: 0, tone: 'ok', label: 'passed' }, { value: 0, max: 0, tone: 'danger', label: 'failed' }]} />
<SegmentedProgress mode="stacked" size="sm" max={600} legend="inline" label="Stacked with remainder" segments={[{ value: 300, max: 0, tone: 'accent', label: 'done' }, { value: 120, max: 0, tone: 'muted', label: 'skipped' }]} />
<SegmentedProgress size="sm" gap={1} label="24 shards" segments={many} />
