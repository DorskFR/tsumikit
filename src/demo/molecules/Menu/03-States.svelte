<script module>
	export const meta = {
		title: 'Checkable, disabled, long and scrolling',
		caption: 'pressed renders menuitemcheckbox, keepOpen leaves the menu open, disabled rows skip focus, panelStyle caps and scrolls the panel.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Icon, Menu, Text, toasts, type MenuItem } from '@dorsk/tsumikit';

	let filters = $state({ live: true, keepAlive: false, archived: false });
	const active = $derived(Object.values(filters).filter(Boolean).length);

	const view: MenuItem[] = $derived([
		{ label: 'Live sessions', icon: 'live', pressed: filters.live, keepOpen: true, onselect: () => (filters.live = !filters.live) },
		{ label: 'Keep alive', icon: 'settings', pressed: filters.keepAlive, keepOpen: true, onselect: () => (filters.keepAlive = !filters.keepAlive) },
		{ label: 'Archived', pressed: filters.archived, keepOpen: true, onselect: () => (filters.archived = !filters.archived) },
		{ label: 'Export (owner only)', icon: 'download', disabled: true },
		{ label: 'Clear all sessions', icon: 'trash', danger: true, onselect: () => toasts.error('Cleared') }
	]);

	const regions: MenuItem[] = ['af-south-1', 'ap-northeast-1', 'ap-southeast-2', 'ca-central-1', 'eu-central-1', 'eu-west-1', 'eu-west-3', 'sa-east-1', 'us-east-1', 'us-west-2'].map(
		(r) => ({ label: r, icon: 'map', onselect: () => toasts.show(`Region ${r}`) })
	);

	const long: MenuItem[] = [
		{ label: 'Re-run the whole pipeline from the last green checkpoint with cache disabled', icon: 'retry', onselect: () => toasts.show('Re-running') },
		{ label: 'Download logs', icon: 'download', tag: 'slow', tagTone: 'warn', onselect: () => toasts.show('Downloading') }
	];
</script>

<Cluster align="center">
	<Menu label="View filters" items={view} variant="default" size="sm" count={active}>
		{#snippet trigger()}<Icon name="filter" size={14} /> View{/snippet}
	</Menu>
	<Menu label="Region" items={regions} variant="default" size="sm" panelStyle="max-height: 12rem; overflow-y: auto">
		{#snippet trigger()}Region <Icon name="chevron-down" size={14} />{/snippet}
	</Menu>
	<Menu label="Pipeline" items={long} variant="default" size="sm" panelStyle="max-width: 16rem">
		{#snippet trigger()}Pipeline <Icon name="chevron-down" size={14} />{/snippet}
	</Menu>
	<Menu label="Unavailable" items={view} variant="default" size="sm" disabled>
		{#snippet trigger()}Disabled trigger{/snippet}
	</Menu>
</Cluster>
<Text size="sm" tone="muted">{active} of 3 view filters on</Text>
