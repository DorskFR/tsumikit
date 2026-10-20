<script lang="ts">
	import Progress from '../../src/lib/components/atoms/Progress.svelte';
	import Select from '../../src/lib/components/atoms/Select.svelte';
	import Slider from '../../src/lib/components/atoms/Slider.svelte';
	import EmojiPicker from '../../src/lib/components/molecules/EmojiPicker.svelte';
	import FilterInput from '../../src/lib/components/molecules/FilterInput.svelte';
	import Menu from '../../src/lib/components/molecules/Menu.svelte';
	import RadialMenu from '../../src/lib/components/molecules/RadialMenu.svelte';
	import SelectButton from '../../src/lib/components/molecules/SelectButton.svelte';
	import type { Schema } from '../../src/lib/query/schema';

	let { which }: { which: string } = $props();

	const items = [
		{ label: 'Japanese', onselect: () => {} },
		{ label: 'Japanese', onselect: () => {} }
	];
	let tracks = $state([
		{ id: 'jp-1', label: 'Japanese', onselect: () => {} },
		{ id: 'jp-2', label: 'Japanese', onselect: () => {} }
	]);
	const crab = { emoji: '🦀', keys: 'crab' };
	const emojiGroups = [
		{ id: 'recent', icon: '🕘', label: 'Recent', entries: [crab] },
		{ id: 'animals', icon: '🐾', label: 'Animals', entries: [crab] }
	];
	const values = ['v1', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'v'];
	const schema: Schema = {
		fields: [{ name: 'cwd', label: 'Dir', type: 'string', provider: () => values.map((value) => ({ value, label: value })) }]
	};
</script>

{#if which === 'Menu'}
	<Menu label="Subtitles" {items}>
		{#snippet trigger()}CC{/snippet}
	</Menu>
{:else if which === 'MenuIds'}
	<button type="button" id="reverse" onclick={() => (tracks = tracks.toReversed())}>reverse</button>
	<Menu label="Subtitles" items={tracks}>
		{#snippet trigger()}CC{/snippet}
	</Menu>
{:else if which === 'RadialMenu'}
	<RadialMenu label="Subtitles" {items} open />
{:else if which === 'SelectButton'}
	<SelectButton
		label="Audio"
		value="a"
		onchange={() => {}}
		groups={[
			{ label: 'Japanese', options: [{ value: 'a', label: 'Stereo' }] },
			{ label: 'Japanese', options: [{ value: 'b', label: '5.1' }] }
		]}
	/>
{:else if which === 'Select'}
	<Select
		value="a"
		options={[
			{ value: 'a', label: 'A', group: '-1' },
			{ value: 'b', label: 'B' }
		]}
	/>
{:else if which === 'EmojiPicker'}
	<EmojiPicker groups={emojiGroups} onselect={() => {}} />
{:else if which === 'FilterInput'}
	<FilterInput {schema} value="cwd:" />
{:else if which === 'Progress'}
	<Progress value={30} markers={[{ at: 50, label: 'OP' }, { at: 50, label: 'ED' }]} />
{:else if which === 'SliderTicks'}
	<Slider value={10} ticks={[25, 25, 75]} />
{:else if which === 'SliderMarks'}
	<Slider
		value={50}
		marks={[
			{ value: 50, label: 'Half' },
			{ value: 50, label: 'Mid' }
		]}
	/>
{/if}
