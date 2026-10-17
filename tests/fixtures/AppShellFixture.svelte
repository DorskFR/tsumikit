<script lang="ts">
	import AppShell from '../../src/lib/components/layouts/AppShell.svelte';

	let {
		open = $bindable(false),
		closeOnNavigate = true,
		changes = [] as boolean[]
	}: {
		open?: boolean;
		closeOnNavigate?: boolean;
		changes?: boolean[];
	} = $props();
</script>

<AppShell bind:open {closeOnNavigate} onOpenChange={(next) => changes.push(next)}>
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
