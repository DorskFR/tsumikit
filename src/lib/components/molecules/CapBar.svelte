<script lang="ts">
	import type { Snippet } from 'svelte';
	import {
		capFromPointer,
		capKeyStep,
		capPercent,
		capTone,
		clampCap,
		isStacked,
		markerPercent,
		resolveCap,
		snapCap
	} from '$lib/cap-bar';
	import { browser } from '$lib/env';

	let {
		value = 0,
		cap = $bindable(100),
		min = 0,
		max = 100,
		step = 5,
		warnAt = 75,
		size = 'md',
		layout = 'row',
		stackBelow,
		marker,
		markerLabel,
		markerTone = 'neutral',
		uncappedLabel = 'no cap',
		clearAtMax = false,
		capLabel,
		capValueText,
		label,
		labelWidth = '96px',
		readout,
		readoutWidth = 'auto',
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
		/** Cap position; bindable, moved by drag/keyboard. `null` is uncapped. */
		cap?: number | null;
		min?: number;
		max?: number;
		/** Snap increment for drag and keyboard. */
		step?: number;
		/** Consumption at which the fill turns `--warn`. */
		warnAt?: number;
		size?: 'md' | 'lg';
		/** `'stacked'` puts label + readout on a line above a full-width track. */
		layout?: 'row' | 'stacked';
		/** Own-width threshold (px/em/rem) below which `layout` becomes `'stacked'`. */
		stackBelow?: string;
		/** Reference position on the track, in the same units as `value`. */
		marker?: number | null;
		markerLabel?: string;
		markerTone?: 'neutral' | 'ok' | 'warn' | 'danger';
		/** Spoken and readout text for `cap === null`. */
		uncappedLabel?: string;
		/** Moving the cap to `max` yields `null` instead of `max`. */
		clearAtMax?: boolean;
		/** Accessible name of the cap handle. Defaults to `${label} cap`. */
		capLabel?: string;
		/** Spoken value of the cap handle. Defaults to `cap ${cap}%`. */
		capValueText?: string | ((cap: number | null) => string);
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
		oninput?: (cap: number | null) => void;
		/** Fires once the cap is committed (pointer release / key-up). */
		onchange?: (cap: number | null) => void;
		class?: string;
		style?: string;
	} = $props();

	const uncapped = $derived(cap === null);
	const range = $derived(max - min || 1);
	const pct = $derived(clampCap(((value - min) / range) * 100, 0, 100));
	const capPct = $derived(capPercent(cap, min, max));
	const markerPct = $derived(markerPercent(marker, min, max));
	const tone = $derived(capTone(value, cap, warnAt));
	const readoutText = $derived(hint ? `${value}% · ${hint}` : `${value}%`);
	const capText = $derived(uncapped ? uncappedLabel : `cap ${cap}%`);
	const tip = $derived(tooltip ?? `${capText} — drag the bar`);
	const readoutTitle = $derived(readout === undefined ? readoutText : typeof readout === 'string' ? readout : undefined);
	const ariaLabel = $derived(capLabel ?? (typeof label === 'string' ? `${label} cap` : 'cap'));
	const ariaValueText = $derived(
		capValueText === undefined ? capText : typeof capValueText === 'string' ? capValueText : capValueText(cap)
	);

	const uid = $props.id();
	const markerId = $derived(markerLabel ? `${uid}-marker` : undefined);

	let root = $state<HTMLElement | null>(null);
	let trackEl = $state<HTMLDivElement | null>(null);
	let width = $state(0);
	let limit = $state(0);
	let dragging = $state(false);
	let keying = $state(false);
	let committed = cap;

	const stacked = $derived(isStacked(layout, width, limit));

	function toPx(length: string, el: HTMLElement): number {
		const n = Number.parseFloat(length);
		const fontSize = (node: Element) => Number.parseFloat(getComputedStyle(node).fontSize);
		if (length.endsWith('rem')) return n * fontSize(document.documentElement);
		if (length.endsWith('em')) return n * fontSize(el);
		return n;
	}

	$effect(() => {
		if (!browser || !root || !stackBelow) return;
		const el = root;
		limit = toPx(stackBelow, el);
		const observer = new ResizeObserver(([entry]) => {
			width = entry.contentRect.width;
		});
		observer.observe(el);
		return () => observer.disconnect();
	});

	function setCap(next: number) {
		const resolved = resolveCap(next, clearAtMax, max);
		if (resolved === cap) return;
		cap = resolved;
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
		const next = capKeyStep(e.key, e.shiftKey, snapCap(cap ?? max, step, min, max), step, min, max);
		if (next === null) return;
		e.preventDefault();
		keying = true;
		setCap(next);
	}
	function keyUp(e: KeyboardEvent) {
		if (readonly || capKeyStep(e.key, e.shiftKey, cap ?? max, step, min, max) === null) return;
		commit();
	}
</script>

<div
	data-tsu="CapBar"
	bind:this={root}
	class="cap-bar size-{size} tone-{tone} {klass}"
	class:readonly
	class:dragging
	class:keying
	class:stacked
	class:uncapped
	style="--label-w: {labelWidth}; --readout-w: {readoutWidth}; --pct: {pct}%; --cap: {capPct}%; --marker: {markerPct ??
		0}%; {styleProp}"
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
		{#if markerPct !== null}
			<div class="marker marker-{markerTone}" title={markerLabel} aria-hidden="true"></div>
			{#if markerLabel}
				<span class="sr-only" id={markerId}>{markerLabel}</span>
			{/if}
		{/if}
		<div
			class="handle"
			role="slider"
			tabindex={readonly ? -1 : 0}
			aria-label={ariaLabel}
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={cap ?? max}
			aria-valuetext={ariaValueText}
			aria-describedby={markerId}
			aria-disabled={readonly ? 'true' : undefined}
			onkeydown={keyDown}
			onkeyup={keyUp}
			onblur={() => (keying = false)}
		></div>
		<div class="bubble" aria-hidden="true">{capText}</div>
	</div>
	<div class="readout" title={readoutTitle}>
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
	.uncapped .track::after {
		display: none;
	}
	.marker {
		position: absolute;
		top: 50%;
		left: var(--marker);
		width: 2px;
		height: calc(var(--track-h) + 6px);
		transform: translate(-50%, -50%);
		border-radius: 1px;
		background: var(--marker-color, var(--text-muted));
		pointer-events: none;
		z-index: 2;
	}
	.marker-ok {
		--marker-color: var(--ok);
	}
	.marker-warn {
		--marker-color: var(--warn);
	}
	.marker-danger {
		--marker-color: var(--danger);
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
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
	.uncapped .handle {
		opacity: 0.4;
	}
	.handle:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.bubble {
		position: absolute;
		bottom: calc(100% + 8px);
		left: var(--cap);
		transform: translateX(-50%);
		padding: 1px var(--sp-1);
		border: 1px solid var(--border-strong);
		border-radius: var(--r-sm);
		background: var(--bg-elevated-2);
		box-shadow: var(--shadow-sm);
		color: var(--text);
		font-size: var(--fs-xs);
		line-height: 1.4;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		pointer-events: none;
		opacity: 0;
		visibility: hidden;
		transition:
			opacity 0.12s var(--ease),
			visibility 0.12s;
		z-index: 3;
	}
	.dragging .bubble,
	.keying .bubble {
		opacity: 1;
		visibility: visible;
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
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
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
	.cap-bar.stacked {
		grid-template-columns: 1fr auto;
	}
	.cap-bar.stacked .label {
		grid-area: 1 / 1;
	}
	.cap-bar.stacked .readout {
		grid-area: 1 / 2;
	}
	.cap-bar.stacked .track {
		grid-area: 2 / 1 / 3 / -1;
	}
	.cap-bar.stacked .caption {
		grid-column: 1 / -1;
	}
	@media (prefers-reduced-motion: reduce) {
		.fill,
		.bubble {
			transition: none;
		}
	}
</style>
