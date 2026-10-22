<script module>
	export const meta = {
		title: 'Accent colour picker',
		caption: 'interactive renders buttons, selected mirrors aria-pressed, label names each colour, a child glyph marks the automatic option.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Cluster, Swatch, Text } from '@dorsk/tsumikit';
	import { PALETTE } from './data';

	let picked = $state(PALETTE[1].value);
	const current = $derived(PALETTE.find((p) => p.value === picked) ?? PALETTE[0]);
</script>

<Text variant="label">Accent colour</Text>
<Cluster role="group" aria-label="Accent colour">
	<Swatch color="var(--bg-elevated)" size="lg" interactive label="Follow system" selected={picked === 'auto'} onclick={() => (picked = 'auto')}>A</Swatch>
	{#each PALETTE as c (c.value)}
		{#if c.value !== 'auto'}
			<Swatch color={c.value} size="lg" interactive label={c.name} selected={picked === c.value} onclick={() => (picked = c.value)} />
		{/if}
	{/each}
</Cluster>
<Cluster gap="var(--sp-2)">
	<Text size="sm" tone="muted">Selected</Text>
	<Badge color={picked === 'auto' ? undefined : picked} mono size="sm">{current.name}</Badge>
</Cluster>
