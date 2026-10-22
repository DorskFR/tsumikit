<script module>
	export const meta = {
		title: 'Row tone × size matrix',
		caption: 'Regression fixture: every rowTone at both sizes, with alignments and a nowrap column.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { DataTable, type Column, type RowTone } from '@dorsk/tsumikit';

	type Row = { tone: RowTone; label: string; count: number };
	const sizes = ['md', 'sm'] as const;
	const tones: RowTone[] = ['neutral', 'ok', 'warn', 'danger', 'info'];
	const rows: Row[] = tones.map((tone, i) => ({ tone, label: `rowTone="${tone}"`, count: (i + 1) * 128 }));
	const columns: Column<Row>[] = [
		{ key: 'label', label: 'Left', nowrap: true },
		{ key: 'tone', label: 'Center', align: 'center' },
		{ key: 'count', label: 'Right', align: 'right' },
	];
</script>

{#each sizes as size (size)}
	<DataTable {columns} {rows} rowKey={(r) => r.tone} {size} rowTone={(r) => r.tone} />
{/each}
