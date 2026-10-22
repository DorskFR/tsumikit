<script module>
	export const meta = {
		title: 'Size, tone, filled and spin',
		caption: 'size in px or 1em by default; tone uses the semantic palette; filled forces the solid form; spin rotates (halts under reduced motion).',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Icon, Text } from '@dorsk/tsumikit';

	const tones = ['neutral', 'accent', 'ok', 'info', 'warn', 'danger'] as const;
</script>

<Cluster align="center">
	<Icon name="star" size={12} />
	<Icon name="star" size={16} />
	<Icon name="star" size={24} />
	<Icon name="star" size={32} />
	<Icon name="star" size={48} />
	<Text size="2xl">text-sized <Icon name="star" /></Text>
</Cluster>
<Cluster align="center">
	{#each tones as tone (tone)}<Icon name="bell" {tone} size={24} label={tone} />{/each}
</Cluster>
<Cluster align="center">
	<Icon name="heart" size={24} />
	<Icon name="heart" size={24} filled tone="danger" />
	<Icon name="bookmark" size={24} />
	<Icon name="bookmark" size={24} filled />
	<Icon name="star" size={24} filled={false} />
	<Icon name="loader" size={24} spin label="Loading" />
</Cluster>
