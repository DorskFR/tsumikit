<script lang="ts">
	/**
	 * Media scrubber. Dragging previews (`oninput`) without seeking; the player
	 * seeks only on `onchange`, fired once per release or keyboard step. The
	 * hit slab is tall enough for touch while the visible track stays thin.
	 */
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { describeMediaTime, formatMediaTime, isLiveDuration } from '$lib/media-time';
	import { playSound } from '$lib/sound';

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
		/** Play UI sounds when enabled globally; false silences this instance. */
		sound?: boolean;
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
		sound = true,
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
	const discrete = $derived(duration > 0 && duration / step <= 20);

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
			if (discrete) playSound('tick', sound);
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
		playSound('tick', sound);
		commit(next);
	}
</script>

<div
	data-tsu="SeekSlider"
	class="seek seek--{size} {klass}"
	class:seek--dragging={dragging}
	class:seek--inert={inert}
	class:seek--tip={tipValue !== null}
	style={styleProp}
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
			<i class="seek-buffered" data-part="buffered" style:inset-inline-start="{a * 100}%" style:width="{(b - a) * 100}%"></i>
		{/each}
		<i class="seek-played" data-part="played" style:width="{pct}%"></i>
	</span>
	<span class="seek-anchor seek-anchor--thumb" data-part="thumb-anchor" style:inset-inline-start="{pct}%">
		<i class="seek-thumb" data-part="thumb"></i>
	</span>
	{#if tipValue !== null}
		<span class="seek-anchor seek-anchor--tip" aria-hidden="true" style:inset-inline-start="{tipPct}%">
			<span class="seek-tip" data-part="tip">
				{#if previewSnippet}{@render previewSnippet(tipValue)}{/if}
				<span class="seek-tip-time">{formatTime(tipValue, duration)}</span>
			</span>
		</span>
	{/if}
</div>

<style>
	.seek {
		position: relative;
		display: block;
		width: 100%;
		min-height: 1.25rem;
		cursor: pointer;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
		outline: none;
	}
	.seek--md {
		min-height: 1.5rem;
	}
	@media (pointer: coarse) {
		.seek {
			min-height: var(--touch-target-compact);
		}
	}
	.seek--inert {
		cursor: not-allowed;
		opacity: var(--disabled-opacity);
	}
	.seek-track {
		position: absolute;
		inset-inline: 0;
		top: 50%;
		height: 3px;
		margin-top: -1.5px;
		border-radius: var(--r-pill);
		background: var(--track-fill);
		overflow: hidden;
		transform-origin: center;
		transition: scale var(--dur-fast) var(--ease);
	}
	.seek--md .seek-track {
		height: 4px;
		margin-top: -2px;
	}
	.seek:focus-visible .seek-track,
	.seek--dragging .seek-track {
		scale: 1 1.6;
	}
	.seek-buffered,
	.seek-played {
		position: absolute;
		inset-block: 0;
		inset-inline-start: 0;
	}
	.seek-buffered {
		background: var(--border-strong);
	}
	.seek-played {
		background: var(--accent);
	}
	.seek-anchor {
		position: absolute;
		top: 50%;
		width: 0;
		height: 0;
		pointer-events: none;
	}
	.seek-thumb {
		position: absolute;
		left: 0;
		top: 0;
		width: 12px;
		height: 12px;
		border-radius: var(--r-pill);
		background: var(--accent);
		border: 2px solid var(--bg);
		box-shadow: var(--thumb-shadow);
		transform: translate(-50%, -50%);
		scale: 0.6;
		opacity: 0;
		transition:
			opacity var(--dur-fast) var(--ease),
			scale var(--dur-press) var(--ease-out),
			box-shadow var(--dur-fast) var(--ease);
	}
	.seek--md .seek-thumb {
		width: 14px;
		height: 14px;
	}
	.seek:focus-visible .seek-thumb,
	.seek--dragging .seek-thumb {
		opacity: 1;
		scale: 1;
	}
	.seek--dragging .seek-thumb {
		scale: 1.15;
	}
	@media (hover: hover) and (pointer: fine) {
		.seek:not(.seek--inert):hover .seek-track {
			scale: 1 1.6;
		}
		.seek:not(.seek--inert):hover .seek-thumb {
			opacity: 1;
			scale: 1;
			box-shadow: var(--thumb-shadow), 0 0 0 4px color-mix(in srgb, var(--accent) 20%, transparent);
		}
		.seek--dragging .seek-thumb {
			scale: 1.15;
		}
	}
	.seek--inert .seek-thumb {
		opacity: 0;
	}
	.seek:focus-visible .seek-thumb {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
	}
	.seek-tip {
		position: absolute;
		left: 0;
		bottom: calc(6px + var(--sp-2));
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--sp-1);
		padding: var(--sp-1) var(--sp-2);
		border-radius: var(--r-sm);
		background: var(--raised-fill);
		border: var(--edge-width) solid var(--surface-edge);
		box-shadow: var(--raised-shadow);
		color: var(--text);
		font-size: var(--fs-xs);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.seek--md .seek-tip {
		bottom: calc(7px + var(--sp-2));
	}
</style>
