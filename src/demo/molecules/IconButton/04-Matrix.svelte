<script module>
	export const meta = {
		title: 'Variant × tone matrix',
		caption: 'Regression fixture: every variant against every tone, plain and as a chip.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, IconButton } from '@dorsk/tsumikit';

	const variants = ['ghost', 'default', 'primary', 'danger'] as const;
	const tones = ['none', 'accent', 'success', 'info', 'warn', 'danger'] as const;
</script>

{#each variants as variant (variant)}
	<Cluster align="center">
		{#each tones as tone (tone)}
			<IconButton icon="star" label="{variant} {tone}" {variant} {tone} />
		{/each}
		{#each tones as tone (tone)}
			<IconButton icon="star" label="{variant} {tone} chip" chip {variant} {tone} />
		{/each}
	</Cluster>
{/each}
