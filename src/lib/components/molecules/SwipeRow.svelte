<script lang="ts" module>
	import type { IconName } from '$lib/components/atoms/Icon.svelte';
	import type { Tone } from '$lib/tone';

	export interface SwipeAction {
		label: string;
		icon?: IconName;
		tone?: Tone;
		onaction: () => void;
	}
</script>

<script lang="ts">
	/**
	 * List row with a hidden action on each side, revealed by a horizontal swipe.
	 * A swipe past `threshold` (fraction of the row width) fires the action on
	 * release; a shorter one snaps back. The axis is locked after a few pixels:
	 * a drag that is more vertical than horizontal is left to the scroller.
	 * The same actions are reachable as visually hidden buttons for keyboard
	 * and screen-reader users.
	 *
	 * On touch the browser implicitly captures the pointer on the element under
	 * the finger; taking capture on the row makes that child fire a bubbling
	 * `lostpointercapture`, which must not be read as a cancel.
	 */
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import { canonicalTone } from '$lib/tone';

	type Own = {
		children: Snippet;
		/** Revealed on a rightward swipe. */
		leadingAction?: SwipeAction;
		/** Revealed on a leftward swipe. */
		trailingAction?: SwipeAction;
		/** Custom pane content; defaults to the action's icon and label. */
		leading?: Snippet<[SwipeAction, boolean]>;
		trailing?: Snippet<[SwipeAction, boolean]>;
		/** Fraction of the row width the content must travel to fire. */
		threshold?: number;
		disabled?: boolean;
		class?: string;
		style?: string;
	};

	let {
		children,
		leadingAction,
		trailingAction,
		leading,
		trailing,
		threshold = 0.35,
		disabled = false,
		class: klass = '',
		style: styleProp,
		...rest
	}: Omit<HTMLAttributes<HTMLDivElement>, keyof Own> & Own = $props();

	const SLOP = 8;
	const FALLBACK_WIDTH = 320;

	let offset = $state(0);
	let dragging = $state(false);
	let settling = $state(false);

	let pointerId: number | null = null;
	let startX = 0;
	let startY = 0;
	let width = $state(0);
	let locked: 'x' | 'y' | null = null;
	let swallowClick = false;
	let settleTimer: ReturnType<typeof setTimeout> | undefined;

	const armed = $derived(width > 0 && Math.abs(offset) >= width * threshold);
	const side = $derived(offset > 0 ? 'leading' : offset < 0 ? 'trailing' : null);
	const active = $derived(side === 'leading' ? leadingAction : side === 'trailing' ? trailingAction : undefined);
	const tone = $derived(canonicalTone(active?.tone ?? 'neutral'));

	function reducedMotion() {
		return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	function release(el: HTMLElement) {
		if (pointerId !== null && typeof el.releasePointerCapture === 'function') {
			try {
				el.releasePointerCapture(pointerId);
			} catch {}
		}
		pointerId = null;
		locked = null;
		dragging = false;
	}

	function settle() {
		clearTimeout(settleTimer);
		if (reducedMotion()) {
			offset = 0;
			return;
		}
		settling = true;
		offset = 0;
		settleTimer = setTimeout(() => (settling = false), 220);
	}

	function onpointerdown(e: PointerEvent) {
		swallowClick = false;
		if (disabled || e.button !== 0 || pointerId !== null) return;
		if (!leadingAction && !trailingAction) return;
		const el = e.currentTarget as HTMLElement;
		pointerId = e.pointerId;
		startX = e.clientX;
		startY = e.clientY;
		width = el.clientWidth || FALLBACK_WIDTH;
		locked = null;
		clearTimeout(settleTimer);
		settling = false;
	}

	function onpointermove(e: PointerEvent) {
		if (pointerId !== e.pointerId) return;
		const el = e.currentTarget as HTMLElement;
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;
		if (locked === null) {
			if (Math.hypot(dx, dy) < SLOP) return;
			if (Math.abs(dy) >= Math.abs(dx)) {
				locked = 'y';
				release(el);
				return;
			}
			locked = 'x';
			dragging = true;
			swallowClick = true;
			if (typeof el.setPointerCapture === 'function') {
				try {
					el.setPointerCapture(e.pointerId);
				} catch {}
			}
		}
		if (locked !== 'x') return;
		const max = leadingAction ? width : 0;
		const min = trailingAction ? -width : 0;
		offset = Math.max(min, Math.min(max, dx));
	}

	function onpointerup(e: PointerEvent) {
		if (pointerId !== e.pointerId) return;
		const el = e.currentTarget as HTMLElement;
		const fire = locked === 'x' && armed ? active : undefined;
		release(el);
		settle();
		fire?.onaction();
	}

	function onpointercancel(e: PointerEvent) {
		if (pointerId !== e.pointerId) return;
		release(e.currentTarget as HTMLElement);
		settle();
	}

	function onclickcapture(e: MouseEvent) {
		if (!swallowClick) return;
		swallowClick = false;
		e.stopPropagation();
		e.preventDefault();
	}

	function onlostpointercapture(e: PointerEvent) {
		if (pointerId === null || e.pointerId !== pointerId || e.target !== e.currentTarget) return;
		pointerId = null;
		locked = null;
		dragging = false;
		settle();
	}
</script>

<div
	data-tsu="SwipeRow"
	class="swiperow {klass}"
	class:swiperow--dragging={dragging}
	class:swiperow--settling={settling}
	class:swiperow--armed={armed}
	class:swiperow--leading={side === 'leading'}
	class:swiperow--trailing={side === 'trailing'}
	class:swiperow-tone-accent={tone === 'accent'}
	class:swiperow-tone-success={tone === 'ok'}
	class:swiperow-tone-info={tone === 'info'}
	class:swiperow-tone-warn={tone === 'warn'}
	class:swiperow-tone-danger={tone === 'danger'}
	style="--swiperow-x: {offset}px;{styleProp ?? ''}"
	{onpointerdown}
	{onpointermove}
	{onpointerup}
	{onpointercancel}
	{onlostpointercapture}
	{onclickcapture}
	{...rest}
>
	{#if leadingAction}
		<div class="swiperow-pane swiperow-pane--leading" aria-hidden="true" data-part="leading">
			{#if leading}
				{@render leading(leadingAction, side === 'leading' && armed)}
			{:else}
				{#if leadingAction.icon}<Icon name={leadingAction.icon} />{/if}
				<span class="swiperow-pane-label">{leadingAction.label}</span>
			{/if}
		</div>
	{/if}
	{#if trailingAction}
		<div class="swiperow-pane swiperow-pane--trailing" aria-hidden="true" data-part="trailing">
			{#if trailing}
				{@render trailing(trailingAction, side === 'trailing' && armed)}
			{:else}
				{#if trailingAction.icon}<Icon name={trailingAction.icon} />{/if}
				<span class="swiperow-pane-label">{trailingAction.label}</span>
			{/if}
		</div>
	{/if}
	<div class="swiperow-content" data-part="content">
		{@render children()}
	</div>
	{#if leadingAction || trailingAction}
		<div class="swiperow-actions" data-part="actions">
			{#if leadingAction}
				<button type="button" class="swiperow-sr" data-part="leading-button" {disabled} onclick={() => leadingAction?.onaction()}>
					{leadingAction.label}
				</button>
			{/if}
			{#if trailingAction}
				<button type="button" class="swiperow-sr" data-part="trailing-button" {disabled} onclick={() => trailingAction?.onaction()}>
					{trailingAction.label}
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.swiperow {
		--swiperow-tone: var(--bg-elevated-2);
		--swiperow-ink: var(--text);
		position: relative;
		overflow: hidden;
		touch-action: pan-y;
		user-select: none;
		-webkit-user-select: none;
	}
	.swiperow-tone-accent {
		--swiperow-tone: var(--accent);
		--swiperow-ink: var(--text-on-accent);
	}
	.swiperow-tone-success {
		--swiperow-tone: var(--ok);
		--swiperow-ink: var(--bg);
	}
	.swiperow-tone-info {
		--swiperow-tone: var(--info);
		--swiperow-ink: var(--bg);
	}
	.swiperow-tone-warn {
		--swiperow-tone: var(--warn);
		--swiperow-ink: var(--bg);
	}
	.swiperow-tone-danger {
		--swiperow-tone: var(--danger);
		--swiperow-ink: var(--bg);
	}
	.swiperow-pane {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		padding: 0 var(--sp-4);
		background: var(--swiperow-tone);
		color: var(--swiperow-ink);
		font-size: var(--fs-sm);
		font-weight: 600;
		visibility: hidden;
		pointer-events: none;
	}
	.swiperow-pane--leading {
		justify-content: flex-start;
	}
	.swiperow-pane--trailing {
		justify-content: flex-end;
	}
	.swiperow--leading .swiperow-pane--leading,
	.swiperow--trailing .swiperow-pane--trailing {
		visibility: visible;
	}
	.swiperow-pane :global(svg) {
		transition: transform 120ms var(--ease);
	}
	.swiperow--armed .swiperow-pane :global(svg) {
		transform: scale(1.2);
	}
	.swiperow-content {
		position: relative;
		background: var(--bg);
		transform: translate3d(var(--swiperow-x), 0, 0);
		will-change: transform;
	}
	.swiperow--settling .swiperow-content {
		transition: transform 200ms var(--ease);
	}
	.swiperow--dragging .swiperow-content {
		cursor: grabbing;
	}
	.swiperow-actions {
		position: absolute;
		inset: 0 0 0 auto;
		display: flex;
		align-items: center;
		gap: var(--sp-1);
		padding: 0 var(--sp-2);
		pointer-events: none;
	}
	.swiperow-sr {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	.swiperow-sr:focus-visible {
		position: static;
		width: auto;
		height: auto;
		margin: 0;
		padding: var(--sp-1) var(--sp-2);
		clip: auto;
		pointer-events: auto;
		font: inherit;
		font-size: var(--fs-sm);
		color: var(--swiperow-ink);
		background: var(--swiperow-tone);
		border-radius: var(--r-sm);
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}
	@media (prefers-reduced-motion: reduce) {
		.swiperow--settling .swiperow-content,
		.swiperow-pane :global(svg) {
			transition: none;
		}
	}
</style>
