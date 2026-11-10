<script module>
	export const meta = {
		title: 'Row actions',
		caption: 'actions returns the row actions as data: the first inlineActions (default 1) are icon buttons, the rest sit in the "more" menu. Touch and stacked cards keep one inline whatever inlineActions says.',
		layout: 'stack',
		resizable: true
	};
</script>

<script lang="ts">
	import { DataTable, Text, type Column, type RowAction } from '@dorsk/tsumikit';
	import { services, type Service } from './data';

	const columns: Column<Service>[] = [
		{ key: 'name', label: 'Service', role: 'title' },
		{ key: 'role', label: 'Role', hideBelow: 'sm' },
		{ key: 'region', label: 'Region', role: 'meta', stackLabel: false },
	];
	let last = $state('');

	const actions = (s: Service): RowAction[] => [
		{ id: 'logs', label: `Open logs for ${s.name}`, icon: 'external', onselect: () => (last = `Opened logs for ${s.name}`) },
		{ id: 'restart', label: 'Restart', icon: 'retry', onselect: () => (last = `Restarted ${s.name}`) },
		{ id: 'copy', label: 'Copy id', icon: 'copy', onselect: () => (last = `Copied id ${s.id}`), disabled: s.status === 'danger' },
		{ id: 'remove', label: 'Remove', icon: 'trash', danger: true, onselect: () => (last = `Removed ${s.name}`) },
	];
	const restartFirst = (s: Service): RowAction[] => {
		const [logs, restart, ...rest] = actions(s);
		return [{ ...restart, label: `Restart ${s.name}` }, logs, ...rest];
	};
</script>

<DataTable {columns} rows={services.slice(0, 4)} rowKey={(s) => s.id} {actions} responsive="stack" stackBelow="26rem" />
<DataTable {columns} rows={services.slice(0, 4)} rowKey={(s) => s.id} actions={restartFirst} inlineActions={2} size="sm" />
<Text size="sm" tone="muted">{last || 'Hover or focus a row to reveal its actions; on touch they stay visible.'}</Text>
