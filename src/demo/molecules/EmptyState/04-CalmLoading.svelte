<script module>
	export const meta = {
		title: 'Fast vs slow refresh',
		caption:
			'loading marks the panel busy at once but the spinner waits 200 ms and then stays 500 ms: a cached refresh never flickers, a cold one shows steady progress. loadingDelay / loadingMin override (0 disables).',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Button, Card, Cluster, EmptyState } from '@dorsk/tsumikit';

	let loading = $state(false);
	let source = $state('cache');

	function refresh(from: 'cache' | 'network') {
		source = from;
		loading = true;
		setTimeout(() => (loading = false), from === 'cache' ? 80 : 1600);
	}
</script>

<Card>
	<EmptyState
		{loading}
		icon="mail"
		title={loading ? 'Refreshing inbox…' : 'Inbox is empty'}
		description={loading ? `Checking the ${source}.` : 'New messages from your team land here as soon as they arrive.'}
	>
		{#snippet action()}
			<Cluster>
				<Button onclick={() => refresh('cache')}>Refresh (cached, 80 ms)</Button>
				<Button variant="primary" onclick={() => refresh('network')}>Refresh (network, 1.6 s)</Button>
			</Cluster>
		{/snippet}
	</EmptyState>
</Card>
