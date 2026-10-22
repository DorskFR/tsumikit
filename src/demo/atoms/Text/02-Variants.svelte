<script module>
	export const meta = {
		title: 'Variants, tones, weights and sizes',
		caption: 'variant picks a preset; tone, weight and size override one axis each.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Stack, Text } from '@dorsk/tsumikit';

	const tones = ['default', 'muted', 'faint', 'accent', 'success', 'info', 'warn', 'danger'] as const;
	const weights = ['normal', 'medium', 'semibold', 'bold'] as const;
	const sizes = ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl'] as const;
</script>

<Stack gap="var(--sp-1)">
	<Text variant="body">Body: the default reading text for paragraphs and descriptions.</Text>
	<Text variant="label">Label: names a field or a control</Text>
	<Text variant="caption">Caption: small meta text under a value</Text>
	<Text variant="code">Code: inline identifier chip</Text>
	<Text variant="eyebrow">Eyebrow: section kicker</Text>
</Stack>
<Cluster>
	{#each tones as tone (tone)}<Text {tone} weight="medium">{tone}</Text>{/each}
</Cluster>
<Cluster>
	{#each weights as weight (weight)}<Text {weight}>{weight}</Text>{/each}
</Cluster>
<Cluster align="baseline">
	{#each sizes as size (size)}<Text {size}>{size}</Text>{/each}
</Cluster>
