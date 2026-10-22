<script lang="ts">
	import type { Snippet } from 'svelte';
	import { AppShell, Heading, Text } from '@dorsk/tsumikit';
	import DemoNav from './DemoNav.svelte';
	import DemoSection from './DemoSection.svelte';
	import DemoToolbar from './DemoToolbar.svelte';
	import { aimAtHash, followHashes, sectionOf } from './hash';
	import { wake } from './lazy';
	import { entries, searchText } from './registry';
	import { createScrollspy } from './scrollspy.svelte';

	let { toolbar }: { toolbar?: Snippet } = $props();

	let filter = $state('');
	let navOpen = $state(false);
	const query = $derived(filter.trim().toLowerCase());
	const visible = $derived(
		new Set(entries.filter((e) => !query || searchText(e).includes(query)).map((e) => e.id))
	);

	const spy = createScrollspy({
		sections: () =>
			[...document.querySelectorAll<HTMLElement>('[data-demo-section]')].filter((el) => !el.hidden),
		line: () =>
			(document.querySelector('[data-tsu="AppShell"] > header')?.getBoundingClientRect().height ?? 0) + 48,
		deps: () => visible
	});

	$effect(() => {
		document
			.querySelector(`[data-demo-nav] a[href="#${spy.active}"]`)
			?.scrollIntoView({ block: 'nearest' });
	});

	$effect(() => {
		const reach = (id: string) => wake(sectionOf(id));
		aimAtHash(reach);
		return followHashes(reach);
	});
</script>

<AppShell
	bind:open={navOpen}
	stickySidebar
	resizableSidebar
	minSidebar={160}
	maxSidebar={360}
	sidebarWidthKey="tsumikit-demo-sidebar"
	navLabel="Components"
>
	{#snippet header()}
		<Heading level={1} size="md"><a href="#top" class="demo-brand">@dorsk/tsumikit</a></Heading>
		<Text variant="caption" tone="muted" class="cq-hide">Svelte 5 · pure CSS · zero deps</Text>
		<DemoToolbar extras={toolbar} />
	{/snippet}

	{#snippet sidebar()}
		<DemoNav bind:filter active={spy.active} {visible} />
	{/snippet}

	<div class="demo-page" id="top">
		{#each entries as entry (entry.id)}
			<DemoSection {entry} hidden={!visible.has(entry.id)} />
		{/each}
		<footer class="demo-footer">
			<Text variant="caption" tone="muted">MIT · @dorsk/tsumikit</Text>
		</footer>
	</div>
</AppShell>

<style>
	.demo-brand {
		color: inherit;
		text-decoration: none;
		white-space: nowrap;
	}
	:global(.demo-toolbar) {
		flex: 1 1 0;
		justify-content: flex-end;
	}
	@media (max-width: 40rem) {
		:global(.shell-header .cq-hide) {
			display: none;
		}
	}
	.demo-page {
		display: flex;
		flex-direction: column;
		gap: var(--sp-8);
		padding: var(--sp-4) max(var(--sp-4), var(--safe-right)) var(--sp-8) max(var(--sp-4), var(--safe-left));
		max-width: 72rem;
	}
	.demo-footer {
		margin-top: max(var(--sp-6), 60dvh);
		padding-top: var(--sp-4);
		border-top: 1px solid var(--border);
	}
</style>
