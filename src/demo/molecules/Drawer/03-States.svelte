<script module>
	export const meta = {
		title: 'Long content, custom header, mobile nav',
		caption: 'the body scrolls under a sticky footer; header replaces the title row; navMobile swaps the nav strip for a compact control under 48rem.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Button, Cluster, Drawer, Heading, IconButton, NavItem, Select, Text } from '@dorsk/tsumikit';
	import { services } from '../../fixtures';

	let which = $state<'long' | 'header' | 'mobile' | null>(null);
	let section = $state('summary');
	const close = () => (which = null);
	const rows = Array.from({ length: 12 }, (_, i) => services[i % services.length]);
</script>

<Cluster align="center">
	<Button size="sm" onclick={() => (which = 'long')}>Long content</Button>
	<Button size="sm" onclick={() => (which = 'header')}>Custom header</Button>
	<Button size="sm" onclick={() => (which = 'mobile')}>Mobile nav (narrow the window)</Button>
</Cluster>

<Drawer open={which === 'long'} onclose={close} title="Fleet" page="All services" icon="layout-grid" width="480px">
	<ul class="list">
		{#each rows as s, i (i)}
			<li><Text size="sm" mono>{s.name}</Text><Badge tone={s.status}>{s.status}</Badge><Text size="sm" tone="muted">{s.region}</Text></li>
		{/each}
	</ul>
	{#snippet footer()}<Text variant="caption" tone="faint">{rows.length} services</Text><span class="spacer"></span><Button onclick={close}>Close</Button>{/snippet}
</Drawer>
<Drawer open={which === 'header'} onclose={close} title="Incident" width="520px">
	{#snippet header()}
		<div class="head">
			<Badge tone="danger">SEV-1</Badge>
			<Heading level={2} size="md" truncate>Checkout latency above 2 s</Heading>
			<IconButton icon="x" label="Close panel" onclick={close} />
		</div>
	{/snippet}
	<Text>The header snippet owns the whole top row, including its own close control.</Text>
</Drawer>
<Drawer open={which === 'mobile'} onclose={close} title="Report" page={section} icon="file-text">
	{#snippet nav()}
		{#each ['summary', 'timeline', 'impact', 'actions'] as id (id)}
			<NavItem label={id} active={section === id} onclick={() => (section = id)} />
		{/each}
	{/snippet}
	{#snippet navMobile()}
		<Select bind:value={section} options={['summary', 'timeline', 'impact', 'actions'].map((v) => ({ value: v, label: v }))} />
	{/snippet}
	<Text>Section: {section}. On wide screens the pages sit in a column; under 48rem the Select above replaces the strip.</Text>
</Drawer>

<style>
	.list {
		display: grid;
		gap: var(--sp-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: grid;
		grid-template-columns: 1fr auto auto;
		align-items: center;
		gap: var(--sp-2);
		padding: var(--sp-2) 0;
		border-bottom: 1px solid var(--border);
	}
	.head {
		display: flex;
		flex: 1;
		align-items: center;
		gap: var(--sp-2);
		min-width: 0;
	}
	.spacer {
		flex: 1;
	}
</style>
