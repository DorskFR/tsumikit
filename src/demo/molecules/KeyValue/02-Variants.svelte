<script module>
	export const meta = {
		title: 'Columns, density and alignment',
		caption: 'columns={1} | {2}; dense tightens the row gap; align="end" right-aligns values.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { KeyValue, Text } from '@dorsk/tsumikit';

	const rows = [
		{ label: 'Model', value: 'claude-sonnet-5-5', mono: true },
		{ label: 'Tokens', value: 128000 },
		{ label: 'Cost', value: '$0.42' },
		{ label: 'Duration', value: '4 min 12 s' }
	];
</script>

<div class="col"><Text size="xs" tone="muted">columns 1</Text><KeyValue {rows} /></div>
<div class="col"><Text size="xs" tone="muted">columns 2</Text><KeyValue {rows} columns={2} /></div>
<div class="col"><Text size="xs" tone="muted">dense</Text><KeyValue {rows} dense /></div>
<div class="col"><Text size="xs" tone="muted">align end</Text><KeyValue {rows} align="end" /></div>

<style>
	.col {
		display: grid;
		gap: var(--sp-2);
		min-width: 0;
	}
</style>
