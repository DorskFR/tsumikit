<script lang="ts">
	import { Badge, Cluster, Heading, Link, Text } from '@dorsk/tsumikit';
	import Example from './Example.svelte';
	import PropsTable from './PropsTable.svelte';
	import type { DemoEntry, SectionContent } from './registry';
	import { pathOf } from './routes';

	let { entry, content }: { entry: DemoEntry; content: SectionContent } = $props();
</script>

<section id={entry.id} class="demo-section" data-demo-section>
	<header class="demo-section__head">
		<Heading level={2} size="xl"><a href="#{entry.id}">{entry.name}</a></Heading>
		<Badge size="sm" uppercase>{entry.family}</Badge>
	</header>
	{#if entry.meta.description}
		<Text as="p" tone="muted" measure="70ch">{entry.meta.description}</Text>
	{/if}
	{#if entry.meta.seeAlso?.length}
		<Cluster class="demo-section__see-also">
			<Text size="sm" tone="muted">See also</Text>
			{#each entry.meta.seeAlso as ref (ref)}
				<Link href={pathOf(ref)}>{ref}</Link>
			{/each}
		</Cluster>
	{/if}
	{#each content.examples as example (example.id)}
		<Example {example} />
	{/each}
	<PropsTable {entry} rows={content.props} />
</section>

<style>
	.demo-section {
		display: flex;
		flex-direction: column;
		gap: var(--sp-4);
	}
	.demo-section__head {
		display: flex;
		align-items: baseline;
		gap: var(--sp-3);
		padding-top: var(--sp-4);
		border-top: 1px solid var(--border);
	}
	.demo-section__head a {
		color: inherit;
		text-decoration: none;
	}
	@media (hover: hover) and (pointer: fine) {
		.demo-section__head a:hover {
			text-decoration: underline;
		}
	}
	:global(.demo-section__see-also) {
		margin-top: calc(-1 * var(--sp-2));
	}
	@media (pointer: coarse) {
		:global(.demo-section__see-also > a) {
			display: inline-flex;
			align-items: center;
			min-height: 24px;
		}
	}
</style>
