<script>
	import Slider from '$lib/components/atoms/Slider.svelte';
	import SeekSlider from '$lib/components/molecules/SeekSlider.svelte';
	import VolumeSlider from '$lib/components/molecules/VolumeSlider.svelte';
	import PullToRefresh from '$lib/components/molecules/PullToRefresh.svelte';
	import SwipeRow from '$lib/components/molecules/SwipeRow.svelte';

	let { silent = false, fired = [] } = $props();
	let v = $state(50);
	let coarse = $state(2);
	let seek = $state(10);
	let vol = $state(0.5);
	const marks = [
		{ value: 0, label: 'min' },
		{ value: 100, label: 'max' }
	];
</script>

<Slider label="fine" bind:value={v} sound={!silent} {marks} data-probe="fine" />
<Slider label="coarse" bind:value={coarse} min={0} max={5} sound={!silent} data-probe="coarse" />
<SeekSlider bind:value={seek} max={600} sound={!silent} />
<VolumeSlider bind:value={vol} hideOnTouch={false} sound={!silent} />
<PullToRefresh threshold={40} sound={!silent}>
	<p>content</p>
</PullToRefresh>
<SwipeRow
	leadingAction={{ icon: 'check', label: 'Done', onaction: () => fired.push('lead') }}
	trailingAction={{ icon: 'trash', label: 'Delete', onaction: () => fired.push('trail') }}
	sound={!silent}
>
	<p>row</p>
</SwipeRow>
