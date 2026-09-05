<script lang="ts">
	import type { Snippet } from 'svelte';
	import { capFromPointer, capKeyStep, capTone, clampCap, snapCap } from '$lib/cap-bar';

	let {
		value = 0,
		cap = $bindable(100),
		min = 0,
		max = 100,
		step = 5,
		warnAt = 75,
		size = 'md',
		label,
		labelWidth = '96px',
		readout,
		readoutWidth = '76px',
		hint,
		caption,
		tooltip,
		readonly = false,
		oninput,
		onchange,
		class: klass = '',
		style: styleProp = ''
	}: {
		/** Consumption, in percent of `max`. */
		value?: number;
		/** Cap position; bindable, moved by drag/keyboard. */
		cap?: number;
		min?: number;
		max?: number;
		/** Snap increment for drag and keyboard. */
		step?: number;
		/** Consumption at which the fill turns `--warn`. */
		warnAt?: number;
		size?: 'md' | 'lg';
		label?: string | Snippet;
		labelWidth?: string;
		/** Overrides the default `{value}% · {hint}` readout. */
		readout?: string | Snippet;
		readoutWidth?: string;
		hint?: string;
		caption?: Snippet;
		/** Track tooltip; defaults to "cap N% — drag the bar". */
		tooltip?: string;
		readonly?: boolean;
		/** Fires live while dragging or stepping. */
		oninput?: (cap: number) => void;
		/** Fires once the cap is committed (pointer release / key-up). */
		onchange?: (cap: number) => void;
		class?: string;
		style?: string;
	} = $props();

	const range = $derived(max - min || 1);
	const pct = $derived(clampCap(((value - min) / range) * 100, 0, 100));
	const capPct = $derived(clampCap(((cap - min) / range) * 100, 0, 100));
	const tone = $derived(capTone(value, cap, warnAt));
	const readoutText = $derived(hint ? `${value}% · ${hint}` : `${value}%`);
	const tip = $derived(tooltip ?? `cap ${cap}% — drag the bar`);
	const ariaLabel = $derived(typeof label === 'string' ? `${label} cap` : 'cap');

	let trackEl = $state<HTMLDivElement | null>(null);
	let dragging = $state(false);
	let committed = cap;

	function setCap(next: number) {
		if (next === cap) return;
		cap = next;
		oninput?.(cap);
	}
	function commit() {
		if (cap === committed) return;
		committed = cap;
		onchange?.(cap);
	}

	function pointerDown(e: PointerEvent) {
		if (readonly || !trackEl || e.button !== 0) return;
		e.preventDefault();
		dragging = true;
		trackEl.setPointerCapture(e.pointerId);
		setCap(capFromPointer(e.clientX, trackEl.getBoundingClientRect(), step, min, max));
		trackEl.querySelector<HTMLElement>('.handle')?.focus();
	}
	function pointerMove(e: PointerEvent) {
		if (!dragging || !trackEl) return;
		setCap(capFromPointer(e.clientX, trackEl.getBoundingClientRect(), step, min, max));
	}
	function pointerUp() {
		if (!dragging) return;
		dragging = false;
		commit();
	}
	function keyDown(e: KeyboardEvent) {
		if (readonly) return;
		const next = capKeyStep(e.key, e.shiftKey, snapCap(cap, step, min, max), step, min, max);
		if (next === null) return;
		e.preventDefault();
		setCap(next);
	}
	function keyUp(e: KeyboardEvent) {
		if (readonly || capKeyStep(e.key, e.shiftKey, cap, step, min, max) === null) return;
		commit();
	}
</script>

<div
	data-tsu="CapBar"
	class="cap-bar size-{size} tone-{tone} {klass}"
	class:readonly
	class:dragging
	style="--label-w: {labelWidth}; --readout-w: {readoutWidth}; --pct: {pct}%; --cap: {capPct}%; {styleProp}"
>
	{#if label}
		<div class="label">
			{#if typeof label === 'string'}{label}{:else}{@render label()}{/if}
		</div>
	{/if}
	<div
		class="track"
		role="presentation"
		bind:this={trackEl}
		title={tip}
		onpointerdown={pointerDown}
		onpointermove={pointerMove}
		onpointerup={pointerUp}
		onpointercancel={pointerUp}
	>
		<div class="fill"></div>
		<div
			class="handle"
			role="slider"
			tabindex={readonly ? -1 : 0}
			aria-label={ariaLabel}
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={cap}
			aria-valuetext="cap {cap}%"
			aria-disabled={readonly ? 'true' : undefined}
			onkeydown={keyDown}
			onkeyup={keyUp}
		></div>
	</div>
	<div class="readout">
		{#if readout === undefined}{readoutText}{:else if typeof readout === 'string'}{readout}{:else}{@render readout()}{/if}
	</div>
	{#if caption}
		<div class="caption">{@render caption()}</div>
	{/if}
</div>

<style>
	.cap-bar {
		display: grid;
		grid-template-columns: var(--label-w) 1fr var(--readout-w);
		align-items: center;
		column-gap: var(--sp-3);
		row-gap: var(--sp-1);
		width: 100%;
		font-size: var(--fs-sm);
		--track-h: 6px;
		--fill: var(--ok);
	}
	.cap-bar.size-lg {
		--track-h: 10px;
	}
	.tone-warn {
		--fill: var(--warn);
	}
	.tone-danger {
		--fill: var(--danger);
	}
	.label {
		color: var(--text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.cap-bar:not(:has(.label)) .track {
		grid-column: 1 / 3;
	}
	.track {
		position: relative;
		height: var(--track-h);
		border-radius: var(--r-pill);
		background: color-mix(in oklab, var(--fill) 26%, var(--bg));
		cursor: ew-resize;
		touch-action: none;
		user-select: none;
	}
	.track::after {
		content: '';
		position: absolute;
		inset: 0 0 0 var(--cap);
		border-radius: 0 var(--r-pill) var(--r-pill) 0;
		background: var(--bg);
		box-shadow: inset 0 0 0 1px var(--border);
		pointer-events: none;
	}
	.fill {
		position: absolute;
		inset: 0 auto 0 0;
		width: var(--pct);
		border-radius: var(--r-pill);
		background: var(--fill);
		transition: width 0.2s var(--ease);
		z-index: 1;
	}
	.handle {
		position: absolute;
		top: 50%;
		left: var(--cap);
		width: 3px;
		height: 16px;
		transform: translate(-50%, -50%);
		border-radius: 2px;
		background: var(--text);
		box-shadow: 0 0 0 2px var(--surface);
		cursor: ew-resize;
		z-index: 2;
	}
	.handle:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.readonly .track,
	.readonly .handle {
		cursor: default;
		pointer-events: none;
	}
	.readonly .handle {
		opacity: 0.6;
	}
	.readout {
		text-align: right;
		font-variant-numeric: tabular-nums;
		color: var(--text-muted);
		white-space: nowrap;
	}
	.caption {
		grid-column: 2 / 3;
		font-size: var(--fs-xs);
		color: var(--text-faint);
	}
	.cap-bar:not(:has(.label)) .caption {
		grid-column: 1 / 3;
	}
	@media (prefers-reduced-motion: reduce) {
		.fill {
			transition: none;
		}
	}
</style>
