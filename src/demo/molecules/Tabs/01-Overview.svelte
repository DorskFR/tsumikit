<script module>
	export const meta = {
		title: 'Service detail',
		caption: 'tabs with icon and count, bind:value, and a panel snippet that receives the active id.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, KeyValue, Tabs, Text, type TabItem } from '@dorsk/tsumikit';
	import { services } from '../../fixtures';

	const svc = services[1];
	const tabs: TabItem[] = [
		{ id: 'overview', label: 'Overview', icon: 'info' },
		{ id: 'logs', label: 'Logs', icon: 'file-text', count: 128 },
		{ id: 'alerts', label: 'Alerts', icon: 'warning', count: 2 },
		{ id: 'settings', label: 'Settings', icon: 'settings' }
	];
	let value = $state<string | undefined>('overview');
</script>

<Tabs {tabs} bind:value label="Service {svc.name}">
	{#snippet panel(id)}
		{#if id === 'overview'}
			<KeyValue
				columns={2}
				rows={[
					{ label: 'Region', value: svc.region, mono: true },
					{ label: 'Role', value: svc.role },
					{ label: 'CPU', value: `${svc.cpu}%`, tone: svc.cpu > 80 ? 'warn' : 'ok' },
					{ label: 'Uptime', value: `${svc.uptimeDays} days` }
				]}
			/>
		{:else if id === 'logs'}
			<Text mono size="sm" block>12:04:11 worker-02 picked job 8812 (transcode)</Text>
			<Text mono size="sm" block>12:04:13 worker-02 ffmpeg exited 0 in 1.8s</Text>
		{:else if id === 'alerts'}
			<Badge tone="warn">CPU above 80% for 15 min</Badge>
			<Badge tone="warn">Memory pressure</Badge>
		{:else}
			<Text size="sm" tone="muted">Restart policy, resource limits and environment live here.</Text>
		{/if}
	{/snippet}
</Tabs>
