<script module>
	export const meta = {
		title: 'Tones and weights',
		caption: 'tone default/muted/faint plus the semantic accent, info, success, warn and danger; weight normal → bold; italic and uppercase modifiers.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Text } from '@dorsk/tsumikit';

	const tones = ['default', 'muted', 'faint', 'accent', 'info', 'success', 'warn', 'danger'] as const;
	const weights = ['normal', 'medium', 'semibold', 'bold'] as const;
</script>

<Cluster gap="var(--sp-4)">
	{#each tones as tone (tone)}
		<Text {tone} weight="medium">{tone}</Text>
	{/each}
</Cluster>
<Cluster gap="var(--sp-4)">
	{#each weights as weight (weight)}
		<Text {weight}>{weight}</Text>
	{/each}
</Cluster>
<Cluster gap="var(--sp-4)">
	<Text italic>italic</Text>
	<Text uppercase size="sm" weight="semibold">uppercase</Text>
	<Text leading="none" size="lg">leading none</Text>
	<Text nowrap>nowrap text that refuses to break</Text>
</Cluster>
