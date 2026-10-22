<script module>
	export const meta = {
		title: 'States',
		caption: 'disabled, open driven from outside through bind:open, onchange, and a long log that the page scrolls.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Button, Cluster, Disclosure, Text } from '@dorsk/tsumikit';

	let open = $state(false);
	let changes = $state(0);
	const lines = Array.from({ length: 12 }, (_, i) => `${String(12 + i).padStart(2, '0')}:04:${String(i * 4).padStart(2, '0')} worker-02 step ${i + 1} ok (${(0.4 + i * 0.13).toFixed(2)}s)`);
</script>

<Disclosure disabled>
	{#snippet header()}<span>Billing history</span><Badge size="xs">locked</Badge>{/snippet}
	<Text size="sm">Never shown.</Text>
</Disclosure>
<Cluster align="center">
	<Button size="sm" onclick={() => (open = !open)}>{open ? 'Collapse' : 'Expand'} log</Button>
	<Text size="xs" tone="muted">changed {changes}×</Text>
</Cluster>
<Disclosure bind:open chevron="start" onchange={() => changes++}>
	{#snippet header({ open })}
		<span>Execution log</span>
		<Badge size="xs" tone={open ? 'info' : 'neutral'}>{open ? 'expanded' : `${lines.length} lines`}</Badge>
	{/snippet}
	<pre class="log">{lines.join('\n')}</pre>
</Disclosure>

<style>
	.log {
		margin: 0;
		font: var(--fs-xs) / var(--lh-normal) var(--font-mono);
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
</style>
