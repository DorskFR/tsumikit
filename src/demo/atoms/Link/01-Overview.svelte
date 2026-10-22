<script module>
	export const meta = {
		title: 'Links in prose and in a list',
		caption: 'underline="always" inside running text, the default hover underline for entity titles, and a button form for an in-page action.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Card, Cluster, Link, Stack, Text } from '@dorsk/tsumikit';
	import { services } from '../../fixtures';

	let shown = $state(3);
</script>

<Card maxWidth="30rem">
	<Stack gap="var(--sp-3)">
		<Text as="p">
			Alerts route through the <Link href="#link" underline="always">on-call schedule</Link>; edit it in the
			<Link href="https://github.com/DorskFR/tsumikit" target="_blank" rel="noreferrer" underline="always">infra repository</Link>.
		</Text>
		<Stack gap="var(--sp-1)">
			{#each services.slice(0, shown) as svc (svc.id)}
				<Cluster justify="space-between">
					<Link href="#link">{svc.name}</Link>
					<Text size="sm" tone="muted" mono>{svc.region}</Text>
				</Cluster>
			{/each}
		</Stack>
		{#if shown < services.length}
			<Link onclick={() => (shown = services.length)}>Show {services.length - shown} more services</Link>
		{:else}
			<Link tone="muted" onclick={() => (shown = 3)}>Show fewer</Link>
		{/if}
	</Stack>
</Card>
