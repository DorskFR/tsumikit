<script module>
	export const meta = {
		title: 'Variant × tone matrix',
		caption: 'Regression fixture: every variant against every tone; primary keeps a readable on-accent label.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster } from '@dorsk/tsumikit';

	const variants = ['default', 'primary', 'ghost', 'danger'] as const;
	const tones = ['none', 'accent', 'success', 'info', 'warn', 'danger'] as const;
</script>

{#each variants as variant (variant)}
	<Cluster>
		{#each tones as tone (tone)}
			<Button {variant} {tone}>{variant}/{tone}</Button>
		{/each}
	</Cluster>
{/each}
