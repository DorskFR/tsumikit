<script module>
	export const meta = {
		title: 'Busy, dismissible, actions, long content and narrow containers',
		caption: 'busy swaps the glyph for a Spinner; dismissible + ondismiss; actions wrap under the body when the container is narrow.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Callout, Cluster, toasts } from '@dorsk/tsumikit';

	let shown = $state(true);
</script>

<Callout tone="info" busy>Reindexing 1,204 documents, this usually takes about a minute…</Callout>
{#if shown}
	<Callout tone="ok" title="Export ready" dismissible dismissLabel="Hide" ondismiss={() => (shown = false)}>
		report-2026-10.csv (402 KB) is ready to download.
		{#snippet actions()}<Button size="sm" variant="primary">Download</Button>{/snippet}
	</Callout>
{:else}
	<Button size="sm" variant="ghost" onclick={() => (shown = true)}>Show the dismissed callout again</Button>
{/if}
<Callout tone="danger" title="Search failed" dismissible ondismiss={() => toasts.show('Dismissed')}>
	The provider returned 503 Service Unavailable three times in a row. Requests are paused for 60 seconds; results already fetched are kept and the queue resumes automatically, or you can retry now.
	{#snippet actions()}
		<Button size="sm" variant="ghost">View log</Button>
		<Button size="sm" variant="danger">Retry</Button>
	{/snippet}
</Callout>
<Cluster align="start">
	<div class="narrow">
		<Callout tone="warn" title="Narrow container" dismissible>
			Wraps its body and actions instead of overflowing.
			{#snippet actions()}<Button size="sm">Action</Button>{/snippet}
		</Callout>
	</div>
	<div class="narrow">
		<Callout>No title, no icon override, just a body.</Callout>
	</div>
</Cluster>

<style>
	.narrow {
		width: min(100%, 16rem);
	}
</style>
