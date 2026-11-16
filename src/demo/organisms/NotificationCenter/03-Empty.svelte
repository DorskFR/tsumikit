<script module>
	export const meta = {
		title: 'Empty centre',
		caption: 'No items: the badge hides, Mark all read is disabled and the panel shows an EmptyState; the empty snippet replaces it.',
		layout: 'row'
	};
</script>

<script lang="ts">
	import { EmptyState, NotificationCenter } from '@dorsk/tsumikit';
</script>

<NotificationCenter items={[]} />
<NotificationCenter items={[]} title="Approvals">
	{#snippet empty()}
		<EmptyState size="compact" icon="check" tone="ok" title="No approvals waiting" description="New requests show up here." />
	{/snippet}
</NotificationCenter>
