<script module>
	export const meta = {
		title: 'Conversation filters',
		caption: 'pressed with onclick, pill chips per message role, --toggle-accent set per chip and struck when a role is muted.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Text, Toggle } from '@dorsk/tsumikit';

	let shown = $state<Record<string, boolean>>({ user: true, assistant: true, tool: false, system: false });
	const roles = [
		{ id: 'user', label: 'User', accent: 'var(--accent)' },
		{ id: 'assistant', label: 'Assistant', accent: 'var(--ok)' },
		{ id: 'tool', label: 'Tool calls', accent: 'var(--info)' },
		{ id: 'system', label: 'System', accent: 'var(--warn)' }
	];
	const hidden = $derived(roles.filter((r) => !shown[r.id]).length);
</script>

<Cluster gap="var(--sp-1)">
	{#each roles as r (r.id)}
		<Toggle pill pressed={shown[r.id]} struck={!shown[r.id]} style="--toggle-accent: {r.accent}" onclick={() => (shown[r.id] = !shown[r.id])}>{r.label}</Toggle>
	{/each}
</Cluster>
<Text size="xs" tone="muted">{hidden ? `${hidden} role${hidden === 1 ? '' : 's'} hidden` : 'Showing every message'}</Text>
