<script module>
	export const meta = {
		title: 'States',
		caption: 'disabled ignores the gesture; a rejected onrefresh still clears the spinner (handle the error yourself); an empty list can still be pulled.'
	};
</script>

<script lang="ts">
	import { Callout, EmptyState, PullToRefresh, Text } from '@dorsk/tsumikit';

	let error = $state('');
	async function failing() {
		error = '';
		await new Promise((r) => setTimeout(r, 800));
		error = 'Network unreachable. Pull again to retry.';
	}
</script>

<div class="frame">
	<PullToRefresh style="height: 100%" disabled>
		<div class="pane"><Text size="sm">Disabled while offline sync runs.</Text></div>
	</PullToRefresh>
</div>
<div class="frame">
	<PullToRefresh style="height: 100%" onrefresh={failing}>
		<div class="pane">
			{#if error}<Callout tone="danger">{error}</Callout>{:else}<Text size="sm">Pull to trigger a failing fetch.</Text>{/if}
		</div>
	</PullToRefresh>
</div>
<div class="frame">
	<PullToRefresh style="height: 100%" onrefresh={() => new Promise((r) => setTimeout(r, 600))}>
		<EmptyState size="inline" title="No new orders" description="Pull down to check again." />
	</PullToRefresh>
</div>

<style>
	.frame {
		flex: 1 1 12rem;
		height: 9rem;
		border: 1px solid var(--border);
		border-radius: var(--r-md);
		overflow: hidden;
	}
	.pane {
		padding: var(--sp-3);
	}
</style>
