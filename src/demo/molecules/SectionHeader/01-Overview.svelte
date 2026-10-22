<script module>
	export const meta = {
		title: 'Sessions dashboard',
		caption: 'title, subtitle, count, divider and an actions snippet over a list; a second header groups by host with hue and collapsible.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Button, Dot, SectionHeader, Text } from '@dorsk/tsumikit';
	import { services } from '../../fixtures';

	let blockedOpen = $state(true);
	const blocked = services.filter((s) => s.status !== 'ok');
</script>

<SectionHeader title="Recent sessions" subtitle="last 24h" count={services.length} divider>
	{#snippet actions()}
		<Button size="sm">View all</Button>
	{/snippet}
</SectionHeader>
<SectionHeader label="Blocked" count={blocked.length} uppercase hue={12} level={3} size="sm" collapsible bind:open={blockedOpen}>
	<ul class="rows">
		{#each blocked as s (s.id)}
			<li>
				<Dot status={s.status === 'danger' ? 'dead' : 'stale'} />
				<Text size="sm" mono>{s.name}</Text>
				<Badge size="xs" tone={s.status}>{s.status}</Badge>
			</li>
		{/each}
	</ul>
</SectionHeader>

<style>
	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--sp-1);
	}
	li {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
	}
</style>
