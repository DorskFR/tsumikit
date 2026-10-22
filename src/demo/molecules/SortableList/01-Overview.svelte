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

<Card padding="sm">
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
			<Text size="sm" truncate grow>{i.title}</Text>
			<Text size="xs" tone="muted" mono truncate measure="45%">{i.service}</Text>
		{/snippet}
		{#snippet trailing(i)}
			<Badge size="xs" tone={i.active ? 'accent' : severityTone[i.severity]}>{i.active ? 'working' : i.severity}</Badge>
		{/snippet}
	</SortableList>
</Card>
<Text size="xs" tone="muted">Open: {selected ?? 'none'} · {last || 'drag a grip, use the arrows, or focus a grip and press Space'}</Text>
