<script module>
	export const meta = {
		title: 'File manager with no matches',
		caption: 'icon, title, description plus the built-in actionLabel/onAction button; the list reappears when the filter clears.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { EmptyState, Icon, Input, Text } from '@dorsk/tsumikit';
	import { files } from '../../fixtures';

	let query = $state('invoice');
	const shown = $derived(files.filter((f) => f.name.toLowerCase().includes(query.trim().toLowerCase())));
	const fmt = (n: number) => (n > 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.round(n / 1000)} KB`);
</script>

<Input bind:value={query} icon="search" placeholder="Filter files" clearable onclear={() => (query = '')} />
{#if shown.length}
	<ul class="files">
		{#each shown as f (f.name)}
			<li><Icon name="file" size={16} /><Text size="sm" truncate>{f.name}</Text><Text size="xs" tone="muted" numeric>{fmt(f.size)}</Text></li>
		{/each}
	</ul>
{:else}
	<EmptyState
		icon="search"
		title="No files match “{query}”"
		description="Check the spelling or clear the filter to see all {files.length} files."
		actionLabel="Clear filter"
		onAction={() => (query = '')}
	/>
{/if}

<style>
	.files {
		display: grid;
		gap: var(--sp-1);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--sp-2);
		padding: var(--sp-1) 0;
	}
</style>
