<script module>
	export const meta = {
		title: 'Accent loaders in context',
		caption: 'comet, breath, morph and sweep inherit the accent from the surrounding Text; each pairs a status line with the state it waits on.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Card, Cluster, Spinner, Text } from '@dorsk/tsumikit';

	const rows = [
		['comet', 'Syncing library…'],
		['breath', 'Fetching 42 items'],
		['morph', 'Rendering preview'],
		['sweep', 'Connecting to server']
	] as const;
</script>

<Card maxWidth="22rem">
	{#each rows as [variant, status] (variant)}
		<Cluster gap="var(--sp-3)" align="center">
			<Text tone="accent"><Spinner {variant} size={22} label="Loading ({variant})" /></Text>
			<Text size="sm" tone="muted">{status}</Text>
		</Cluster>
	{/each}
</Card>
