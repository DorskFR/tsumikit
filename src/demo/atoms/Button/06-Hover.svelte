<script module>
	export const meta = {
		title: 'Hover effects',
		caption:
			'data-fx-hover on any ancestor picks the ambient hover (smoke is the default, none turns it off); the nearest one wins. Every press scales in fast and releases on a spring; ember sinks 1px instead. Fine pointers only.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Icon, Stack, Text } from '@dorsk/tsumikit';

	const variants = ['smoke', 'ember', 'aurora', 'none'] as const;
</script>

{#each variants as variant (variant)}
	<div data-fx-hover={variant}>
		<Stack gap="var(--sp-1)">
			<Text size="xs" tone="muted">data-fx-hover="{variant}"</Text>
			<Cluster>
				<Button variant="primary">Continue</Button>
				<Button>Preview</Button>
				<Button variant="danger">Delete</Button>
				<Button tone="success">Approve</Button>
				<Button icon variant="ghost" aria-label="Star"><Icon name="star" /></Button>
			</Cluster>
		</Stack>
	</div>
{/each}
