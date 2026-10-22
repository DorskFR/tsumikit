<script module>
	export const meta = {
		title: 'Overlay run details drawer',
		caption: 'mode="overlay" fixes the panel to the viewport edge above a scrim; Escape or the scrim closes it; under fullWidthBelow="40rem" it spans the screen.',
		layout: 'row'
	};
</script>

<script lang="ts">
	import { Badge, Button, Heading, ResizablePanel, Stack, Text } from '@dorsk/tsumikit';

	let open = $state(false);
</script>

<Button onclick={() => (open = true)}>Open run details</Button>
<ResizablePanel
	mode="overlay"
	side="right"
	label="Run details"
	bind:open
	width={380}
	minWidth={280}
	maxWidth="90vw"
	fullWidthBelow="40rem"
	collapseControl
>
	{#snippet panel()}
		<Stack style="padding: var(--sp-4)">
			<Heading level={3} size="md">nightly-e2e #482</Heading>
			<Badge tone="danger">2 failed</Badge>
			<Text size="sm" tone="muted">checkout.spec.ts › applies a promo code</Text>
			<Text size="sm" tone="muted">search.spec.ts › paginates past 10k results</Text>
			<Button variant="ghost" onclick={() => (open = false)}>Close</Button>
		</Stack>
	{/snippet}
</ResizablePanel>
