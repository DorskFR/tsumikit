<script module>
	export const meta = {
		title: 'Approvals and alerts',
		caption: 'items, onaction (a promise keeps the action pending), onread, onreadall, onloadmore, a footer snippet; "New notification" raises the count and wiggles the bell.',
		layout: 'row'
	};
</script>

<script lang="ts">
	import { Button, NotificationCenter, type NotificationData } from '@dorsk/tsumikit';
	import { older, seed } from './data';

	let items = $state<NotificationData[]>(seed());
	let loading = $state(false);
	let pages = $state(0);
	let next = 1;

	const patch = (id: string, change: Partial<NotificationData>) =>
		(items = items.map((i) => (i.id === id ? { ...i, ...change } : i)));

	function act(id: string, action: string) {
		return new Promise<void>((resolve) =>
			setTimeout(() => {
				const label = { approve: 'Approved', reject: 'Rejected', open: 'Opened', snooze: 'Snoozed', mute: 'Muted' }[action];
				patch(id, { state: `${label} by you`, unread: false });
				resolve();
			}, 700)
		);
	}

	function loadMore() {
		loading = true;
		setTimeout(() => {
			items = [...items, ...older(pages * 3)];
			pages += 1;
			loading = false;
		}, 600);
	}

	function arrive() {
		items = [
			{ id: `new-${next}`, tone: 'info', title: `Build #${1200 + next} passed`, time: Date.now(), unread: true },
			...items
		];
		next += 1;
	}
</script>

<NotificationCenter
	{items}
	{loading}
	hasMore={pages < 2}
	onaction={act}
	onread={(id) => patch(id, { unread: false })}
	onreadall={() => (items = items.map((i) => ({ ...i, unread: false })))}
	onloadmore={loadMore}
	ondismiss={(id) => (items = items.filter((i) => i.id !== id))}
>
	{#snippet footer()}
		<Button size="sm" variant="ghost" href="#settings">Notification settings</Button>
	{/snippet}
</NotificationCenter>
<Button size="sm" onclick={arrive}>New notification</Button>
<Button size="sm" variant="ghost" onclick={() => ((items = seed()), (pages = 0))}>Reset</Button>
