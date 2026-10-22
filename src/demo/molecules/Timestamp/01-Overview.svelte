<script module>
	export const meta = {
		title: 'Deploy audit log',
		caption: 'mode="relative" keeps "3m ago" fresh (re-rendered every tickMs); click any time for UTC, local, zone and epoch. The detail column uses mode="short-iso" mono.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Avatar, Card, Text, Timestamp } from '@dorsk/tsumikit';

	const now = Date.now();
	const min = 60_000;
	const log = [
		{ who: 'Jun Tanaka', what: 'rolled back api-gateway to 3.14.1', at: now - 3 * min },
		{ who: 'CI', what: 'deployed api-gateway 3.14.2', at: now - 41 * min },
		{ who: 'Amara Okafor', what: 'approved the production release', at: now - 3 * 60 * min },
		{ who: 'Mateo Ruiz', what: 'merged fix/retry-budget', at: now - 26 * 60 * min }
	];
</script>

<Card padding="none">
	{#each log as e (e.at)}
		<div class="entry">
			<Avatar name={e.who} size={24} />
			<Text size="sm" grow><Text weight="semibold">{e.who}</Text> {e.what}</Text>
			<Timestamp value={e.at} mode="relative" size="sm" />
			<Timestamp value={e.at} mode="short-iso" mono size="xs" tone="faint" />
		</div>
	{/each}
</Card>

<style>
	.entry {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--sp-1) var(--sp-3);
		padding: var(--sp-2) var(--sp-3);
		border-bottom: 1px solid var(--border);
	}
</style>
