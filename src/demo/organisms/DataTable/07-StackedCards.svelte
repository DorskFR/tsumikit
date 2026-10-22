<script module>
	export const meta = {
		title: 'Stacked card details',
		caption: 'Always stacked in a 22rem box: stackLabel: false joins metas on one · line and skips empty cells; stackActions="end" closes each card with its actions.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, DataTable, type Column } from '@dorsk/tsumikit';
	import { services, type Service } from './data';

	const columns: Column<Service>[] = [
		{ key: 'name', label: 'Service', role: 'title' },
		{ key: 'role', label: 'Role', role: 'meta', stackLabel: false },
		{ key: 'region', label: 'Region', role: 'meta', stackLabel: false },
		{ key: 'id', label: 'Id', role: 'meta', stackLabel: false, get: (s) => `#${s.id}` },
	];
	const rows: Service[] = [
		{ ...services[0], name: 'api-gateway-with-a-long-unbroken-name-for-the-eu-edge', region: '' },
		services[1],
		services[3],
	];
</script>

<div class="narrow">
	<DataTable {columns} {rows} rowKey={(s) => s.id} responsive="stack" stackActions="end">
		{#snippet rowActions(s: Service)}
			<Button size="sm" variant="ghost">Open {s.role}</Button>
		{/snippet}
	</DataTable>
</div>

<style>
	.narrow {
		max-width: 22rem;
	}
</style>
