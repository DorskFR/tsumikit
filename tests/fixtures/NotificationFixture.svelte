<script lang="ts">
	import NotificationCenter from '../../src/lib/components/organisms/NotificationCenter.svelte';
	import NotificationItem from '../../src/lib/components/molecules/NotificationItem.svelte';

	let { live }: { live: Record<string, any> } = $props();
	const log = (...args: unknown[]) => live.log.push(args);
</script>

{#if live.kind === 'item'}
	<NotificationItem
		title={live.title ?? 'Deploy approval'}
		text={live.text}
		time={live.time ?? Date.now()}
		unread={live.unread}
		state={live.state}
		actions={live.actions}
		onaction={(id) => {
			log('action', id);
			return live.onaction?.(id);
		}}
		onopen={() => log('open')}
		ondismiss={live.dismissable ? () => log('dismiss') : undefined}
	/>
{:else}
	<button id="outside">outside</button>
	<NotificationCenter
		items={live.items ?? []}
		unread={live.unread}
		bind:open={live.open}
		sheet={live.sheet ?? false}
		filters={live.filters}
		hasMore={live.hasMore}
		loading={live.loading}
		onaction={(itemId, actionId) => log('action', itemId, actionId)}
		onread={(id) => log('read', id)}
		onreadall={() => log('readall')}
		onopenchange={(o) => log('openchange', o)}
		onloadmore={() => log('loadmore')}
	/>
{/if}
