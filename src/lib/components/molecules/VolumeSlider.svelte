<script lang="ts">
	/**
	 * Compact volume control: a mute toggle whose glyph tracks the level, and a
	 * short slider. `oninput` fires on every change, `onchange` once per
	 * release or keyboard/wheel step. The slider hides on touch devices by
	 * default (`hideOnTouch`), where the OS owns volume; the mute button stays.
	 */
	import type { HTMLAttributes } from 'svelte/elements';
	import type { IconName } from '$lib/components/atoms/Icon.svelte';
	import IconButton from '$lib/components/molecules/IconButton.svelte';

	type Own = {
		/** Level 0–1. */
		value?: number;
		muted?: boolean;
		orientation?: 'horizontal' | 'vertical';
		size?: 'sm' | 'md';
		/** Level per arrow key or wheel notch. */
		step?: number;
		disabled?: boolean;
		hideOnTouch?: boolean;
		label?: string;
		muteLabel?: string;
		unmuteLabel?: string;
		oninput?: (value: number) => void;
		onchange?: (value: number) => void;
		onmutechange?: (muted: boolean) => void;
		class?: string;
		style?: string;
	};

	let {
		value = $bindable(1),
		muted = $bindable(false),
		orientation = 'horizontal',
		size = 'sm',
		step = 0.05,
		disabled = false,
		hideOnTouch = true,
		label = 'Volume',
		muteLabel = 'Mute',
		unmuteLabel = 'Unmute',
		oninput,
		onchange,
		onmutechange,
		class: klass = '',
		style: styleProp,
		...rest
	}: Omit<HTMLAttributes<HTMLDivElement>, keyof Own> & Own = $props();

	let dragging = $state(false);
	let pointerId: number | null = null;

	const clamp = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 1e4) / 1e4;
	const level = $derived(muted ? 0 : clamp(value));
	const pct = $derived(Math.round(level * 100));
	const vertical = $derived(orientation === 'vertical');
	const icon = $derived<IconName>(
		muted ? 'volume-mute' : level === 0 ? 'volume' : level < 0.5 ? 'volume-low' : 'volume-high'
	);
	const valueText = $derived(muted ? 'Muted' : `${pct}%`);

	function setMuted(m: boolean) {
		if (m === muted) return;
		muted = m;
		onmutechange?.(m);
	}

	function apply(v: number) {
		const next = clamp(v);
		value = next;
		if (next > 0) setMuted(false);
		oninput?.(next);
		return next;
	}

	function commit(v: number) {
		onchange?.(apply(v));
	}

	function fracAt(el: HTMLElement, e: PointerEvent) {
		const r = el.getBoundingClientRect();
		let f: number;
		if (vertical) {
			f = r.height ? 1 - (e.clientY - r.top) / r.height : 0;
		} else {
			f = r.width ? (e.clientX - r.left) / r.width : 0;
			if (getComputedStyle(el).direction === 'rtl') f = 1 - f;
		}
		return clamp(f);
	}

	function release(el: HTMLElement) {
		if (pointerId !== null && typeof el.releasePointerCapture === 'function') {
			try {
				el.releasePointerCapture(pointerId);
			} catch {}
		}
		pointerId = null;
		dragging = false;
	}

	function onpointerdown(e: PointerEvent) {
		if (disabled || e.button !== 0 || pointerId !== null) return;
		const el = e.currentTarget as HTMLElement;
		e.preventDefault();
		pointerId = e.pointerId;
		dragging = true;
		if (typeof el.setPointerCapture === 'function') {
			try {
				el.setPointerCapture(e.pointerId);
			} catch {}
		}
		el.focus?.({ preventScroll: true });
		apply(fracAt(el, e));
	}

	function onpointermove(e: PointerEvent) {
		if (pointerId !== e.pointerId) return;
		apply(fracAt(e.currentTarget as HTMLElement, e));
	}

	function onpointerup(e: PointerEvent) {
		if (pointerId !== e.pointerId) return;
		release(e.currentTarget as HTMLElement);
		onchange?.(value);
	}

	function onpointercancel(e: PointerEvent) {
		if (pointerId !== e.pointerId) return;
		release(e.currentTarget as HTMLElement);
		onchange?.(value);
	}

	function onlostpointercapture(e: PointerEvent) {
		if (pointerId === null || pointerId !== e.pointerId) return;
		pointerId = null;
		dragging = false;
		onchange?.(value);
	}

	function onkeydown(e: KeyboardEvent) {
		if (disabled) return;
		const base = level;
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
				next = base + step * 2;
				break;
			case 'PageDown':
				next = base - step * 2;
				break;
			case 'Home':
				next = 0;
				break;
			case 'End':
				next = 1;
				break;
		}
		if (next === null) return;
		e.preventDefault();
		commit(next);
	}

	function wheel(el: HTMLElement) {
		const onwheel = (e: WheelEvent) => {
			if (disabled) return;
			const d = e.deltaY || e.deltaX;
			if (!d) return;
			e.preventDefault();
			commit(level + (d < 0 ? step : -step));
		};
		el.addEventListener('wheel', onwheel, { passive: false });
		return () => el.removeEventListener('wheel', onwheel);
	}
</script>

<div
	data-tsu="VolumeSlider"
	class="vol vol--{size} vol--{orientation} {klass}"
	class:vol--hide-touch={hideOnTouch}
	class:vol--dragging={dragging}
	class:vol--muted={muted}
	style="--pct: {pct};{styleProp ?? ''}"
	{...rest}
>
	<IconButton
		{icon}
		label={muted ? unmuteLabel : muteLabel}
		pressed={muted}
		box="sm"
		size={size === 'sm' ? 16 : 18}
		{disabled}
		onclick={() => setMuted(!muted)}
		data-part="mute"
	/>
	<div
		class="vol-slab"
		data-part="slab"
		role="slider"
		tabindex={disabled ? -1 : 0}
		aria-label={label}
		aria-orientation={orientation}
		aria-valuemin={0}
		aria-valuemax={100}
		aria-valuenow={pct}
		aria-valuetext={valueText}
		aria-disabled={disabled ? 'true' : undefined}
		{onpointerdown}
		{onpointermove}
		{onpointerup}
		{onpointercancel}
		{onlostpointercapture}
		{onkeydown}
		{@attach wheel}
	>
		<span class="vol-track" data-part="track">
			<i class="vol-fill" data-part="fill"></i>
		</span>
		<span class="vol-anchor">
			<i class="vol-thumb" data-part="thumb"></i>
		</span>
	</div>
</div>

<style>
	.vol {
		--vol-track: 3px;
		--vol-thumb: 10px;
		--vol-length: 5rem;
		--vol-accent: var(--slider-accent, var(--accent));
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
		vertical-align: middle;
	}
	.vol--md {
		--vol-track: 4px;
		--vol-thumb: 12px;
		--vol-length: 7rem;
	}
	.vol--vertical {
		flex-direction: column-reverse;
	}
	.vol-slab {
		position: relative;
		flex: none;
		width: var(--vol-length);
		min-height: 1.25rem;
		cursor: pointer;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
		outline: none;
		border-radius: var(--r-sm);
	}
	.vol--vertical .vol-slab {
		width: 1.25rem;
		height: var(--vol-length);
		min-height: 0;
	}
	@media (pointer: coarse) {
		.vol-slab {
			min-height: var(--touch-target-compact);
		}
		.vol--vertical .vol-slab {
			min-width: var(--touch-target-compact);
		}
	}
	@media (hover: none) and (pointer: coarse) {
		.vol--hide-touch .vol-slab {
			display: none;
		}
	}
	.vol-slab[aria-disabled='true'] {
		cursor: default;
		opacity: 0.45;
	}
	.vol-slab:focus-visible {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
	}
	.vol-track {
		position: absolute;
		inset-inline: 0;
		top: 50%;
		height: var(--vol-track);
		margin-top: calc(var(--vol-track) / -2);
		border-radius: var(--r-pill);
		background: var(--bg-elevated-2);
		overflow: hidden;
	}
	.vol--vertical .vol-track {
		inset-inline: auto;
		inset-block: 0;
		left: 50%;
		top: auto;
		width: var(--vol-track);
		height: auto;
		margin-top: 0;
		margin-left: calc(var(--vol-track) / -2);
	}
	.vol-fill {
		position: absolute;
		inset-block: 0;
		inset-inline-start: 0;
		width: calc(var(--pct) * 1%);
		background: var(--vol-accent);
	}
	.vol--vertical .vol-fill {
		inset-inline: 0;
		inset-block: auto 0;
		width: auto;
		height: calc(var(--pct) * 1%);
	}
	.vol-anchor {
		position: absolute;
		top: 50%;
		inset-inline-start: calc(var(--pct) * 1%);
		width: 0;
		height: 0;
		pointer-events: none;
	}
	.vol--vertical .vol-anchor {
		top: auto;
		bottom: calc(var(--pct) * 1%);
		inset-inline-start: 50%;
	}
	.vol-thumb {
		position: absolute;
		left: 0;
		top: 0;
		width: var(--vol-thumb);
		height: var(--vol-thumb);
		border-radius: 50%;
		background: var(--vol-accent);
		border: 2px solid var(--bg);
		box-shadow: var(--shadow-sm);
		transform: translate(-50%, -50%) scale(0.6);
		opacity: 0;
		transition:
			opacity 120ms var(--ease),
			transform 120ms var(--ease);
	}
	.vol-slab:hover .vol-thumb,
	.vol-slab:focus-visible .vol-thumb,
	.vol--dragging .vol-thumb {
		opacity: 1;
		transform: translate(-50%, -50%) scale(1);
	}
	.vol--muted .vol-fill {
		background: var(--text-faint);
	}
	@media (prefers-reduced-motion: reduce) {
		.vol-thumb {
			transition: none;
		}
	}
</style>
