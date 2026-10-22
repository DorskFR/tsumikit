<script module>
	export const meta = {
		title: 'Service fleet',
		caption: 'cellSnippets for the status badge, rowTone accent bars, hover rowActions, onrowclick, and layout="fixed" with truncate and hideBelow.',
		layout: 'stack',
		resizable: true
	};
</script>

<script lang="ts">
	import { Badge, Cluster, DataTable, IconButton, Text } from '@dorsk/tsumikit';
	import { overviewColumns, services, statusTone, type Service } from './data';

	let opened = $state('');
</script>

{#snippet status(s: Service)}
	<Badge tone={statusTone[s.status]} dot>{s.status}</Badge>
{/snippet}

<DataTable
	columns={overviewColumns}
	rows={services}
	rowKey={(s) => s.id}
	layout="fixed"
	rowTone={(s) => (s.status === 'ok' ? undefined : s.status)}
	onrowclick={(s) => (opened = s.name)}
	cellSnippets={{ status }}
>
	{#snippet rowActions(s: Service)}
		<Cluster gap="var(--sp-1)" wrap={false}>
			<IconButton icon="retry" label="Restart {s.name}" box="sm" />
			<IconButton icon="external" label="Open logs for {s.name}" box="sm" />
		</Cluster>
	{/snippet}
</DataTable>
<Text size="sm" tone="muted">{opened ? `Opened ${opened}` : 'Click a row to open the service; drag the handle to drop columns.'}</Text>
