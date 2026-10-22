<script module>
	export const meta = {
		title: 'Incident triage queue',
		caption: 'onreorder hands back the new key order; locked keeps the incident in progress pinned and canMove stops anything landing above it; bind:selected opens a row.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Card, SortableList, Text } from '@dorsk/tsumikit';
	import { incidents, severityTone, type Incident } from './data';

	let queue = $state([...incidents]);
	let selected = $state<string>();
	let last = $state('');
</script>

<Card padding="sm" class="cq">
	<SortableList
		items={queue}
		key={(i) => i.id}
		name={(i) => i.title}
		label="Incident priority"
		numbered
		locked={(i) => !!i.active}
		canMove={(_key, to) => to > 0}
		bind:selected
		onreorder={(keys, move) => {
			queue = keys.map((k) => queue.find((i) => i.id === k) as Incident);
			last = `${move.key} moved ${move.from + 1} → ${move.to + 1}`;
		}}
	>
		{#snippet row(i)}
			<span class="incident">
				<Text size="sm" truncate grow>{i.title}</Text>
				<Text size="xs" tone="muted" mono truncate>{i.service}</Text>
			</span>
		{/snippet}
		{#snippet trailing(i)}
			<Badge size="xs" tone={i.active ? 'accent' : severityTone[i.severity]}>{i.active ? 'working' : i.severity}</Badge>
		{/snippet}
	</SortableList>
</Card>
<Text size="xs" tone="muted">Open: {selected ?? 'none'} · {last || 'drag a grip, use the arrows, or focus a grip and press Space'}</Text>

<style>
	.incident {
		flex: 1 1 auto;
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		min-width: 0;
	}
	.incident > :global(.truncate:last-child) {
		max-width: 45%;
	}
	@container (max-width: 30rem) {
		.incident {
			flex-direction: column;
			align-items: stretch;
			gap: 0;
			padding-block: var(--sp-1);
		}
		.incident > :global(.truncate) {
			flex: none;
		}
		.incident > :global(.truncate:last-child) {
			max-width: 100%;
		}
		.incident > :global(.truncate:first-child) {
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 2;
			line-clamp: 2;
			white-space: normal;
		}
	}
</style>
