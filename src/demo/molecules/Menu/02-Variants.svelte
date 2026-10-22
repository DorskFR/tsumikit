<script module>
	export const meta = {
		title: 'Trigger chrome and placements',
		caption: 'variant/size/box/pill/tone pass to the trigger; placement picks the corner; count marks active filters.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Icon, Menu, toasts, type MenuItem } from '@dorsk/tsumikit';

	const items: MenuItem[] = [
		{ label: 'Open', icon: 'external', onselect: () => toasts.show('Opened') },
		{ label: 'Rename', icon: 'edit', onselect: () => toasts.show('Rename') },
		{ label: 'Archive', icon: 'archive', onselect: () => toasts.show('Archived') }
	];
	const placements = ['bottom-start', 'bottom-end', 'top-start', 'top-end'] as const;
</script>

<Cluster align="center">
	<Menu label="Actions" {items}>
		{#snippet trigger()}<Icon name="more" size={18} />{/snippet}
	</Menu>
	<Menu label="Actions" {items} variant="default" size="sm">
		{#snippet trigger()}Actions <Icon name="chevron-down" size={14} />{/snippet}
	</Menu>
	<Menu label="Actions" {items} variant="primary">
		{#snippet trigger()}New <Icon name="chevron-down" size={14} />{/snippet}
	</Menu>
	<Menu label="Actions" {items} variant="ghost" pill tone="accent">
		{#snippet trigger()}<Icon name="filter" size={14} /> Filters{/snippet}
	</Menu>
	<Menu label="Actions" {items} box="sm" count={2}>
		{#snippet trigger()}<Icon name="filter" size={14} />{/snippet}
	</Menu>
	<Menu label="Actions" {items} variant="danger" size="lg">
		{#snippet trigger()}Danger zone <Icon name="chevron-down" size={14} />{/snippet}
	</Menu>
</Cluster>
<Cluster align="center">
	{#each placements as placement (placement)}
		<Menu label="Actions ({placement})" {items} {placement} variant="default" size="sm">
			{#snippet trigger()}{placement}{/snippet}
		</Menu>
	{/each}
</Cluster>
