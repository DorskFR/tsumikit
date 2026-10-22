<script module>
	export const meta = {
		title: 'Gallery',
		caption: 'every registered name; type to filter, click a tile to copy its name.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Icon, Input, Text, toasts } from '@dorsk/tsumikit';
	import { ICON_NAMES } from './data';

	let query = $state('');
	const shown = $derived(ICON_NAMES.filter((n) => n.includes(query.trim().toLowerCase())));

	async function copy(name: string) {
		await navigator.clipboard?.writeText(name);
		toasts.show(`Copied "${name}"`);
	}
</script>

<Input icon="search" placeholder="Filter {ICON_NAMES.length} icons" bind:value={query} clearable width="16rem" />
{#if shown.length === 0}
	<Text size="sm" tone="muted">No icon matches "{query}".</Text>
{/if}
<div class="gallery">
	{#each shown as name (name)}
		<button type="button" class="cell" onclick={() => copy(name)} title="Copy {name}">
			<Icon {name} size={22} />
			<Text size="xs" tone="muted" truncate block>{name}</Text>
		</button>
	{/each}
</div>

<style>
	.gallery {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr));
		gap: var(--sp-1);
	}
	.cell {
		all: unset;
		display: grid;
		justify-items: center;
		gap: var(--sp-1);
		padding: var(--sp-2) var(--sp-1);
		border-radius: var(--r-md);
		cursor: pointer;
		min-width: 0;
		text-align: center;
	}
	.cell:hover {
		background: var(--bg-elevated);
	}
	.cell:focus-visible {
		outline: 2px solid var(--accent);
	}
</style>
