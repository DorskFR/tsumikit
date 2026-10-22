<script module>
	export const meta = {
		title: 'Inbox',
		caption: 'leadingAction archives on a rightward swipe, trailingAction deletes on a leftward one; past 35% of the width the action fires on release. Tab into a row for the same actions as buttons.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Card, Cluster, EmptyState, SwipeRow, Text } from '@dorsk/tsumikit';
	import { inbox } from './data';

	let rows = $state([...inbox]);
	let log = $state('');
	const remove = (id: number, verb: string) => {
		const mail = rows.find((r) => r.id === id);
		rows = rows.filter((r) => r.id !== id);
		log = `${verb} "${mail?.subject}"`;
	};
</script>

<Card padding="none">
	{#each rows as mail (mail.id)}
		<SwipeRow
			leadingAction={{ label: 'Archive', icon: 'archive', tone: 'ok', onaction: () => remove(mail.id, 'Archived') }}
			trailingAction={{ label: 'Delete', icon: 'trash', tone: 'danger', onaction: () => remove(mail.id, 'Deleted') }}
		>
			<div class="mail">
				<Cluster justify="space-between" wrap={false}>
					<Text weight="semibold" truncate>{mail.from}</Text>
					<Text size="xs" tone="muted" nowrap>{mail.at}</Text>
				</Cluster>
				<Text size="sm" truncate block>{mail.subject}</Text>
				<Text size="sm" tone="muted" truncate block>{mail.preview}</Text>
			</div>
		</SwipeRow>
	{:else}
		<EmptyState size="inline" title="Inbox zero" />
	{/each}
</Card>
<Cluster justify="space-between">
	<Text size="xs" tone="muted">{log || 'Swipe a row with touch, pen or a mouse drag.'}</Text>
	<Button size="sm" variant="ghost" onclick={() => ((rows = [...inbox]), (log = ''))}>Reset</Button>
</Cluster>

<style>
	.mail {
		display: grid;
		gap: var(--sp-0-5);
		padding: var(--sp-3);
		border-bottom: 1px solid var(--border);
	}
</style>
