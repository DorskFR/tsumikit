<script lang="ts">
	// Text-size control: the "A" trigger opens a popover with a stepped slider
	// across SCALE_LEVELS. Drives --fs-scale (text only), chrome stays fixed.
	// Everything inside the popover is sized in plain rem, never --fs-*: if the
	// panel rescaled with the page the slider would move under the pointer
	// mid-drag and oscillate between steps.
	import Popover from '$lib/components/molecules/Popover.svelte';
	import Slider from '$lib/components/atoms/Slider.svelte';
	import { fontScale, SCALE_LEVELS } from '$lib/stores/fontscale.svelte';

	let { class: klass = '' }: { class?: string } = $props();

	const index = $derived(Math.max(0, SCALE_LEVELS.findIndex((l) => l.id === fontScale.levelId)));
	const level = $derived(SCALE_LEVELS[index]);
	const set = (i: number) => fontScale.set(SCALE_LEVELS[Math.max(0, Math.min(SCALE_LEVELS.length - 1, i))].id);
</script>

<Popover label="Text size" placement="bottom-end" triggerClass={klass} box="md">
	{#snippet trigger()}<span class="glyph" data-tsu="FontScalePicker" title="Text size: {level.label}">A</span>{/snippet}
	<div class="panel">
		<div class="row">
			<button type="button" class="end small" aria-label="Smaller text" onclick={() => set(index - 1)}>a</button>
			<Slider
				value={index}
				min={0}
				max={SCALE_LEVELS.length - 1}
				step={1}
				ticks
				label="Text size"
				aria-valuetext={level.label}
				oninput={(e) => set(Number((e.currentTarget as HTMLInputElement).value))}
			/>
			<button type="button" class="end large" aria-label="Larger text" onclick={() => set(index + 1)}>A</button>
		</div>
		<div class="caption" aria-live="polite">{level.label} · {Math.round(level.value * 100)}%</div>
	</div>
</Popover>

<style>
	.glyph {
		font-weight: var(--fw-bold);
		font-size: 1rem;
		line-height: 1;
	}
	.panel {
		width: 15rem;
		font-size: 0.875rem;
		line-height: 1.4;
		padding: var(--sp-2) var(--sp-3);
	}
	.row {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
	}
	.end {
		flex: none;
		width: 1.75rem;
		height: 1.75rem;
		padding: 0;
		border: 0;
		border-radius: var(--r-sm);
		background: none;
		color: var(--text-muted);
		font-family: inherit;
		font-weight: var(--fw-bold);
		line-height: 1;
		cursor: pointer;
	}
	.end:hover {
		background: var(--bg-elevated-2);
		color: var(--text);
	}
	.end:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}
	.small {
		font-size: 0.75rem;
	}
	.large {
		font-size: 1.125rem;
	}
	.caption {
		margin-top: var(--sp-1);
		text-align: center;
		font-size: 0.75rem;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}
</style>
