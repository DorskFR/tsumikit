<script lang="ts">
	import type { Snippet } from 'svelte';
	import { AppShell, Heading, LOOKS, SelectButton, Text, theme } from '@dorsk/tsumikit';
	import { base } from '$app/paths';
	import DemoNav from './DemoNav.svelte';
	import DemoToolbar from './DemoToolbar.svelte';

	let { toolbar, active = '', children }: { toolbar?: Snippet; active?: string; children?: Snippet } =
		$props();

	const looks = LOOKS.map((l) => ({
		value: l.id,
		label: l.status === 'experimental' ? `${l.label} (beta)` : l.label
	}));
	const lookLabel = $derived(LOOKS.find((l) => l.id === theme.look)?.label ?? theme.look);

	let navOpen = $state(false);

	$effect(() => {
		if (active) document.querySelector('[data-demo-nav] [aria-current="page"]')?.scrollIntoView({ block: 'nearest' });
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
		<Heading level={1} size="md"><a href="{base}/" class="demo-brand">@dorsk/tsumikit</a></Heading>
		<Text variant="caption" tone="muted" class="cq-hide">Svelte 5 · pure CSS · zero deps</Text>
		<DemoToolbar extras={toolbar} />
	{/snippet}

	{#snippet sidebar()}
		<div class="demo-drawer-look">
			<SelectButton
				variant="row"
				block
				icon="layout-grid"
				label="Look: {lookLabel}"
				value={theme.look}
				options={looks}
				onchange={(v) => theme.setLook(v)}
			/>
		</div>
		<DemoNav {active} />
	{/snippet}

	<div class="demo-page">
		{@render children?.()}
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
	.demo-drawer-look {
		display: none;
	}
	@media (max-width: 40rem) {
		:global(.shell-header .cq-hide) {
			display: none;
		}
		.demo-drawer-look {
			display: block;
			margin-bottom: var(--sp-3);
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
