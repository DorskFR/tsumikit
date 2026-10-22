<script module>
	export const meta = {
		title: 'Sides and widths',
		caption: 'side="left" or "right"; width is any CSS length on wide viewports and clamps to the screen; navWidth sizes the page column.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Drawer, NavItem, Text } from '@dorsk/tsumikit';

	const variants = [
		{ id: 'left', side: 'left', width: '320px', label: 'Left, 320px' },
		{ id: 'right', side: 'right', width: '620px', label: 'Right, 620px (default)' },
		{ id: 'wide', side: 'right', width: '56rem', label: 'Right, 56rem' }
	] as const;
	let which = $state<string | null>(null);
</script>

<Cluster align="center">
	{#each variants as v (v.id)}
		<Button size="sm" onclick={() => (which = v.id)}>{v.label}</Button>
	{/each}
	<Button size="sm" onclick={() => (which = 'nav')}>Wide nav column</Button>
</Cluster>

{#each variants as v (v.id)}
	<Drawer open={which === v.id} onclose={() => (which = null)} side={v.side} width={v.width} title="Filters" icon="filter">
		<Text>{v.label}. Below 48rem the panel is always full-screen.</Text>
		{#snippet footer()}<Button onclick={() => (which = null)}>Close</Button>{/snippet}
	</Drawer>
{/each}
<Drawer open={which === 'nav'} onclose={() => (which = null)} width="720px" navWidth="220px" title="Sessions" page="Recently active" icon="list">
	{#snippet nav()}
		<NavItem icon="clock" label="Recently active sessions" active />
		<NavItem icon="star" label="Starred" />
		<NavItem icon="archive" label="Archived" />
	{/snippet}
	<Text>navWidth="220px" gives long page names room on wide viewports; under 48rem the nav becomes a strip above the content.</Text>
	{#snippet footer()}<Button onclick={() => (which = null)}>Close</Button>{/snippet}
</Drawer>
