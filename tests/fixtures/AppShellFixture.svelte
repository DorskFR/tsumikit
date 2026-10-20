<script lang="ts">
	import AppShell from '../../src/lib/components/layouts/AppShell.svelte';

	let {
		open = $bindable(false),
		closeOnNavigate = true,
		changes = [] as boolean[],
		resizableSidebar = false,
		sidebarWidthKey = undefined as string | undefined
	}: {
		open?: boolean;
		closeOnNavigate?: boolean;
		changes?: boolean[];
		resizableSidebar?: boolean;
		sidebarWidthKey?: string;
	} = $props();
</script>

<AppShell
	bind:open
	{closeOnNavigate}
	{resizableSidebar}
	{sidebarWidthKey}
	minSidebar={100}
	maxSidebar={300}
	onOpenChange={(next) => changes.push(next)}
>
	{#snippet header()}
		<input data-test="search" aria-label="Search" />
	{/snippet}
	{#snippet sidebar()}
		<nav>
			<a href="/activity" data-test="local"><span>Activity</span></a>
			<a href="#settings" data-test="hash">Settings</a>
			<a href="https://elsewhere.test/docs" data-test="external">Docs</a>
			<a href="/report.pdf" download data-test="download">Report</a>
			<a href="/popup" target="_blank" data-test="blank">Popup</a>
			<button type="button" data-test="button">Not a link</button>
		</nav>
	{/snippet}
	<p>main</p>
</AppShell>
