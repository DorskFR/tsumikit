<script module>
	export const meta = {
		title: 'Optimistic order and custom announcements',
		caption: 'The new order shows at once; if items is not updated within revertAfter ms (here a rejected save), the list snaps back. messages localises every live-region string.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Callout, SortableList, Text } from '@dorsk/tsumikit';

	let lanes = $state([
		{ id: 'eu', name: 'Europe (Frankfurt)' },
		{ id: 'us', name: 'United States (Virginia)' },
		{ id: 'ap', name: 'Asia Pacific (Tokyo)' }
	]);
	let status = $state('');
	function save() {
		status = 'Saving…';
		setTimeout(() => (status = 'The server rejected the change; the order was restored.'), 1500);
	}
</script>

<SortableList
	items={lanes}
	key={(l) => l.id}
	name={(l) => l.name}
	label="Failover order"
	numbered
	revertAfter={1500}
	messages={{ moved: (n, pos, total) => `${n} is now failover ${pos} of ${total}.` }}
	onreorder={save}
>
	{#snippet row(l)}<Text size="sm">{l.name}</Text>{/snippet}
</SortableList>
{#if status}<Callout tone="warn">{status}</Callout>{:else}<Text size="xs" tone="muted">Move a region: it reverts after 1.5 s because items never changes.</Text>{/if}
