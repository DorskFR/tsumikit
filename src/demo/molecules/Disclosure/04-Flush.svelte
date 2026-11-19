<script module>
	export const meta = {
		title: 'Flush',
		caption: 'flush drops the padding around the header and the panel, so both line up with the surrounding content.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Card, Disclosure, Text } from '@dorsk/tsumikit';
</script>

<Card>
	<Text weight="semibold">Deploy 4f2a91c</Text>
	<Text size="sm" tone="muted">Finished in 2m 14s on edge-eu-1.</Text>
	<Disclosure flush open>
		{#snippet header()}<span>Build log</span>{/snippet}
		<Text size="sm" tone="muted">The header and this text share the card's left edge.</Text>
	</Disclosure>
	<Disclosure flush size="compact">
		{#snippet header()}<span>Environment</span>{/snippet}
		<Text size="xs" tone="muted">flush also applies to the compact size.</Text>
	</Disclosure>
</Card>
