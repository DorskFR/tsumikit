<script lang="ts">
	import { AutoGrid, Card, Heading, Text } from '@dorsk/tsumikit';
	import { FAMILY_LABEL } from './catalog';
	import { demoFilter } from './filter.svelte';
	import { groups } from './registry';
	import { pageOf } from './routes';

	const shown = $derived(
		groups
			.map((g) => ({ ...g, entries: g.entries.filter((e) => demoFilter.visible.has(e.id)) }))
			.filter((g) => g.entries.length > 0)
	);
</script>

<div class="demo-index" data-demo-index>
	<Text as="p" tone="muted" measure="70ch">
		Svelte 5 components styled with plain CSS variables. Pick a component for its live examples,
		snippets and props.
	</Text>
	{#each shown as group (group.family)}
		<section class="demo-index__family" aria-labelledby="family-{group.family}">
			<Heading level={2} size="lg" id="family-{group.family}">{FAMILY_LABEL[group.family]}</Heading>
			<AutoGrid min="16rem" gap="var(--sp-3)">
				{#each group.entries as entry (entry.id)}
					<Card as="a" href={pageOf(entry)} padding="sm" gap="var(--sp-1)" class="demo-index__card">
						<Text weight="semibold">{entry.name}</Text>
						<Text as="p" size="sm" tone="muted">{entry.meta.description}</Text>
					</Card>
				{/each}
			</AutoGrid>
		</section>
	{:else}
		<Text as="p" tone="muted">No component matches.</Text>
	{/each}
</div>

<style>
	.demo-index,
	.demo-index__family {
		display: flex;
		flex-direction: column;
		gap: var(--sp-4);
	}
	.demo-index {
		gap: var(--sp-8);
	}
	:global(.demo-index__card) {
		color: inherit;
		text-decoration: none;
	}
</style>
