<script lang="ts">
	/**
	 * Media scrubber. Dragging previews (`oninput`) without seeking; the player
	 * seeks only on `onchange`, fired once per release or keyboard step. The
	 * hit slab is tall enough for touch while the visible track stays thin.
	 */
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { describeMediaTime, formatMediaTime, isLiveDuration } from '$lib/media-time';

	type Own = {
		/** Position in seconds. Updated only on commit, never while dragging. */
		value?: number;
		/** Duration in seconds. `null`/`Infinity`/`0` = live or unknown: the track is disabled. */
		max?: number | null;
		/** Buffered `[start, end]` ranges in seconds, drawn as a muted fill. */
		buffered?: [number, number][];
		/** Seconds per arrow key. */
		step?: number;
		/** Fraction of the duration per PageUp/PageDown. */
		bigStep?: number;
		disabled?: boolean;
		size?: 'sm' | 'md';
		label?: string;
		formatTime?: (seconds: number, ref?: number) => string;
		/** Fired on every pointer move while scrubbing with the previewed time. */
		oninput?: (seconds: number) => void;
		/** Fired once on release or per keyboard step with the committed time. */
		onchange?: (seconds: number) => void;
		onscrubstart?: () => void;
		onscrubend?: () => void;
		/** Rendered above the time in the hover/drag tooltip (thumbnail). */
		previewSnippet?: Snippet<[number]>;
		class?: string;
		style?: string;
	};

	let {
		value = $bindable(0),
		max = null,
		buffered = [],
		step = 5,
		bigStep = 0.1,
		disabled = false,
		size = 'md',
		label = 'Seek',
		formatTime = formatMediaTime,
		oninput,
		onchange,
		onscrubstart,
		onscrubend,
		previewSnippet,
		class: klass = '',
		style: styleProp,
		...rest
	}: Omit<HTMLAttributes<HTMLDivElement>, keyof Own> & Own = $props();

	let dragging = $state(false);
	let preview = $state(0);
	let hoverFrac = $state<number | null>(null);
	let pointerId: number | null = null;

	const live = $derived(isLiveDuration(max));
	const duration = $derived(live ? 0 : (max as number));
	const inert = $derived(disabled || live);
	const clamp = (v: number) => (live ? Math.max(0, v) : Math.min(duration, Math.max(0, v)));
	const shown = $derived(clamp(dragging ? preview : value));
	const frac = (v: number) => (duration > 0 ? clamp(v) / duration : 0);
	const pct = $derived(frac(shown) * 100);
	const tipValue = $derived(dragging ? shown : hoverFrac === null ? null : hoverFrac * duration);
	const tipPct = $derived(tipValue === null ? 0 : frac(tipValue) * 100);
	const ranges = $derived(
		live
			? []
			: buffered
					.map(([a, b]) => [frac(a), frac(b)] as const)
					.filter(([a, b]) => b > a)
	);
	const valueText = $derived(describeMediaTime(shown, live ? null : duration, formatTime));

	function fracAt(el: HTMLElement, clientX: number) {
		const r = el.getBoundingClientRect();
		if (!r.width) return 0;
		let f = (clientX - r.left) / r.width;
		if (getComputedStyle(el).direction === 'rtl') f = 1 - f;
		return Math.min(1, Math.max(0, f));
	}

	function commit(v: number) {
		const next = clamp(v);
		value = next;
		onchange?.(next);
	}

	function endDrag(el: HTMLElement, fire: boolean) {
		if (pointerId !== null && typeof el.releasePointerCapture === 'function') {
			try {
				el.releasePointerCapture(pointerId);
			} catch {}
		}
		pointerId = null;
		dragging = false;
		onscrubend?.();
		if (fire) commit(preview);
	}

	function onpointerdown(e: PointerEvent) {
		if (inert || e.button !== 0 || pointerId !== null) return;
		const el = e.currentTarget as HTMLElement;
		e.preventDefault();
		pointerId = e.pointerId;
		dragging = true;
		preview = fracAt(el, e.clientX) * duration;
		if (typeof el.setPointerCapture === 'function') {
			try {
				el.setPointerCapture(e.pointerId);
			} catch {}
		}
		el.focus?.({ preventScroll: true });
		onscrubstart?.();
		oninput?.(preview);
	}

	function onpointermove(e: PointerEvent) {
		const el = e.currentTarget as HTMLElement;
		if (pointerId === e.pointerId) {
			preview = fracAt(el, e.clientX) * duration;
			oninput?.(preview);
			return;
		}
		if (inert || pointerId !== null) return;
		hoverFrac = fracAt(el, e.clientX);
	}

	function onpointerup(e: PointerEvent) {
		if (pointerId !== e.pointerId) return;
		endDrag(e.currentTarget as HTMLElement, true);
	}

	function onpointercancel(e: PointerEvent) {
		if (pointerId !== e.pointerId) return;
		endDrag(e.currentTarget as HTMLElement, false);
	}

	function onlostpointercapture(e: PointerEvent) {
		if (pointerId === null || pointerId !== e.pointerId) return;
		pointerId = null;
		dragging = false;
		onscrubend?.();
		commit(preview);
	}

	function onpointerleave() {
		hoverFrac = null;
	}

	function onkeydown(e: KeyboardEvent) {
		if (inert) return;
		const base = dragging ? preview : value;
		let next: number | null = null;
		switch (e.key) {
			case 'ArrowRight':
			case 'ArrowUp':
				next = base + step;
				break;
			case 'ArrowLeft':
			case 'ArrowDown':
				next = base - step;
				break;
			case 'PageUp':
				next = base + bigStep * duration;
				break;
			case 'PageDown':
				next = base - bigStep * duration;
				break;
			case 'Home':
				next = 0;
				break;
			case 'End':
				next = duration;
				break;
		}
		if (next === null) return;
		e.preventDefault();
		commit(next);
	}
</script>

<div
	data-tsu="SeekSlider"
	class="seek seek--{size} {klass}"
	class:seek--dragging={dragging}
	class:seek--inert={inert}
	class:seek--tip={tipValue !== null}
	style="--pct: {pct}; --tip: {tipPct};{styleProp ?? ''}"
	role="slider"
	tabindex={inert ? -1 : 0}
	aria-label={label}
	aria-orientation="horizontal"
	aria-valuemin={0}
	aria-valuemax={duration}
	aria-valuenow={shown}
	aria-valuetext={valueText}
	aria-disabled={inert ? 'true' : undefined}
	{onpointerdown}
	{onpointermove}
	{onpointerup}
	{onpointercancel}
	{onlostpointercapture}
	{onpointerleave}
	{onkeydown}
	{...rest}
>
	<span class="seek-track" data-part="track">
		{#each ranges as [a, b], i (i)}
			<i class="seek-buffered" data-part="buffered" style="--a: {a * 100}; --b: {b * 100}"></i>
		{/each}
		<i class="seek-played" data-part="played"></i>
	</span>
	<span class="seek-anchor seek-anchor--thumb" data-part="thumb-anchor">
		<i class="seek-thumb" data-part="thumb"></i>
	</span>
	{#if tipValue !== null}
		<span class="seek-anchor seek-anchor--tip" aria-hidden="true">
			<span class="seek-tip" data-part="tip">
				{#if previewSnippet}{@render previewSnippet(tipValue)}{/if}
				<span class="seek-tip-time">{formatTime(tipValue, duration)}</span>
			</span>
		</span>
	{/if}
</div>

<style>
	.seek {
		--seek-track: 3px;
		--seek-track-active: 5px;
		--seek-thumb: 12px;
		--seek-slab: 1.25rem;
		--seek-accent: var(--slider-accent, var(--accent));
		position: relative;
		display: block;
		width: 100%;
		min-height: var(--seek-slab);
		cursor: pointer;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
		outline: none;
	}
	.seek--md {
		--seek-track: 4px;
		--seek-track-active: 6px;
		--seek-thumb: 14px;
		--seek-slab: 1.5rem;
	}
	@media (pointer: coarse) {
		.seek {
			min-height: var(--touch-target-compact);
		}
	}
	.seek--inert {
		cursor: default;
		opacity: 0.45;
	}
	.seek-track {
		position: absolute;
		inset-inline: 0;
		top: 50%;
		height: var(--seek-track);
		margin-top: calc(var(--seek-track) / -2);
		border-radius: var(--r-pill);
		background: var(--bg-elevated-2);
		overflow: hidden;
		transition:
			height 120ms var(--ease),
			margin-top 120ms var(--ease);
	}
	.seek:hover .seek-track,
	.seek:focus-visible .seek-track,
	.seek--dragging .seek-track {
		height: var(--seek-track-active);
		margin-top: calc(var(--seek-track-active) / -2);
	}
	.seek--inert:hover .seek-track {
		height: var(--seek-track);
		margin-top: calc(var(--seek-track) / -2);
	}
	.seek-buffered,
	.seek-played {
		position: absolute;
		inset-block: 0;
		inset-inline-start: 0;
	}
	.seek-buffered {
		inset-inline-start: calc(var(--a) * 1%);
		width: calc((var(--b) - var(--a)) * 1%);
		background: var(--border-strong);
	}
	.seek-played {
		width: calc(var(--pct) * 1%);
		background: var(--seek-accent);
	}
	.seek-anchor {
		position: absolute;
		top: 50%;
		width: 0;
		height: 0;
		pointer-events: none;
	}
	.seek-anchor--thumb {
		inset-inline-start: calc(var(--pct) * 1%);
	}
	.seek-anchor--tip {
		inset-inline-start: calc(var(--tip) * 1%);
	}
	.seek-thumb {
		position: absolute;
		left: 0;
		top: 0;
		width: var(--seek-thumb);
		height: var(--seek-thumb);
		border-radius: 50%;
		background: var(--seek-accent);
		border: 2px solid var(--bg);
		box-shadow: var(--shadow-sm);
		transform: translate(-50%, -50%) scale(0.6);
		opacity: 0;
		transition:
			opacity 120ms var(--ease),
			transform 120ms var(--ease);
	}
	.seek:hover .seek-thumb,
	.seek:focus-visible .seek-thumb,
	.seek--dragging .seek-thumb {
		opacity: 1;
		transform: translate(-50%, -50%) scale(1);
	}
	.seek--inert .seek-thumb {
		opacity: 0;
	}
	.seek:focus-visible .seek-thumb {
		outline: var(--focus-ring);
		outline-offset: 2px;
	}
	.seek-tip {
		position: absolute;
		left: 0;
		bottom: calc(var(--seek-thumb) / 2 + var(--sp-2));
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--sp-1);
		padding: var(--sp-1) var(--sp-2);
		border-radius: var(--r-sm);
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		box-shadow: var(--shadow-md);
		color: var(--text);
		font-size: var(--fs-xs);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	@media (prefers-reduced-motion: reduce) {
		.seek-track,
		.seek-thumb {
			transition: none;
		}
	}
</style>
