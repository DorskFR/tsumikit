<script lang="ts">
	import { Input, NavItem, NavSection, Text } from '@dorsk/tsumikit';
	import { FAMILY_LABEL } from './catalog';
	import { demoFilter } from './filter.svelte';
	import { groups } from './registry';
	import { pageOf } from './routes';

	let { active = '' }: { active?: string } = $props();

	const shown = $derived(
		groups
			.map((g) => ({ ...g, entries: g.entries.filter((e) => demoFilter.visible.has(e.id)) }))
			.filter((g) => g.entries.length > 0)
	);
</script>

<nav class="demo-nav" data-demo-nav aria-label="Components">
	<Input
		bind:value={demoFilter.text}
		icon="search"
		clearable
		size="sm"
		placeholder="Filter components"
		aria-label="Filter components"
		class="demo-nav__filter"
	/>
	{#each shown as group (group.family)}
		<NavSection label={FAMILY_LABEL[group.family]}>
			{#each group.entries as entry (entry.id)}
				<NavItem
					label={entry.name}
					href={pageOf(entry)}
					active={active === entry.id}
					badge={entry.count || undefined}
				/>
			{/each}
		</NavSection>
	{:else}
		<Text as="p" size="sm" tone="muted" class="demo-nav__empty">No component matches.</Text>
	{/each}
</nav>

<style>
	.demo-nav {
		display: flex;
		flex-direction: column;
		gap: var(--sp-2);
	}
	.demo-nav :global(.demo-nav__filter) {
		width: 100%;
	}
	.demo-nav :global(.demo-nav__empty) {
		padding: var(--sp-2);
	}
</style>
