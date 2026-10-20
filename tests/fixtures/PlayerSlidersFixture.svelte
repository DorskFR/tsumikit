<script lang="ts">
	import TimeDisplay from '../../src/lib/components/atoms/TimeDisplay.svelte';
	import SeekSlider from '../../src/lib/components/molecules/SeekSlider.svelte';
	import VolumeSlider from '../../src/lib/components/molecules/VolumeSlider.svelte';

	let {
		log = [] as string[],
		value = $bindable(62),
		max = 1425 as number | null,
		buffered = [] as [number, number][],
		step = 5,
		bigStep = 0.1,
		disabled = false,
		volume = $bindable(0.8),
		muted = $bindable(false),
		orientation = 'horizontal' as 'horizontal' | 'vertical',
		remaining = $bindable(false),
		withPreview = false
	}: {
		log?: string[];
		value?: number;
		max?: number | null;
		buffered?: [number, number][];
		step?: number;
		bigStep?: number;
		disabled?: boolean;
		volume?: number;
		muted?: boolean;
		orientation?: 'horizontal' | 'vertical';
		remaining?: boolean;
		withPreview?: boolean;
	} = $props();
</script>

{#snippet preview(t: number)}
	<b class="probe-preview">thumb@{Math.round(t)}</b>
{/snippet}

<SeekSlider
	bind:value
	{max}
	{buffered}
	{step}
	{bigStep}
	{disabled}
	previewSnippet={withPreview ? preview : undefined}
	oninput={(s) => log.push(`input:${Math.round(s)}`)}
	onchange={(s) => log.push(`change:${Math.round(s)}`)}
	onscrubstart={() => log.push('scrubstart')}
	onscrubend={() => log.push('scrubend')}
/>
<VolumeSlider
	bind:value={volume}
	bind:muted
	{orientation}
	{disabled}
	oninput={(v) => log.push(`vinput:${Math.round(v * 100)}`)}
	onchange={(v) => log.push(`vchange:${Math.round(v * 100)}`)}
	onmutechange={(m) => log.push(`mute:${m}`)}
/>
<TimeDisplay current={value} duration={max} bind:remaining />
