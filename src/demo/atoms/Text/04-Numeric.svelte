<script module>
	export const meta = {
		title: 'Tabular figures and font scale',
		caption: 'numeric keeps digits the same width as a counter ticks; scale={false} pins a size against the toolbar font-scale picker.'
	};
</script>

<script lang="ts">
	import { Card, Stack, Text } from '@dorsk/tsumikit';
	import { onMount } from 'svelte';

	let elapsed = $state(1_201.5);
	onMount(() => {
		const id = setInterval(() => (elapsed += 0.1), 100);
		return () => clearInterval(id);
	});
	const shown = $derived(elapsed.toFixed(1));
</script>

<Card padding="sm">
	<Stack gap="var(--sp-1)">
		<Text variant="caption" tone="muted">Build time</Text>
		<Text size="xl" weight="semibold" numeric>{shown}s</Text>
		<Text size="xl" weight="semibold" tone="muted">{shown}s</Text>
	</Stack>
</Card>
<Card padding="sm">
	<Stack gap="var(--sp-1)">
		<Text size="lg">Follows the font-scale picker</Text>
		<Text size="lg" scale={false}>Pinned to its unscaled size</Text>
	</Stack>
</Card>
