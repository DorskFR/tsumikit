<script lang="ts">
	import { onDestroy, type Snippet } from 'svelte';
	import { browser } from '$lib/env';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import { createFrameBatcher } from './resizable-panel-frame.js';
	import { parseStoredCollapsed, parseStoredWidth } from './resizable-panel-persistence';

	let {
		panel,
		children,
		side = 'left',
		label = 'Side panel',
		width = 280,
		minWidth = 180,
		maxWidth = 480,
		widthKey,
		collapsed = $bindable(false),
		persistCollapsed = true,
		resizeStep = 16,
		handlePlacement = 'bottom',
		stickyHandle = true
	}: {
		/** Content shown while the panel is expanded. */
		panel: Snippet;
		/** Main content beside the panel. */
		children: Snippet;
		/** Physical edge occupied by the panel. */
		side?: 'left' | 'right';
		/** Accessible name for the panel landmark. */
		label?: string;
		/** Initial expanded width in pixels. */
		width?: number;
		minWidth?: number;
		maxWidth?: number;
		/** localStorage key used to restore the expanded width. */
		widthKey?: string;
		/** Bindable collapsed state. */
		collapsed?: boolean;
		/** Persist collapsed state as `${widthKey}:collapsed`. */
		persistCollapsed?: boolean;
		/** Pixels added or removed by each resize-separator arrow key press. */
		resizeStep?: number;
		/** Anchor the collapse handle at the top or bottom of the panel edge. */
		handlePlacement?: 'top' | 'bottom';
		/** Keep the collapse handle in view when the panel scrolls past the
		 *  viewport, repositioning on scroll/resize via requestAnimationFrame. */
		stickyHandle?: boolean;
	} = $props();

	let root: HTMLDivElement;
	let handleEl = $state<HTMLButtonElement | null>(null);
	let panelWidth = $state<number>();
	let resizing = $state(false);
	let restored = false;
	let stickyShift = $state(0);

	const boundedMin = $derived(Math.max(1, Math.min(minWidth, maxWidth)));
	const boundedMax = $derived(Math.max(boundedMin, maxWidth));
	const currentWidth = $derived(
		Math.round(Math.max(boundedMin, Math.min(panelWidth ?? width, boundedMax)))
	);
	const toggleLabel = $derived(collapsed ? `Expand ${label}` : `Collapse ${label}`);
	const toggleIcon = $derived(
		collapsed
			? side === 'left'
				? 'chevron-right'
				: 'chevron-left'
			: side === 'left'
				? 'chevron-left'
				: 'chevron-right'
	);

	$effect(() => {
		if (!browser || restored) return;
		restored = true;
		if (!widthKey) return;

		const savedWidth = parseStoredWidth(
			localStorage.getItem(widthKey),
			boundedMin,
			boundedMax
		);
		if (savedWidth !== undefined) panelWidth = savedWidth;

		if (persistCollapsed) {
			const savedCollapsed = parseStoredCollapsed(
				localStorage.getItem(`${widthKey}:collapsed`)
			);
			if (savedCollapsed !== undefined) collapsed = savedCollapsed;
		}
	});

	function persistWidth() {
		if (browser && widthKey) localStorage.setItem(widthKey, String(currentWidth));
	}

	function setWidth(nextWidth: number, persist = true) {
		panelWidth = Math.round(Math.max(boundedMin, Math.min(nextWidth, boundedMax)));
		if (persist) persistWidth();
	}

	const pointerWidths = createFrameBatcher<number>(
		(callback) => requestAnimationFrame(callback),
		(handle) => cancelAnimationFrame(handle),
		(nextWidth) => setWidth(nextWidth, false)
	);

	// Keep the collapse handle within the viewport (and its panel) while a long
	// panel scrolls past the fold. Scroll fires often, so coalesce recomputes
	// into one per animation frame.
	let stickyFrame: number | undefined;

	function computeSticky() {
		if (!stickyHandle || !root || !handleEl) {
			stickyShift = 0;
			return;
		}
		const bounds = root.getBoundingClientRect();
		const viewport = window.innerHeight || document.documentElement.clientHeight;
		const handleHeight = handleEl.offsetHeight;
		const margin = 8;
		const naturalTop =
			handlePlacement === 'top'
				? bounds.top + margin
				: bounds.bottom - margin - handleHeight;
		const panelLo = bounds.top + margin;
		const panelHi = bounds.bottom - margin - handleHeight;
		const inViewport = Math.min(Math.max(naturalTop, margin), viewport - margin - handleHeight);
		const clamped = Math.min(Math.max(inViewport, panelLo), Math.max(panelLo, panelHi));
		stickyShift = Math.round(clamped - naturalTop);
	}

	function scheduleSticky() {
		if (!browser || stickyFrame !== undefined) return;
		stickyFrame = requestAnimationFrame(() => {
			stickyFrame = undefined;
			computeSticky();
		});
	}

	$effect(() => {
		if (!browser || !stickyHandle) {
			stickyShift = 0;
			return;
		}
		computeSticky();
		addEventListener('scroll', scheduleSticky, true);
		addEventListener('resize', scheduleSticky);
		return () => {
			removeEventListener('scroll', scheduleSticky, true);
			removeEventListener('resize', scheduleSticky);
			if (stickyFrame !== undefined) cancelAnimationFrame(stickyFrame);
			stickyFrame = undefined;
		};
	});

	onDestroy(() => pointerWidths.discard());

	function toggle() {
		collapsed = !collapsed;
		if (browser && widthKey && persistCollapsed) {
			localStorage.setItem(`${widthKey}:collapsed`, String(collapsed));
		}
	}

	function widthFromPointer(clientX: number) {
		const bounds = root.getBoundingClientRect();
		return side === 'left' ? clientX - bounds.left : bounds.right - clientX;
	}

	function startResize(event: PointerEvent) {
		resizing = true;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		event.preventDefault();
	}

	function resize(event: PointerEvent) {
		if (!resizing) return;
		pointerWidths.schedule(widthFromPointer(event.clientX));
	}

	function finishResize(event: PointerEvent) {
		if (!resizing) return;
		const finalWidth = Math.round(
			Math.max(boundedMin, Math.min(widthFromPointer(event.clientX), boundedMax))
		);
		pointerWidths.flush(finalWidth);
		resizing = false;
		try {
			(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
		} catch {
			// Pointer capture may already have been released by the browser.
		}
		if (browser && widthKey) localStorage.setItem(widthKey, String(finalWidth));
	}

	function resizeWithKeyboard(event: KeyboardEvent) {
		let nextWidth: number | undefined;
		const direction = side === 'left' ? 1 : -1;

		switch (event.key) {
			case 'ArrowLeft':
				nextWidth = currentWidth - resizeStep * direction;
				break;
			case 'ArrowRight':
				nextWidth = currentWidth + resizeStep * direction;
				break;
			case 'Home':
				nextWidth = boundedMin;
				break;
			case 'End':
				nextWidth = boundedMax;
				break;
		}

		if (nextWidth === undefined) return;
		event.preventDefault();
		setWidth(nextWidth);
	}
</script>

<div
	bind:this={root}
	class="panel-layout"
	class:left={side === 'left'}
	class:right={side === 'right'}
	class:collapsed
	class:resizing
	style="--panel-width: {currentWidth}px"
	data-tsu="ResizablePanel"
>
	<aside aria-label={label} class="panel">
		{#if !collapsed}
			<div class="panel-content">{@render panel()}</div>
			<!-- The separator role is interactive when focusable and wired to the
			     required arrow/Home/End keyboard behavior. -->
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				class="resize-handle"
				role="separator"
				tabindex="0"
				aria-label={`Resize ${label}`}
				aria-orientation="vertical"
				aria-valuemin={boundedMin}
				aria-valuemax={boundedMax}
				aria-valuenow={currentWidth}
				onkeydown={resizeWithKeyboard}
				onpointerdown={startResize}
				onpointermove={resize}
				onpointerup={finishResize}
				onpointercancel={finishResize}
			></div>
		{/if}

		<button
			bind:this={handleEl}
			type="button"
			class="collapse-control"
			class:top={handlePlacement === 'top'}
			class:bottom={handlePlacement === 'bottom'}
			aria-label={toggleLabel}
			aria-expanded={!collapsed}
			title={toggleLabel}
			style="transform: translateY({stickyShift}px)"
			onclick={toggle}
		>
			<Icon name={toggleIcon} size={14} />
		</button>
	</aside>

	<div class="main">{@render children()}</div>
</div>

<style>
	.panel-layout {
		position: relative;
		display: grid;
		grid-template-columns: var(--panel-current-width) minmax(0, 1fr);
		min-width: 0;
		min-height: 0;
		container: resizable-panel / inline-size;
		isolation: isolate;
	}
	.panel-layout.right {
		grid-template-columns: minmax(0, 1fr) var(--panel-current-width);
	}
	.panel-layout {
		--panel-current-width: var(--panel-width);
	}
	.panel-layout.collapsed {
		--panel-current-width: 0px;
	}
	.panel {
		position: relative;
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
		width: var(--panel-current-width);
		background: var(--bg-elevated);
		border-right: 1px solid var(--border);
		transition: width 0.18s var(--ease), box-shadow 0.18s var(--ease);
	}
	.right .panel {
		grid-column: 2;
		grid-row: 1;
		border-right: 0;
		border-left: 1px solid var(--border);
	}
	.main {
		min-width: 0;
		min-height: 0;
		container: panel-main / inline-size;
	}
	.right .main {
		grid-column: 1;
		grid-row: 1;
	}
	.panel-content {
		flex: 1;
		min-height: 0;
		overflow: auto;
	}
	/* Subtle chevron handle anchored to the panel's inner edge — never a filled
	   button, never overlapping the neighbouring main content. It stays visible
	   when collapsed (the panel is 0px wide) because it lives on the layout edge,
	   and its `transform` is nudged by the sticky logic to track the viewport. */
	.collapse-control {
		position: absolute;
		left: var(--sp-1);
		z-index: 3;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 30px;
		padding: 0;
		color: var(--text-faint);
		font: inherit;
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--r-sm);
		cursor: pointer;
		transition:
			color 0.12s var(--ease),
			background 0.12s var(--ease),
			border-color 0.12s var(--ease);
	}
	.collapse-control.top {
		top: var(--sp-2);
	}
	.collapse-control.bottom {
		bottom: var(--sp-2);
	}
	.right .collapse-control {
		left: auto;
		right: var(--sp-1);
	}
	.collapse-control:hover {
		color: var(--text);
		background: var(--bg-elevated-2);
		border-color: var(--border);
	}
	.collapse-control:focus-visible,
	.resize-handle:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}
	.resize-handle {
		position: absolute;
		top: 0;
		right: -6px;
		bottom: 0;
		z-index: 2;
		width: 12px;
		padding: 0;
		background: transparent;
		border: 0;
		cursor: ew-resize;
		touch-action: none;
	}
	.right .resize-handle {
		right: auto;
		left: -6px;
	}
	.resize-handle::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 3px;
		height: var(--sp-8);
		border-radius: var(--r-pill);
		background: var(--border-strong);
		transform: translate(-50%, -50%);
		transition: background 0.12s var(--ease), height 0.12s var(--ease);
	}
	.resize-handle:hover::after,
	.resize-handle:focus-visible::after,
	.resizing .resize-handle::after {
		height: var(--sp-12);
		background: var(--accent);
	}
	.resizing {
		cursor: ew-resize;
		user-select: none;
	}

	/* In a narrow host, the expanded panel overlays the main area instead of
	   squeezing it. */
	@container resizable-panel (max-width: 40rem) {
		.panel-layout {
			display: block;
		}
		.panel {
			position: absolute;
			inset-block: 0;
			left: 0;
			z-index: 1;
			width: min(var(--panel-current-width), 85cqw);
			box-shadow: var(--shadow-md);
		}
		.right .panel {
			right: 0;
			left: auto;
		}
		.collapsed .panel {
			box-shadow: none;
		}
		.main {
			height: 100%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.panel {
			transition: none;
		}
	}
</style>
