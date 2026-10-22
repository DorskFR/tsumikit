<script module>
	export const meta = {
		title: 'Custom content and overflow',
		caption: 'children replaces label (links, mono text, badges); trailing holds counters or a button; a long label truncates in a narrow panel.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Button, Link, StatusBar, Text } from '@dorsk/tsumikit';
</script>

<StatusBar tone="ok">
	<Text size="sm">Deployed <Text size="sm" mono>0.62.1</Text> · <Link href="#status-bar">view logs</Link></Text>
	{#snippet trailing()}<Badge size="xs" tone="ok">6/6 healthy</Badge>{/snippet}
</StatusBar>
<StatusBar tone="error" label="cache-01 refused connections">
	{#snippet trailing()}<Button size="sm" variant="ghost">Retry</Button>{/snippet}
</StatusBar>
<div class="narrow">
	<StatusBar tone="busy" label="Indexing /home/amara/Documents/tsumikit/src/lib/components/molecules/FilterInput.svelte">
		{#snippet trailing()}<span>1,284 / 3,902 files</span>{/snippet}
	</StatusBar>
</div>

<style>
	.narrow {
		max-width: 18rem;
	}
</style>
