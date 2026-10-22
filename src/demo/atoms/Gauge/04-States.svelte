<script module>
	export const meta = {
		title: 'Edge values',
		caption: 'Regression fixture: 0, exactly at each threshold, 100, values past the range and NaN all clamp to 0–100.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Gauge, Text } from '@dorsk/tsumikit';

	const cases = [
		{ v: 0, l: '0' },
		{ v: 69, l: '69' },
		{ v: 70, l: '70' },
		{ v: 89, l: '89' },
		{ v: 90, l: '90' },
		{ v: 100, l: '100' },
		{ v: 140, l: '140' },
		{ v: -20, l: '-20' },
		{ v: Number.NaN, l: 'NaN' },
	];
	const variants: ('continuous' | 'segments')[] = ['continuous', 'segments'];
</script>

{#each variants as variant (variant)}
	<Cluster gap="var(--sp-4)">
		{#each cases as c (c.l)}
			<span class="cell"><Gauge value={c.v} {variant} label="{variant} {c.l}" /><Text size="xs" tone="muted" numeric>{c.l}</Text></span>
		{/each}
	</Cluster>
{/each}

<style>
	.cell {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: var(--sp-1);
	}
</style>
