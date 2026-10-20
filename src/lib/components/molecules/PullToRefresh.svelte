<script lang="ts">
	// Pull-down-to-refresh scroll container. The pull only starts from
	// `scrollTop === 0` with a touch or pen pointer, the distance is damped so
	// the indicator asymptotically approaches twice the threshold, and a release
	// past the threshold awaits `onrefresh` while a Spinner holds the slot.
	// Mouse and keyboard users refresh through the page's own control.
	import type { Snippet } from 'svelte';
	import Icon from '../atoms/Icon.svelte';
	import Spinner from '../atoms/Spinner.svelte';

	let {
		children,
		onrefresh,
		threshold = 72,
		label = 'Refreshing…',
		pullLabel = 'Pull to refresh',
		releaseLabel = 'Release to refresh',
		disabled = false,
		class: klass = '',
		...rest
	}: {
		children?: Snippet;
		/** Awaited after a release past the threshold; the spinner shows until it settles. */
		onrefresh?: () => Promise<void> | void;
		/** Damped pull distance (px) that arms the refresh. */
		threshold?: number;
		/** Announced through the live region while `onrefresh` is pending. */
		label?: string;
		pullLabel?: string;
		releaseLabel?: string;
		disabled?: boolean;
		class?: string;
		[key: string]: unknown;
	} = $props();

	const SLOP = 6;

	let scroller: HTMLElement | undefined;
	let offset = $state(0);
	let pending = $state(false);
	let pulling = $state(false);
	let press: { id: number; y: number } | null = null;

	const ready = $derived(pulling && offset >= threshold);
	const phase = $derived(pending ? 'refreshing' : ready ? 'ready' : pulling ? 'pulling' : 'idle');
	const progress = $derived(Math.min(1, offset / Math.max(1, threshold)));

	function damp(dy: number) {
		const max = threshold * 2;
		return max * (1 - Math.exp(-dy / max));
	}

	function onpointerdown(e: PointerEvent) {
		if (disabled || pending || press) return;
		if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
		if (!scroller || scroller.scrollTop > 0) return;
		press = { id: e.pointerId, y: e.clientY };
		addEventListener('pointermove', onpointermove);
		addEventListener('pointerup', onpointerup);
		addEventListener('pointercancel', onpointercancel);
	}

	function onpointermove(e: PointerEvent) {
		if (!press || e.pointerId !== press.id) return;
		const dy = e.clientY - press.y;
		if (!pulling) {
			if (dy < -SLOP || (scroller && scroller.scrollTop > 0)) return release();
			if (dy < SLOP) return;
			pulling = true;
		}
		offset = dy > 0 ? damp(dy) : 0;
	}

	function onpointerup(e: PointerEvent) {
		if (!press || e.pointerId !== press.id) return;
		const fire = ready;
		release();
		if (fire) void refresh();
	}

	function onpointercancel(e: PointerEvent) {
		if (!press || e.pointerId !== press.id) return;
		release();
	}

	function release() {
		press = null;
		pulling = false;
		if (!pending) offset = 0;
		removeEventListener('pointermove', onpointermove);
		removeEventListener('pointerup', onpointerup);
		removeEventListener('pointercancel', onpointercancel);
	}

	async function refresh() {
		if (pending) return;
		pending = true;
		offset = threshold;
		try {
			await onrefresh?.();
		} finally {
			pending = false;
			offset = 0;
		}
	}

	function scrollRoot(el: HTMLElement) {
		scroller = el;
		const block = (e: TouchEvent) => {
			if (pulling) e.preventDefault();
		};
		el.addEventListener('touchmove', block, { passive: false });
		return () => {
			el.removeEventListener('touchmove', block);
			release();
			scroller = undefined;
		};
	}
</script>

<div
	data-tsu="PullToRefresh"
	data-state={phase}
	class="ptr {klass}"
	class:pulling
	class:pending
	style:--ptr-offset="{offset}px"
	style:--ptr-progress={progress}
	aria-busy={pending || undefined}
	{onpointerdown}
	{@attach scrollRoot}
	{...rest}
>
	<div class="ptr-indicator" aria-hidden="true">
		{#if pending}
			<Spinner label={undefined} />
		{:else}
			<Icon name="arrow-down" class="ptr-arrow" />
		{/if}
	</div>
	<div class="ptr-status sr-only" role="status" aria-live="polite">
		{#if pending}{label}{:else if ready}{releaseLabel}{:else if pulling}{pullLabel}{/if}
	</div>
	<div class="ptr-content">
		{@render children?.()}
	</div>
</div>

<style>
	.ptr {
		position: relative;
		overflow-y: auto;
		overscroll-behavior-y: contain;
		-webkit-overflow-scrolling: touch;
		touch-action: pan-y;
	}
	.ptr-content {
		translate: 0 var(--ptr-offset, 0px);
		transition: translate 200ms var(--ease);
	}
	.pulling .ptr-content {
		transition: none;
	}
	.ptr-indicator {
		position: absolute;
		inset: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
		height: var(--ptr-offset, 0px);
		overflow: hidden;
		color: var(--text-muted);
		opacity: var(--ptr-progress, 0);
		transition: height 200ms var(--ease);
		pointer-events: none;
	}
	.pulling .ptr-indicator {
		transition: none;
	}
	.ptr-indicator :global(.ptr-arrow) {
		rotate: calc(180deg * var(--ptr-progress, 0));
		transition: rotate 150ms var(--ease);
	}
	.pending .ptr-indicator {
		color: var(--accent);
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
	@media (prefers-reduced-motion: reduce) {
		.ptr-content,
		.ptr-indicator,
		.ptr-indicator :global(.ptr-arrow) {
			transition: none;
		}
		.ptr-indicator :global(.ptr-arrow) {
			rotate: none;
		}
	}
</style>
