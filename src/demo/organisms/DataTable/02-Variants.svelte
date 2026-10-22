<script module>
	export const meta = {
		title: 'Density and chrome',
		caption: 'size="md" | "sm", hideHeader keeps the header for assistive tech only, stickyHeader inside a bounded height.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { DataTable, Text, type Column } from '@dorsk/tsumikit';
	import { memory, services, type Service } from './data';

	const columns: Column<Service>[] = [
		{ key: 'name', label: 'Service' },
		{ key: 'region', label: 'Region', hideBelow: 'sm' },
		{ key: 'memoryMb', label: 'Memory', align: 'right', get: memory },
	];
	const top = services.slice(0, 3);
</script>

<Text size="sm" tone="muted">Comfortable (size="md")</Text>
<DataTable {columns} rows={top} rowKey={(s) => s.id} />
<Text size="sm" tone="muted">Compact (size="sm")</Text>
<DataTable {columns} rows={top} rowKey={(s) => s.id} size="sm" />
<Text size="sm" tone="muted">Headerless list (hideHeader)</Text>
<DataTable {columns} rows={top} rowKey={(s) => s.id} size="sm" hideHeader />
<Text size="sm" tone="muted">Sticky header in an 8rem scroller</Text>
<DataTable {columns} rows={services} rowKey={(s) => s.id} size="sm" stickyHeader style="max-height: 8rem" />
