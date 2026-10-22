<script module>
	export const meta = {
		title: 'Closable document strip',
		caption: 'closable with onclose; the ✕, Delete and middle-click close a tab, a pinned tab opts out with closable: false; leading and actions snippets.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Dot, IconButton, Tabs, Text, type TabItem } from '@dorsk/tsumikit';

	let docs = $state<TabItem[]>([
		{ id: 'readme', label: 'README.md', title: 'tsumikit/README.md' },
		{ id: 'tabs', label: 'Tabs.svelte', title: 'src/lib/components/molecules/Tabs.svelte' },
		{ id: 'notes', label: 'A very long document title that truncates', title: 'notes/2026-10-21-release-planning.md' },
		{ id: 'pinned', label: 'Pinned', closable: false }
	]);
	const status: Record<string, 'active' | 'stale' | 'dead'> = { readme: 'active', tabs: 'stale', notes: 'dead' };
	let value = $state<string | undefined>('readme');
	let seq = 1;

	function open() {
		const id = `untitled-${seq++}`;
		docs.push({ id, label: `Untitled ${seq - 1}` });
		value = id;
	}
</script>

<Tabs tabs={docs} bind:value label="Open documents" closable onclose={(id) => (docs = docs.filter((d) => d.id !== id))} style="--tab-max-width: 14rem">
	{#snippet leading(t)}
		<Dot status={status[t.id] ?? 'active'} />
	{/snippet}
	{#snippet actions()}
		<IconButton icon="plus" label="New document" onclick={open} />
		<IconButton icon="trash" label="Close all" hoverDanger onclick={() => (docs = docs.filter((d) => d.closable === false))} />
	{/snippet}
</Tabs>
<Text size="xs" tone="muted">Active: {value ?? 'none'}</Text>
