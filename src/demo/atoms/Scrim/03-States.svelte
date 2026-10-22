<script module>
	export const meta = {
		title: 'Hidden on phones and stacked scrims',
		caption: 'hideBelow skips the scrim under a viewport width for full-bleed mobile panels; with two open, Escape closes only the topmost.',
		layout: 'frame',
		height: '18rem'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Scrim, Text } from '@dorsk/tsumikit';

	let first = $state(false);
	let second = $state(false);
</script>

<div class="stage">
	<Cluster style="padding: var(--sp-4)">
		<Button size="sm" onclick={() => (first = true)}>Open first</Button>
		<Text size="sm" tone="muted">The first scrim is skipped under 40rem viewports.</Text>
	</Cluster>
	{#if first}
		<Scrim onclose={() => (first = false)} hideBelow="40rem" />
		<div class="panel one">
			<Text weight="medium">First layer</Text>
			<Button size="sm" onclick={() => (second = true)}>Open second</Button>
		</div>
	{/if}
	{#if second}
		<Scrim onclose={() => (second = false)} z="var(--z-modal)" />
		<div class="panel two">
			<Text weight="medium">Second layer</Text>
			<Text size="sm" tone="muted">Escape closes this one first.</Text>
		</div>
	{/if}
</div>

<style>
	.stage {
		position: relative;
		height: 100%;
		min-height: 18rem;
		contain: layout paint;
	}
	.panel {
		position: absolute;
		display: grid;
		gap: var(--sp-2);
		padding: var(--sp-4);
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--r-md);
	}
	.one {
		inset: var(--sp-6) var(--sp-6) auto auto;
		z-index: calc(var(--z-drawer) + 1);
	}
	.two {
		inset: auto auto var(--sp-6) var(--sp-6);
		z-index: calc(var(--z-modal) + 1);
	}
</style>
