<script lang="ts">
	// Range/slider primitive. A real <input type="range"> (keeps the native
	// slider role, keyboard stepping and form participation) restyled across
	// engines from tokens. The track shows a filled portion up to the current
	// value, and an optional `output` displays the value with a correct
	// for-association. `bind:value` and all native attrs/events pass through.
	// Recolor per-instance via `--slider-accent` (defaults to the theme accent).
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { getFieldContext, warnUnlabelled } from '$lib/field-context';

	let {
		value = $bindable(0),
		min = 0,
		max = 100,
		step = 1,
		label,
		showValue = false,
		format = (v: number) => String(v),
		id: idProp,
		'aria-describedby': ariaDescribedby,
		'aria-invalid': ariaInvalid,
		invalid = false,
		ticks = false,
		marks = [],
		width,
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
		/** Error state: aria-invalid. */
		invalid?: boolean;
		/** Visible dots at each step (segmented slider). `true` = one per `step`;
		 *  a number array places dots at those values. */
		ticks?: boolean | number[];
		/** Clickable labelled tick row under the track. */
		marks?: { value: number; label: string }[];
		/** Fixed width (`flex: none`). */
		width?: string;
		id?: string;
		'aria-describedby'?: string | null;
		'aria-invalid'?: HTMLInputAttributes['aria-invalid'];
		el?: HTMLInputElement | null;
	} = $props();

	const field = getFieldContext();
	const fallbackId = $props.id();
	const id = $derived(idProp ?? field?.id ?? fallbackId);
	const isInvalid = $derived(invalid || !!field?.invalid);

	$effect(() => warnUnlabelled(el, 'Slider'));

	const frac = (v: number) => Math.max(0, Math.min(1, (v - +min) / (+max - +min || 1)));
	const pct = $derived(frac(Number(value)) * 100);
	const tickValues = $derived.by(() => {
		if (!ticks) return [];
		if (Array.isArray(ticks)) return ticks;
		const n = Math.floor((+max - +min) / (+step || 1));
		if (n > 200) return [];
		return Array.from({ length: n + 1 }, (_, i) => +min + i * +step);
	});
</script>

<div class="slider {klass}" class:has-ticks={tickValues.length > 0} class:has-marks={marks.length > 0} class:fixed={!!width} style="--pct: {pct}%; {width ? `width: ${width}` : ''}" data-tsu="Slider">
	<span class="range">
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
		aria-describedby={ariaDescribedby ?? field?.describedBy}
		aria-invalid={ariaInvalid ?? (isInvalid ? 'true' : undefined)}
	/>
	{#if tickValues.length > 0}
		<span class="ticks" aria-hidden="true">
			{#each tickValues as t (t)}
				<i class="tick" class:reached={t <= Number(value)} style="--f: {frac(t)}"></i>
			{/each}
		</span>
	{/if}
	</span>
	{#if showValue}
		<output for={id} class="slider-out">{format(Number(value))}</output>
	{/if}
	{#if marks.length > 0}
		<span class="marks" aria-hidden="true">
			{#each marks as m (m.value)}
				<button type="button" class="mark" class:on={Number(value) === m.value} style="--f: {frac(m.value)}" tabindex="-1" onclick={() => (value = m.value)}>{m.label}</button>
			{/each}
		</span>
	{/if}
</div>

<style>
	.slider.fixed {
		flex: none;
	}
	.slider.has-marks {
		flex-wrap: wrap;
		row-gap: var(--sp-1);
	}
	.marks {
		position: relative;
		flex: 1 0 100%;
		height: 1.2em;
		font-size: var(--fs-xs);
		color: var(--text-faint);
	}
	.mark {
		position: absolute;
		left: calc(var(--f) * 100%);
		transform: translateX(-50%);
		border: 0;
		background: none;
		padding: 0;
		font: inherit;
		color: inherit;
		cursor: pointer;
		white-space: nowrap;
	}
	.mark.on {
		color: var(--text);
	}
	.slider {
		display: flex;
		align-items: center;
		gap: var(--sp-3);
		width: 100%;
	}
	.range {
		position: relative;
		display: flex;
		flex: 1;
		min-width: 0;
	}
	input[type='range'] {
		appearance: none;
		-webkit-appearance: none;
		flex: 1;
		/* Firefox sizes a range input's min-content at ~12em, so without this it
		   refuses to shrink and paints over whatever shares its row. */
		min-width: 0;
		position: relative;
		z-index: 1;
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
		outline: var(--focus-ring);
		outline-offset: 2px;
	}
	input[type='range']:focus-visible::-moz-range-thumb {
		outline: var(--focus-ring);
		outline-offset: 2px;
	}
	input[type='range']:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.ticks {
		position: absolute;
		inset: 0;
		z-index: 2;
		pointer-events: none;
	}
	.tick {
		position: absolute;
		top: 50%;
		left: calc(0.6rem + (100% - 1.2rem) * var(--f));
		width: 0.35rem;
		height: 0.35rem;
		margin: -0.175rem 0 0 -0.175rem;
		border-radius: 50%;
		background: var(--border-strong);
	}
	.tick.reached {
		background: var(--bg);
		opacity: 0.6;
	}
	.slider-out {
		min-width: 2.5rem;
		text-align: right;
		font-size: var(--fs-sm);
		font-variant-numeric: tabular-nums;
		color: var(--text-muted);
	}
</style>
