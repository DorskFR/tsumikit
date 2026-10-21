<script lang="ts">
	import { Badge, Callout, Cluster, Heading, Link, Text } from '@dorsk/tsumikit';
	import { base } from '$app/paths';
	import Example from './Example.svelte';
	import { SHELL_ONLY } from './catalog';
	import { type DemoEntry, resolveRef } from './registry';

	let { entry, hidden = false }: { entry: DemoEntry; hidden?: boolean } = $props();
</script>

<section id={entry.id} class="demo-section" data-demo-section {hidden}>
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
	{#if entry.stub}
		<Callout tone="info" title="Not migrated yet">
			{#if entry.legacyId}
				Shown on the <Link href="{base}/legacy#{entry.legacyId}">legacy showcase</Link>.
			{:else if SHELL_ONLY.has(entry.name)}
				Shown on the <Link href="{base}/shell">AppShell page</Link>.
			{:else}
				No example exists for this component yet.
			{/if}
		</Callout>
	{:else}
		{#each entry.examples as example (example.id)}
			<Example {example} />
		{/each}
	{/if}
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
	.demo-section__head a:hover {
		text-decoration: underline;
	}
	:global(.demo-section__see-also) {
		margin-top: calc(-1 * var(--sp-2));
	}
</style>
