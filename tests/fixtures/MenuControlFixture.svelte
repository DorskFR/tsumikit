<script lang="ts">
	import Menu, { type MenuItem } from '../../src/lib/components/molecules/Menu.svelte';
	import Popover from '../../src/lib/components/molecules/Popover.svelte';

	let groupBy = $state('none');
	let picked = $state<string[]>([]);
	const items: MenuItem[] = [
		{ label: 'View', icon: 'eye', onselect: () => picked.push('view') },
		{ label: 'Group by', icon: 'list', control: groupBySelect },
		{ label: 'Filter by label', icon: 'filter', control: filterPopover },
		{ label: 'Locked', icon: 'lock', disabled: true, control: groupBySelect },
		{ label: 'Select multiple', onselect: () => picked.push('multi') }
	];
</script>

{#snippet groupBySelect(item: MenuItem)}
	<span>{item.label}</span>
	<select aria-label={item.label} bind:value={groupBy}>
		<option value="none">None</option>
		<option value="repo">Repo</option>
	</select>
{/snippet}

{#snippet filterPopover(item: MenuItem, { close }: { close: () => void })}
	<Popover label={item.label} bare block>
		{#snippet trigger()}{item.label}{/snippet}
		<button type="button" id="nested-done" onclick={close}>Done</button>
	</Popover>
{/snippet}

<output id="group">{groupBy}</output>
<output id="picked">{picked.join(',')}</output>
<Menu label="Sessions" {items}>
	{#snippet trigger()}⋯{/snippet}
</Menu>
