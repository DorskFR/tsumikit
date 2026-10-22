<script module>
	export const meta = {
		title: 'Host card',
		caption: 'rows with tone, mono and hint, columns={2} inside a Card; a dense end-aligned summary below.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Card, KeyValue, LoadMore } from '@dorsk/tsumikit';
	import { services } from '../../fixtures';

	const db = services[3];
</script>

<Card title="Host" subtitle={db.name} gap="var(--sp-3)" maxWidth="28rem">
	{#snippet actions()}
		<Button size="sm" variant="ghost">Edit</Button>
	{/snippet}
	<KeyValue
		columns={2}
		rows={[
			{ label: 'Region', value: db.region, mono: true },
			{ label: 'Status', value: 'healthy', tone: 'ok' },
			{ label: 'Image', value: 'postgres:18-pgautoupgrade', mono: true, hint: 'pulled 2h ago' },
			{ label: 'CPU', value: `${db.cpu}%`, tone: db.cpu > 80 ? 'warn' : 'neutral' },
			{ label: 'Memory', value: `${(db.memoryMb / 1024).toFixed(1)} GB` },
			{ label: 'Uptime', value: `${db.uptimeDays} days` }
		]}
	/>
	<KeyValue dense align="end" rows={[{ label: 'Connections', value: 42 }, { label: 'Replication lag', value: '120 ms', tone: 'warn' }]} />
	{#snippet footer()}
		<LoadMore state="done" doneLabel="All hosts shown" />
	{/snippet}
</Card>
