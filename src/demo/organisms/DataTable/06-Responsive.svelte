<script module>
	export const meta = {
		title: 'Responsive cards',
		caption: 'responsive="stack" turns rows into cards under stackBelow (30rem of its own width); Column.role places title, meta, detail and hidden cells. Drag the handle.',
		layout: 'stack',
		resizable: true
	};
</script>

<script lang="ts">
	import { Badge, DataTable, IconButton } from '@dorsk/tsumikit';
	import { services, stackColumns, statusTone, type Service } from './data';
</script>

{#snippet status(s: Service)}
	<Badge tone={statusTone[s.status]}>{s.status}</Badge>
{/snippet}

<DataTable
	columns={stackColumns}
	rows={services.slice(0, 4)}
	rowKey={(s) => s.id}
	responsive="stack"
	stackBelow="30rem"
	cellSnippets={{ status }}
>
	{#snippet rowActions(s: Service)}
		<IconButton icon="copy" label="Copy {s.name}" box="sm" />
	{/snippet}
</DataTable>
