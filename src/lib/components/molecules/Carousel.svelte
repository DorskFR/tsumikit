<script lang="ts" generics="T">
	/**
	 * Ordered full-bleed panels stepped with prev/next, dot indicators, arrow
	 * keys and horizontal swipe.
	 *
	 * ARIA follows the WAI-ARIA carousel pattern in its *group* flavour: the
	 * root is a region with `aria-roledescription="carousel"`, every slide is a
	 * `group` with `aria-roledescription="slide"` named "N of M", and the dots
	 * are plain buttons. The tablist flavour was rejected because it makes the
	 * dots the primary navigation and turns each slide into a `tabpanel`, which
	 * is the wrong model when prev/next is the main affordance and the panels
	 * are unlabelled content rather than named destinations. The slide container
	 * is a polite live region while the carousel is not auto-rotating.
	 */
	import type { Snippet } from 'svelte';
	import IconButton from '$lib/components/molecules/IconButton.svelte';
	import { clampSlide, nextSlideForKey, stepSlide, swipeStep } from './carousel-keyboard.js';

	let {
		slides,
		slide,
		index = $bindable(0),
		onchange,
		loop = false,
		autoplay = 0,
		dots = true,
		controls = true,
		counter = false,
		label = 'Carousel',
		class: klass = '',
		style: styleProp = '',
		slideClass = ''
	}: {
		/** One entry per panel. Entries may themselves be snippets when no `slide` renderer is given. */
		slides: T[];
		/** Renders one panel from its entry and position. */
		slide?: Snippet<[T, number]>;
		/** Active panel; bindable. Clamped (or wrapped with `loop`) into range. */
		index?: number;
		onchange?: (index: number) => void;
		/** Wrap from the last panel to the first and back. */
		loop?: boolean;
		/** Milliseconds between automatic advances. `0` (default) disables it. When
		 *  on, rotation pauses on hover and focus and a play/pause control appears. */
		autoplay?: number;
		dots?: boolean;
		controls?: boolean;
		/** Show an `N / M` position counter. */
		counter?: boolean;
		label?: string;
		class?: string;
		style?: string;
		slideClass?: string;
	} = $props();

	const count = $derived(slides.length);
	const baseId = `carousel-${Math.random().toString(36).slice(2, 8)}`;

	$effect(() => {
		const clamped = clampSlide(index, count, false);
		if (clamped !== index) index = clamped;
	});

	let rootEl = $state<HTMLElement | null>(null);

	function go(next: number, focusDot = false) {
		const target = clampSlide(next, count, loop);
		if (target === index) return;
		index = target;
		onchange?.(target);
		if (focusDot) {
			queueMicrotask(() =>
				rootEl?.querySelector<HTMLButtonElement>(`#${baseId}-dot-${target}`)?.focus()
			);
		}
	}
	const prev = () => go(stepSlide(index, count, -1, loop));
	const next = () => go(stepSlide(index, count, 1, loop));
	const atStart = $derived(!loop && index <= 0);
	const atEnd = $derived(!loop && index >= count - 1);

	function onkeydown(e: KeyboardEvent) {
		const tag = (e.target as HTMLElement | null)?.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
		const target = nextSlideForKey(index, count, e.key, loop);
		if (target === undefined) return;
		e.preventDefault();
		const inDots = (e.target as HTMLElement | null)?.closest('.dots') !== null;
		go(target, inDots);
	}

	let startX = 0;
	let startY = 0;
	let pointerId: number | null = null;
	function onpointerdown(e: PointerEvent) {
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		pointerId = e.pointerId;
		startX = e.clientX;
		startY = e.clientY;
	}
	function onpointerup(e: PointerEvent) {
		if (e.pointerId !== pointerId) return;
		pointerId = null;
		const step = swipeStep(e.clientX - startX, e.clientY - startY);
		if (step) go(stepSlide(index, count, step, loop));
	}
	function onpointercancel() {
		pointerId = null;
	}

	let playing = $derived(autoplay > 0);
	let hovered = $state(false);
	let focused = $state(false);
	const rotating = $derived(playing && autoplay > 0 && count > 1 && !hovered && !focused);
	$effect(() => {
		if (!rotating) return;
		const id = setInterval(() => go(stepSlide(index, count, 1, true)), autoplay);
		return () => clearInterval(id);
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<section
	bind:this={rootEl}
	class="carousel {klass}"
	style={styleProp}
	aria-roledescription="carousel"
	aria-label={label}
	data-tsu="Carousel"
	{onkeydown}
	onpointerenter={() => (hovered = true)}
	onpointerleave={() => (hovered = false)}
	onfocusin={() => (focused = true)}
	onfocusout={(e) => {
		if (!rootEl?.contains(e.relatedTarget as Node | null)) focused = false;
	}}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="viewport"
		aria-live={rotating ? 'off' : 'polite'}
		{onpointerdown}
		{onpointerup}
		{onpointercancel}
	>
		<div class="track" style:transform="translateX(-{index * 100}%)">
			{#each slides as item, i (i)}
				<div
					class="slide {slideClass}"
					role="group"
					aria-roledescription="slide"
					aria-label="{i + 1} of {count}"
					aria-hidden={i !== index}
					inert={i !== index}
					id="{baseId}-slide-{i}"
				>
					{#if slide}
						{@render slide(item, i)}
					{:else}
						{@render (item as unknown as Snippet)()}
					{/if}
				</div>
			{/each}
		</div>
	</div>

	{#if count > 1 && (controls || dots || counter || autoplay > 0)}
		<div class="bar">
			{#if controls}
				<IconButton icon="chevron-left" label="Previous slide" variant="ghost" box="sm" disabled={atStart} onclick={prev} />
			{/if}
			{#if dots}
				<div class="dots" role="group" aria-label="Choose slide">
					{#each slides as _, i (i)}
						<button
							type="button"
							class="dot"
							class:active={i === index}
							id="{baseId}-dot-{i}"
							aria-label="Slide {i + 1}"
							aria-current={i === index ? 'true' : undefined}
							aria-controls="{baseId}-slide-{i}"
							tabindex={i === index ? 0 : -1}
							onclick={() => go(i)}
						></button>
					{/each}
				</div>
			{/if}
			{#if counter}
				<span class="counter">{index + 1} / {count}</span>
			{/if}
			{#if autoplay > 0}
				<IconButton
					icon={playing ? 'pause' : 'play'}
					label={playing ? 'Stop automatic rotation' : 'Start automatic rotation'}
					variant="ghost"
					box="sm"
					pressed={playing}
					onclick={() => (playing = !playing)}
				/>
			{/if}
			{#if controls}
				<IconButton icon="chevron-right" label="Next slide" variant="ghost" box="sm" disabled={atEnd} onclick={next} />
			{/if}
		</div>
	{/if}
</section>

<style>
	.carousel {
		display: flex;
		flex-direction: column;
		gap: var(--sp-3);
		min-width: 0;
	}
	.viewport {
		overflow: hidden;
		border-radius: var(--r-md);
		touch-action: pan-y;
		user-select: none;
	}
	.track {
		display: flex;
		width: 100%;
		transition: transform 0.35s var(--ease);
	}
	.slide {
		flex: 0 0 100%;
		min-width: 0;
	}
	.bar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--sp-2);
	}
	.dots {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
	}
	.dot {
		width: 0.5rem;
		height: 0.5rem;
		padding: 0;
		border: 0;
		border-radius: var(--r-pill);
		background: var(--border);
		cursor: pointer;
		transition:
			background 0.12s var(--ease),
			transform 0.12s var(--ease);
	}
	.dot:hover {
		background: var(--text-faint);
	}
	.dot.active {
		background: var(--accent);
		transform: scale(1.25);
	}
	.dot:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.counter {
		color: var(--text-muted);
		font-size: var(--fs-sm);
		font-variant-numeric: tabular-nums;
	}
	@media (prefers-reduced-motion: reduce) {
		.track,
		.dot {
			transition: none;
		}
	}
</style>
