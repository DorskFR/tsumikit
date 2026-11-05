<script lang="ts">
	import {
		Badge,
		Button,
		Card,
		Cluster,
		EmptyState,
		Heading,
		IconButton,
		LoadMore,
		Stack,
		Tabs,
		Text,
		toasts,
		urlState,
	} from '@dorsk/tsumikit';
	import { fakeRequest, ITEMS, type Item } from './data';

	const PAGE = 5;
	const TABS = [
		{ id: 'all', label: 'All' },
		{ id: 'open', label: 'Open' },
		{ id: 'done', label: 'Done' },
	];

	const status = urlState('status', { default: 'all' });
	let items = $state<Item[]>(ITEMS);
	let shown = $state(PAGE);
	let loading = $state(false);

	const filtered = $derived(items.filter((i) => status.value === 'all' || i.status === status.value));
	const visible = $derived(filtered.slice(0, shown));
	const loadState = $derived(loading ? 'loading' : shown >= filtered.length ? 'done' : 'idle');

	async function loadMore() {
		loading = true;
		await fakeRequest();
		shown += PAGE;
		loading = false;
	}

	function remove(item: Item) {
		toasts.undo({
			message: `Deleted "${item.title}"`,
			apply: () => {
				items = items.filter((i) => i.id !== item.id);
			},
			commit: () => fakeRequest(),
			revert: () => {
				items = [...items, item].sort((a, b) => a.id - b.id);
			},
		});
	}

	function addFirst() {
		items = [{ id: 1, title: 'My first item', status: 'open' }];
	}
</script>

<svelte:head>
	<title>Items</title>
</svelte:head>

<Stack gap="var(--sp-4)">
	<Heading level={2} size="lg">Items</Heading>

	{#if items.length === 0}
		<EmptyState
			icon="folder"
			title="No items yet"
			description="Items are the things you are working on. Add the first one and it shows up here."
			actionLabel="Add an item"
			onAction={addFirst}
		/>
	{:else}
		<Tabs tabs={TABS} bind:value={status.value} href={(id) => status.href(id)} label="Filter by status" />

		{#if filtered.length === 0}
			<EmptyState
				size="compact"
				icon="filter"
				title="Nothing is {status.value}"
				description="No item has this status right now."
			>
				{#snippet action()}
					<Button href={status.href('all')}>Show all items</Button>
				{/snippet}
			</EmptyState>
		{:else}
			<Stack as="ul" gap="var(--sp-2)" class="list">
				{#each visible as item (item.id)}
					<Card as="li" padding="sm" surface="raised" border="none">
						<Cluster gap="var(--sp-3)" align="center">
							<Text grow>{item.title}</Text>
							<Badge tone={item.status === 'done' ? 'ok' : 'neutral'} dot size="sm">
								{item.status}
							</Badge>
							<IconButton
								icon="trash"
								label="Delete {item.title}"
								variant="ghost"
								hoverDanger
								box="sm"
								onclick={() => remove(item)}
							/>
						</Cluster>
					</Card>
				{/each}
			</Stack>
			<LoadMore state={loadState} onload={loadMore} />
		{/if}
	{/if}
</Stack>

<style>
	:global(.list) {
		list-style: none;
		margin: 0;
		padding: 0;
	}
</style>
