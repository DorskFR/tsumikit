<script module>
	export const meta = {
		title: 'Fleet list with quota gauges',
		caption: 'value is a percentage; the tone flips to warn at 70 and danger at 90 by default; label is the accessible name.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Gauge, Stack, Text } from '@dorsk/tsumikit';
	import { services } from '../../fixtures';

	const memPct = (mb: number) => Math.round((mb / 16384) * 100);
</script>

<Stack gap="var(--sp-2)" style="max-width: 30rem">
	{#each services as s (s.id)}
		<div class="row">
			<Text weight="medium" truncate style="flex: 1 1 0; min-width: 0">{s.name}</Text>
			<Badge size="sm" tone="neutral">{s.region}</Badge>
			<span class="cell"><Text size="xs" tone="muted">cpu</Text><Gauge value={s.cpu} label="CPU {s.cpu}%" /></span>
			<span class="cell"><Text size="xs" tone="muted">mem</Text><Gauge value={memPct(s.memoryMb)} variant="segments" segments={4} label="Memory {memPct(s.memoryMb)}%" /></span>
		</div>
	{/each}
</Stack>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: var(--sp-3);
	}
	.cell {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
	}
</style>
