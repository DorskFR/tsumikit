<script module>
	export const meta = {
		title: 'Chevron side and size',
		caption: 'chevron="start" | "end" | false; size="compact" tightens the header and panel.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Disclosure, Text } from '@dorsk/tsumikit';
</script>

<Disclosure open>
	{#snippet header()}<span>Chevron end</span>{/snippet}
	<Text size="sm" tone="muted">The default.</Text>
</Disclosure>
<Disclosure open chevron="start">
	{#snippet header()}<span>Chevron start</span>{/snippet}
	<Text size="sm" tone="muted">Reads like a tree node.</Text>
</Disclosure>
<Disclosure open chevron={false}>
	{#snippet header({ open })}<span>{open ? 'Hide' : 'Show'} details</span>{/snippet}
	<Text size="sm" tone="muted">The header text carries the state.</Text>
</Disclosure>
<Disclosure open size="compact">
	{#snippet header()}<span>Compact</span>{/snippet}
	<Text size="xs" tone="muted">Dense lists and sidebars.</Text>
</Disclosure>
