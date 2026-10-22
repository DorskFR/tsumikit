<script lang="ts">
	import { Badge, Cluster, Heading, Link, Text } from '@dorsk/tsumikit';
	import Example from './Example.svelte';
	import { SSR, defer, startsLive } from './lazy';
	import { type DemoEntry, resolveRef } from './registry';

	let { entry, hidden = false }: { entry: DemoEntry; hidden?: boolean } = $props();

	let section: HTMLElement;
	// svelte-ignore state_referenced_locally
	let live = $state(startsLive(entry.id));
	$effect(() => {
		if (!live) return defer(section, () => (live = true));
	});
</script>

{#snippet examples()}
	<div class="demo-section__examples">
		{#each entry.examples as example (example.id)}
			<Example {example} />
		{/each}
	</div>
{/snippet}

{#snippet dormant()}
	<div class="demo-section__examples"></div>
{/snippet}

<section
	bind:this={section}
	id={entry.id}
	class="demo-section"
	data-demo-section
	data-demo-live={live && !SSR ? '' : undefined}
	{hidden}
>
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
				<Link href="#{resolveRef(ref)}">{ref}</Link>
			{/each}
		</Cluster>
	{/if}
	{@render (live ? examples : dormant)()}
</section>

<style>
	.demo-section {
		display: flex;
		flex-direction: column;
		gap: var(--sp-4);
		scroll-margin-top: calc(var(--header-h) + var(--sp-4));
		content-visibility: auto;
		contain-intrinsic-size: auto 600px;
	}
	.demo-section__examples {
		display: contents;
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
</style>
