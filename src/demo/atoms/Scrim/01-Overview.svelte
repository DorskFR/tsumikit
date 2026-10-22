<script module>
	export const meta = {
		title: 'Custom side panel',
		caption: 'onclose fires on a click anywhere on the scrim and on Escape; the panel is yours. The stage contains the fixed scrim so the demo stays inside its frame.',
		layout: 'frame',
		height: '20rem'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Heading, Scrim, Stack, Text } from '@dorsk/tsumikit';

	let open = $state(false);
</script>

<div class="stage">
	<Stack gap="var(--sp-3)" style="padding: var(--sp-4)">
		<Heading level={3} size="md">Deploy history</Heading>
		<Text size="sm" tone="muted">12 deploys this week, 1 rolled back.</Text>
		<Button variant="primary" onclick={() => (open = true)}>Open filters</Button>
	</Stack>
	{#if open}
		<Scrim onclose={() => (open = false)} />
		<aside class="panel" aria-label="Filters">
			<Heading level={3} size="sm">Filters</Heading>
			<Text size="sm" tone="muted">Click the dimmed area or press Escape to close.</Text>
			<Cluster justify="flex-end">
				<Button size="sm" variant="ghost" onclick={() => (open = false)}>Done</Button>
			</Cluster>
		</aside>
	{/if}
</div>

<style>
	.stage {
		position: relative;
		height: 100%;
		min-height: 20rem;
		contain: layout paint;
	}
	.panel {
		position: absolute;
		inset: 0 0 0 auto;
		width: min(18rem, 80%);
		display: grid;
		align-content: start;
		gap: var(--sp-3);
		padding: var(--sp-4);
		background: var(--bg-elevated);
		border-left: 1px solid var(--border);
		z-index: calc(var(--z-drawer) + 1);
	}
</style>
