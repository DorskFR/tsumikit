<script module>
	export const meta = {
		title: 'Loading states in context',
		caption: 'no size, so the spinner tracks the text it sits in; label announces the busy state, or set it undefined when the parent already does.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Card, Cluster, Spinner, Text } from '@dorsk/tsumikit';

	let syncing = $state(true);
</script>

<Card maxWidth="26rem">
	<Cluster justify="space-between">
		<Cluster gap="var(--sp-2)">
			{#if syncing}<Spinner label="Syncing" />{/if}
			<Text size="sm">{syncing ? 'Syncing 3 conversations…' : 'Everything is up to date.'}</Text>
		</Cluster>
		<Button size="sm" variant="ghost" onclick={() => (syncing = !syncing)}>{syncing ? 'Stop' : 'Sync again'}</Button>
	</Cluster>
</Card>
<Cluster>
	<Button variant="primary" disabled><Spinner label={undefined} /> Deploying</Button>
	<Text tone="muted" size="sm"><Spinner label={undefined} /> Fetching logs</Text>
	<Text size="xl"><Spinner label="Loading" /> Large text, large spinner</Text>
</Cluster>
