<script lang="ts">
	// Range/slider primitive. A real <input type="range"> (keeps the native
	// slider role, keyboard stepping and form participation) restyled across
	// engines from tokens. The track shows a filled portion up to the current
	// value, and an optional `output` displays the value with a correct
	// for-association. `bind:value` and all native attrs/events pass through.
	// Recolor per-instance via `--slider-accent` (defaults to the theme accent).
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		value = $bindable(0),
		min = 0,
		max = 100,
		step = 1,
		label,
		showValue = false,
		format = (v: number) => String(v),
		id = `slider-${Math.random().toString(36).slice(2, 8)}`,
		class: klass = '',
		el = $bindable(null),
		...rest
	}: HTMLInputAttributes & {
		value?: number;
		min?: number;
		max?: number;
		step?: number;
		label?: string;
		showValue?: boolean;
		format?: (v: number) => string;
		el?: HTMLInputElement | null;
	} = $props();

	// Fill percentage for the track gradient.
	const pct = $derived(
		Math.max(0, Math.min(100, ((Number(value) - +min) / (+max - +min || 1)) * 100))
	);
</script>

<div class="slider {klass}" style="--pct: {pct}%" data-tsu="Slider">
	<input
		bind:this={el}
		{id}
		type="range"
		{min}
		{max}
		{step}
		bind:value
		aria-label={label}
		{...rest}
	/>
	{#if showValue}
		<output for={id} class="slider-out">{format(Number(value))}</output>
	{/if}
</div>

<style>
	.slider {
		display: flex;
		align-items: center;
		gap: var(--sp-3);
		width: 100%;
	}
	input[type='range'] {
		appearance: none;
		-webkit-appearance: none;
		flex: 1;
		height: 1.25rem;
		background: none;
		cursor: pointer;
	}
	/* Track — WebKit/Blink. Filled up to --pct with the accent, then the rail. */
	input[type='range']::-webkit-slider-runnable-track {
		height: 0.35rem;
		border-radius: var(--r-pill);
		background: linear-gradient(
			to right,
			var(--slider-accent, var(--accent)) var(--pct),
			var(--bg-elevated-2) var(--pct)
		);
	}
	input[type='range']::-moz-range-track {
		height: 0.35rem;
		border-radius: var(--r-pill);
		background: var(--bg-elevated-2);
	}
	input[type='range']::-moz-range-progress {
		height: 0.35rem;
		border-radius: var(--r-pill);
		background: var(--slider-accent, var(--accent));
	}
	/* Thumb */
	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		-webkit-appearance: none;
		margin-top: -0.425rem; /* center on the 0.35rem track */
		width: 1.2rem;
		height: 1.2rem;
		border-radius: 50%;
		background: var(--slider-accent, var(--accent));
		border: 2px solid var(--bg);
		box-shadow: var(--shadow-sm);
		transition: transform 0.1s var(--ease);
	}
	input[type='range']::-moz-range-thumb {
		width: 1.2rem;
		height: 1.2rem;
		border-radius: 50%;
		background: var(--slider-accent, var(--accent));
		border: 2px solid var(--bg);
		box-shadow: var(--shadow-sm);
	}
	input[type='range']:active::-webkit-slider-thumb {
		transform: scale(1.12);
	}
	input[type='range']:focus-visible {
		outline: none;
	}
	input[type='range']:focus-visible::-webkit-slider-thumb {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	input[type='range']:focus-visible::-moz-range-thumb {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	input[type='range']:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.slider-out {
		min-width: 2.5rem;
		text-align: right;
		font-size: var(--fs-sm);
		font-variant-numeric: tabular-nums;
		color: var(--text-muted);
	}
</style>
