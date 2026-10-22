<script module>
	export const meta = {
		title: 'Sorting',
		caption: 'sortable columns sort by the displayed value; pass onsort to own the order (server-side) and the table only shows the indicator.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { DataTable, Text, type Column } from '@dorsk/tsumikit';
	import { services, type Service } from './data';

	const columns: Column<Service>[] = [
		{ key: 'name', label: 'Service', sortable: true },
		{ key: 'cpu', label: 'CPU %', align: 'right', sortable: true },
		{ key: 'uptimeDays', label: 'Uptime (d)', align: 'right', sortable: true },
	];

	let order = $state<{ key: keyof Service; dir: 'asc' | 'desc' } | null>(null);
	let request = $state('GET /services');
	const serverRows = $derived.by(() => {
		if (!order) return services;
		const { key, dir } = order;
		const sign = dir === 'asc' ? 1 : -1;
		return [...services].sort((a, b) => sign * String(a[key]).localeCompare(String(b[key]), undefined, { numeric: true }));
	});

	function onsort(key: string, dir: 'asc' | 'desc') {
		order = { key: key as keyof Service, dir };
		request = `GET /services?sort=${key}&dir=${dir}`;
	}
</script>

<Text size="sm" tone="muted">Client-side</Text>
<DataTable {columns} rows={services} rowKey={(s) => s.id} size="sm" />
<Text size="sm" tone="muted">Caller-owned (onsort) · <Text mono size="sm">{request}</Text></Text>
<DataTable {columns} rows={serverRows} rowKey={(s) => s.id} size="sm" {onsort} />
