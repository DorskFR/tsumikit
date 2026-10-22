<script module>
	export const meta = {
		title: 'Tones, sizes and shapes',
		caption: 'tone or color sets the tint; border={false} is the soft fill; variant="text" drops the chip; size xs, sm, md; uppercase, mono, dot and icon decorate.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Cluster } from '@dorsk/tsumikit';

	const tones = ['neutral', 'ok', 'warn', 'danger', 'info', 'accent', 'muted', 'violet'] as const;
</script>

<Cluster>
	{#each tones as tone (tone)}<Badge {tone}>{tone}</Badge>{/each}
	<Badge color="hsl(160 60% 50%)">color</Badge>
</Cluster>
<Cluster>
	{#each tones as tone (tone)}<Badge {tone} border={false}>{tone}</Badge>{/each}
</Cluster>
<Cluster align="center">
	<Badge size="xs">xs</Badge>
	<Badge size="sm">sm</Badge>
	<Badge size="md">md</Badge>
	<Badge size="xs" tone="ok" numeric>8</Badge>
	<Badge size="sm" numeric>128</Badge>
	<Badge numeric tone="danger">1024</Badge>
</Cluster>
<Cluster>
	<Badge uppercase tone="ok" size="sm">stable</Badge>
	<Badge mono>~/projects/tsumikit</Badge>
	<Badge tone="info" variant="text" mono>text · 12:34</Badge>
	<Badge tone="ok" icon="check">passed</Badge>
	<Badge color="var(--role-system)" dot>system</Badge>
	<Badge tone="warn" dot border={false}>pending</Badge>
</Cluster>
