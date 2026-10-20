<script lang="ts">
	import FilterInput from '../../src/lib/components/molecules/FilterInput.svelte';
	import Popover from '../../src/lib/components/molecules/Popover.svelte';
	import Tooltip from '../../src/lib/components/molecules/Tooltip.svelte';
	import type { Schema } from '../../src/lib/query/schema';

	let {
		showPopover = true,
		showTooltip = true,
		showFilter = true
	}: { showPopover?: boolean; showTooltip?: boolean; showFilter?: boolean } = $props();

	const schema: Schema = {
		fields: [
			{ name: 'artist', label: 'Artist', type: 'string' },
			{ name: 'year', label: 'Year', type: 'number' }
		]
	};
</script>

{#if showPopover}
	<Popover openOn="hover" label="Hover panel">
		{#snippet trigger()}hover me{/snippet}
		<p id="pop-body">panel</p>
	</Popover>
{/if}

<p id="hint">field hint</p>
{#if showTooltip}
	<Tooltip text="tip text" delay={0}>
		{#snippet trigger()}<button type="button" id="tip-btn" aria-describedby="hint">?</button>{/snippet}
	</Tooltip>
{/if}

{#if showFilter}
	<label for="q">Query</label>
	<FilterInput {schema} id="q" />
{/if}
