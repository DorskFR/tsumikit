<script module>
	export const meta = {
		title: 'Gap and divider',
		caption: 'gap spaces the columns and divider="none" drops the seam so each pane can be its own Card; --md-divider restyles the seam instead.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Card, MasterDetail, NavItem, Stack, Text } from '@dorsk/tsumikit';
	import { services } from '../../fixtures';

	let picked = $state<number | null>(2);
	const service = $derived(services.find((s) => s.id === picked));
</script>

<MasterDetail
	gap="var(--sp-4)"
	divider="none"
	listWidth="14rem"
	breakpoint="30rem"
	selected={service !== undefined}
	onback={() => (picked = null)}
	style="height: 15rem"
>
	{#snippet list()}
		<Card padding="sm">
			<Stack gap="0">
				{#each services as s (s.id)}
					<NavItem label={s.name} active={s.id === picked} onclick={() => (picked = s.id)} />
				{/each}
			</Stack>
		</Card>
	{/snippet}
	{#snippet detail()}
		<Card title={service?.name} subtitle={service?.region}>
			<Text size="sm" tone="muted">CPU {service?.cpu}% · {service?.memoryMb} MB · up {service?.uptimeDays} days</Text>
		</Card>
	{/snippet}
	{#snippet empty()}
		<Card border="dashed"><Text tone="muted">Pick a service.</Text></Card>
	{/snippet}
</MasterDetail>
<MasterDetail
	listWidth="12rem"
	breakpoint="30rem"
	selected
	style="height: 7rem; border: 1px solid var(--border); border-radius: var(--r-md); --md-divider: 2px dashed var(--accent)"
>
	{#snippet list()}
		<Text size="sm" style="padding: var(--sp-3)">--md-divider: 2px dashed var(--accent)</Text>
	{/snippet}
	{#snippet detail()}
		<Text size="sm" tone="muted" style="padding: var(--sp-3)">Detail column</Text>
	{/snippet}
</MasterDetail>
