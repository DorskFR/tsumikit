<script module>
	export const meta = {
		title: 'Padding, surface, border and tone',
		caption: 'padding none, sm, md, lg; surface base, raised, sunken; border solid, dashed, none; tone tints the frame for inline banners, attention adds a left bar.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Card, Cluster, Text } from '@dorsk/tsumikit';

	const paddings = ['none', 'sm', 'md', 'lg'] as const;
	const surfaces = ['base', 'raised', 'sunken'] as const;
	const borders = ['solid', 'dashed', 'none'] as const;
	const tones = ['neutral', 'info', 'ok', 'warn', 'danger', 'attention'] as const;
</script>

<Cluster align="stretch">
	{#each paddings as padding (padding)}<Card {padding}><Text size="sm">padding {padding}</Text></Card>{/each}
</Cluster>
<Cluster align="stretch">
	{#each surfaces as surface (surface)}<Card {surface} padding="sm"><Text size="sm">surface {surface}</Text></Card>{/each}
	{#each borders as border (border)}<Card {border} surface="sunken" padding="sm"><Text size="sm">border {border}</Text></Card>{/each}
</Cluster>
<Cluster align="stretch">
	{#each tones as tone (tone)}<Card {tone} padding="sm"><Text size="sm">tone {tone}</Text></Card>{/each}
</Cluster>
