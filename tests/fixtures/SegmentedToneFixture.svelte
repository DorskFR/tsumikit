<script lang="ts">
	import SegmentedControl, {
		type SegmentOption
	} from '../../src/lib/components/molecules/SegmentedControl.svelte';

	let { value = 'ok', shape = 'square' }: { value?: string; shape?: 'pill' | 'square' } = $props();

	const options: SegmentOption[] = [
		{ value: 'ok', label: 'Stable', tone: 'success' },
		{ value: 'danger', label: 'Production', tone: 'danger', count: 3 },
		{ value: 'custom', label: 'Custom', color: 'rgb(1, 2, 3)', tone: 'warn' },
		{ value: 'neutral', label: 'Neutral', tone: 'neutral' },
		{ value: 'plain', label: 'Plain' }
	];
</script>

<SegmentedControl {shape} {options} bind:value label="Channel" />
