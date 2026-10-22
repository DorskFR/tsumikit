<script module>
	export const meta = {
		title: 'States',
		caption: 'An empty list renders nothing (pair it with an EmptyState); one row has disabled arrows; locked rows keep a spacer instead of a grip; long names truncate inside the row.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { EmptyState, SortableList, Text } from '@dorsk/tsumikit';

	type Step = { id: string; name: string; done?: boolean };
	const one: Step[] = [{ id: 'a', name: 'Rotate API keys' }];
	const mixed: Step[] = [
		{ id: 'a', name: 'Freeze writes', done: true },
		{ id: 'b', name: 'Snapshot volume', done: true },
		{ id: 'c', name: 'Promote the replica in eu-west-1 and repoint every connection string in the vault' },
		{ id: 'd', name: 'Unfreeze writes' }
	];
	let steps = $state(mixed);
	const empty: Step[] = [];
</script>

<div>
	<Text size="xs" tone="muted">empty</Text>
	{#if empty.length}
		<SortableList items={empty} key={(s) => s.id} label="Empty runbook">{#snippet row(s)}{s.name}{/snippet}</SortableList>
	{:else}
		<EmptyState size="inline" title="No steps yet" />
	{/if}
</div>
<div>
	<Text size="xs" tone="muted">a single row</Text>
	<SortableList items={one} key={(s) => s.id} name={(s) => s.name} label="Single step" numbered>
		{#snippet row(s)}<Text size="sm">{s.name}</Text>{/snippet}
	</SortableList>
</div>
<div>
	<Text size="xs" tone="muted">done steps locked, long name</Text>
	<SortableList
		items={steps}
		key={(s) => s.id}
		name={(s) => s.name}
		label="Failover runbook"
		numbered
		size="sm"
		locked={(s) => !!s.done}
		canMove={(_k, to) => to >= 2}
		onreorder={(keys) => (steps = keys.map((k) => steps.find((s) => s.id === k)!))}
	>
		{#snippet row(s)}<Text size="sm" truncate tone={s.done ? 'muted' : 'default'}>{s.name}</Text>{/snippet}
	</SortableList>
</div>
