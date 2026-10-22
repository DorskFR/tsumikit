<script module>
	export const meta = {
		title: 'Tone × style matrix',
		caption: 'Regression fixture: every tone as outlined chip, soft fill, text variant and active button.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Cluster } from '@dorsk/tsumikit';

	const tones = ['neutral', 'ok', 'warn', 'danger', 'info', 'accent', 'muted', 'violet'] as const;
</script>

{#each tones as tone (tone)}
	<Cluster>
		<Badge {tone}>{tone}</Badge>
		<Badge {tone} border={false}>soft</Badge>
		<Badge {tone} variant="text">text</Badge>
		<Badge {tone} as="button" active>active</Badge>
		<Badge {tone} dot size="sm">dot</Badge>
		<Badge {tone} size="xs" numeric>42</Badge>
	</Cluster>
{/each}
