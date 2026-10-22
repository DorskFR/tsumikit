<script module>
	export const meta = {
		title: 'Variants, segments and sizes',
		caption: 'variant="continuous" fills smoothly; "segments" lights bars bottom-up (segments sets how many); width/height resize the box.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Gauge, Text } from '@dorsk/tsumikit';

	const levels = [10, 35, 60, 75, 92, 100];
</script>

<Cluster gap="var(--sp-4)">
	{#each levels as v (v)}
		<span class="cell"><Gauge value={v} label="Continuous {v}%" /><Text size="xs" tone="muted" numeric>{v}%</Text></span>
	{/each}
</Cluster>
<Cluster gap="var(--sp-4)">
	{#each levels as v (v)}
		<span class="cell"><Gauge value={v} variant="segments" label="Segments {v}%" /><Text size="xs" tone="muted" numeric>{v}%</Text></span>
	{/each}
</Cluster>
<Cluster gap="var(--sp-4)" align="flex-end">
	<span class="cell"><Gauge value={70} variant="segments" segments={2} label="2 segments" /><Text size="xs" tone="muted">2 bars</Text></span>
	<span class="cell"><Gauge value={70} variant="segments" segments={5} label="5 segments" /><Text size="xs" tone="muted">5 bars</Text></span>
	<span class="cell"><Gauge value={70} variant="segments" segments={8} height="2.5rem" label="8 segments, tall" /><Text size="xs" tone="muted">8 bars</Text></span>
	<span class="cell"><Gauge value={55} width="1.5rem" height="3rem" label="Large continuous" /><Text size="xs" tone="muted">1.5 × 3 rem</Text></span>
	<span class="cell"><Gauge value={55} width="0.5rem" height="1rem" label="Tiny" /><Text size="xs" tone="muted">tiny</Text></span>
</Cluster>

<style>
	.cell {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: var(--sp-1);
	}
</style>
