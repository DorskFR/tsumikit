<script module>
	export const meta = {
		title: 'Loading, error with retry, first run, custom action',
		caption: 'loading swaps the chip for a Spinner; the action snippet replaces the built-in button; description can be a snippet.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Button, Card, Cluster, EmptyState, Link, toasts } from '@dorsk/tsumikit';

	let loading = $state(true);
	let failed = $state(false);
	$effect(() => {
		if (!loading) return;
		const t = setTimeout(() => { loading = false; failed = true; }, 1800);
		return () => clearTimeout(t);
	});
</script>

<Card>
	{#if loading}
		<EmptyState loading title="Loading sessions…" description="Fetching from three machines." />
	{:else if failed}
		<EmptyState icon="warning" tone="danger" title="Could not load sessions" description="The daemon on build-03 did not answer within 10 s.">
			{#snippet action()}
				<Cluster>
					<Button variant="ghost" onclick={() => toasts.show('Opened the log')}>View log</Button>
					<Button variant="primary" onclick={() => { failed = false; loading = true; }}>Retry</Button>
				</Cluster>
			{/snippet}
		</EmptyState>
	{/if}
</Card>
<Card>
	<EmptyState icon="plus" tone="accent" title="Create your first dashboard">
		{#snippet description()}
			Pin a metric, a table or a chart. Read the <Link href="#empty-state">quick start</Link> or import one from a template.
		{/snippet}
		{#snippet action()}
			<Cluster>
				<Button>Import template</Button>
				<Button variant="primary">New dashboard</Button>
			</Cluster>
		{/snippet}
	</EmptyState>
</Card>
<Card>
	<EmptyState
		icon="search"
		title="No results for “quarterly revenue forecast across all regional subsidiaries 2026”"
		description="Long titles wrap inside the centred column and the description keeps its measure, so a verbose query never pushes the action off the card on a phone."
		actionLabel="Clear search"
		onAction={() => toasts.show('Cleared')}
	/>
</Card>
