<script module>
	export const meta = {
		title: 'Numbers, measure and truncation',
		caption: 'numeric turns on tabular figures so the middle column lines up while the proportional one drifts; measure caps a paragraph width; truncate clips a heading to its box.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Heading, Text } from '@dorsk/tsumikit';

	const rows = [
		['api-gateway', 1234.5, 0.12],
		['worker-02', 87.25, 11.9],
		['postgres-primary', 15800, 3.04],
	] as const;
</script>

<div class="table">
	{#each rows as [name, mb, pct] (name)}
		<Text size="sm">{name}</Text>
		<Text size="sm" numeric>{mb.toFixed(2)} MB</Text>
		<Text size="sm">{pct.toFixed(2)}%</Text>
	{/each}
</div>
<Text as="p" measure="40ch">
	A paragraph capped at forty characters per line stays readable on a wide screen, where unconstrained body text would run far past a comfortable measure.
</Text>
<div style="width: 220px">
	<Heading level={4} truncate>Truncated heading that runs past its container</Heading>
</div>

<style>
	.table {
		display: grid;
		grid-template-columns: auto auto auto;
		gap: var(--sp-1) var(--sp-4);
		justify-content: start;
	}
	.table :global(:nth-child(3n + 2)) {
		text-align: right;
	}
</style>
