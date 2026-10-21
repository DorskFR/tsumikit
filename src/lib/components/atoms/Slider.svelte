<script lang="ts">
	// Range/slider primitive. A real <input type="range"> (keeps the native
	// slider role, keyboard stepping and form participation) restyled across
	// engines from tokens. The track shows a filled portion up to the current
	// value, and an optional `output` displays the value with a correct
	// for-association. `bind:value` and all native attrs/events pass through.
	// Recolor per-instance via `--slider-accent` (defaults to the theme accent).
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { getFieldContext, warnUnlabelled } from '$lib/field-context';
	import { playSound } from '$lib/sound';

	let {
		value = $bindable(0),
		min = 0,
		max = 100,
		step = 1,
		label,
		showValue = false,
		format: formatProp,
		id: idProp,
		'aria-describedby': ariaDescribedby,
		'aria-invalid': ariaInvalid,
		invalid = false,
		ticks = false,
		marks = [],
		width,
		sound = true,
		oninput,
		onpointerdown,
		onpointerup,
		onpointercancel,
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
		/** Play UI sounds when enabled globally; false silences this instance. */
		sound?: boolean;
		id?: string;
		'aria-describedby'?: string | null;
		'aria-invalid'?: HTMLInputAttributes['aria-invalid'];
		el?: HTMLInputElement | null;
	} = $props();

	const field = getFieldContext();
	const fallbackId = $props.id();
	const id = $derived(idProp ?? field?.id ?? fallbackId);
	const isInvalid = $derived(invalid || !!field?.invalid);
	const format = $derived(formatProp ?? ((v: number) => String(v)));
	const valueText = $derived(
		marks.find((m) => m.value === Number(value))?.label ?? formatProp?.(Number(value))
	);

	$effect(() => warnUnlabelled(el, 'Slider'));

	let dragging = false;
	const discrete = $derived((+max - +min) / (+step || 1) <= 20);
	function tick() {
		if (!dragging || discrete) playSound('tick', sound);
	}
	function handleInput(e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
		tick();
		oninput?.(e);
	}
	function handlePointerDown(e: PointerEvent & { currentTarget: EventTarget & HTMLInputElement }) {
		dragging = true;
		onpointerdown?.(e);
	}
	function handlePointerUp(e: PointerEvent & { currentTarget: EventTarget & HTMLInputElement }) {
		dragging = false;
		onpointerup?.(e);
	}
	function handlePointerCancel(e: PointerEvent & { currentTarget: EventTarget & HTMLInputElement }) {
		dragging = false;
		onpointercancel?.(e);
	}
	function pick(v: number) {
		value = v;
		playSound('tick', sound);
	}

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
		aria-valuetext={valueText}
		{...rest}
		oninput={handleInput}
		onpointerdown={handlePointerDown}
		onpointerup={handlePointerUp}
		onpointercancel={handlePointerCancel}
		aria-describedby={ariaDescribedby ?? field?.describedBy}
		aria-invalid={ariaInvalid ?? (isInvalid ? 'true' : undefined)}
	/>
	{#if tickValues.length > 0}
		<span class="ticks" aria-hidden="true">
			{#each tickValues as t, i (`${i}:${t}`)}
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
			{#each marks as m, i (`${i}:${m.value}`)}
				<button type="button" class="mark" class:on={Number(value) === m.value} style="--f: {frac(m.value)}" tabindex="-1" onclick={() => pick(m.value)}>{m.label}</button>
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
		--thumb: 1.2rem;
		--track: 0.35rem;
		--halo: 0 0 0 4px color-mix(in srgb, var(--slider-accent, var(--accent)) 20%, transparent);
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
		height: var(--track);
		border-radius: var(--r-pill);
		background: linear-gradient(
			to right,
			var(--slider-accent, var(--accent)) var(--pct),
			var(--bg-elevated-2) var(--pct)
		);
	}
	input[type='range']::-moz-range-track {
		height: var(--track);
		border-radius: var(--r-pill);
		background: var(--bg-elevated-2);
	}
	input[type='range']::-moz-range-progress {
		height: var(--track);
		border-radius: var(--r-pill);
		background: var(--slider-accent, var(--accent));
	}
	/* Thumb */
	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		-webkit-appearance: none;
		margin-top: calc((var(--track) - var(--thumb)) / 2);
		width: var(--thumb);
		height: var(--thumb);
		border-radius: var(--r-pill);
		background: var(--slider-accent, var(--accent));
		border: 2px solid var(--bg);
		box-shadow: var(--shadow-sm);
		transition:
			scale var(--dur-press) var(--ease-out),
			box-shadow var(--dur-fast) var(--ease);
	}
	input[type='range']::-moz-range-thumb {
		width: var(--thumb);
		height: var(--thumb);
		border-radius: var(--r-pill);
		background: var(--slider-accent, var(--accent));
		border: 2px solid var(--bg);
		box-shadow: var(--shadow-sm);
		transition:
			scale var(--dur-press) var(--ease-out),
			box-shadow var(--dur-fast) var(--ease);
	}
	@media (hover: hover) and (pointer: fine) {
		input[type='range']:not(:disabled):hover::-webkit-slider-thumb {
			box-shadow: var(--shadow-sm), var(--halo);
		}
		input[type='range']:not(:disabled):hover::-moz-range-thumb {
			box-shadow: var(--shadow-sm), var(--halo);
		}
	}
	input[type='range']:not(:disabled):active::-webkit-slider-thumb {
		scale: 1.15;
	}
	input[type='range']:not(:disabled):active::-moz-range-thumb {
		scale: 1.15;
	}
	input[type='range']:focus-visible {
		outline: none;
	}
	input[type='range']:focus-visible::-webkit-slider-thumb {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
	}
	input[type='range']:focus-visible::-moz-range-thumb {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
	}
	@media (pointer: coarse) {
		input[type='range'] {
			min-height: var(--touch-target-compact);
		}
	}
	input[type='range']:disabled {
		opacity: var(--disabled-opacity);
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
		left: calc(var(--thumb) / 2 + (100% - var(--thumb)) * var(--f));
		width: var(--track);
		height: var(--track);
		margin: calc(var(--track) / -2) 0 0 calc(var(--track) / -2);
		border-radius: var(--r-pill);
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
