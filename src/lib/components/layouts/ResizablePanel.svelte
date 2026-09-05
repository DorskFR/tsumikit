<script lang="ts">
	import type { Snippet } from 'svelte';
	import { untrack } from 'svelte';
	import { browser } from '$lib/env';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import Scrim from '$lib/components/atoms/Scrim.svelte';
	import { resizeHandle, resolveLength } from './resizable-panel-frame.js';
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
		stickyHandle = true,
		mode = 'inline',
		open = $bindable(false),
		onclose,
		scrim,
		fullWidthBelow,
		clampToViewport = true,
		collapseControl
	}: {
		/** Content shown while the panel is expanded. */
		panel: Snippet;
		/** Main content beside the panel (optional in overlay mode). */
		children?: Snippet;
		/** Physical edge occupied by the panel. */
		side?: 'left' | 'right';
		/** Accessible name for the panel landmark / dialog. */
		label?: string;
		/** Initial expanded width in pixels. */
		width?: number;
		/** Pixel number or CSS length (`'12rem'`, `'30vw'`). */
		minWidth?: number | string;
		/** Pixel number or CSS length (`'40rem'`, `'90vw'`). */
		maxWidth?: number | string;
		/** localStorage key used to restore the expanded width. */
		widthKey?: string;
		/** Bindable collapsed state (inline mode). */
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
		/** Render the edge chevron. Defaults to on inline, off in overlay mode
		 *  (Escape and the scrim already close a drawer). */
		collapseControl?: boolean;
		/** `inline` shares the row with `children`; `overlay` fixes the panel to
		 *  its viewport edge as a non-modal drawer above the page. */
		mode?: 'inline' | 'overlay';
		/** Bindable drawer visibility (overlay mode). */
		open?: boolean;
		/** Overlay mode: Escape, scrim click or the edge control closed the drawer. */
		onclose?: () => void;
		/** Overlay mode: dim the page behind the drawer; clicking it closes (default true). */
		scrim?: boolean;
		/** Overlay mode: viewport width (CSS length) under which the drawer spans
		 *  the full viewport and hides its resize handle and scrim. */
		fullWidthBelow?: string;
		/** Overlay mode: cap the width at the viewport and re-clamp on window resize. */
		clampToViewport?: boolean;
	} = $props();

	let root: HTMLDivElement;
	let panelEl = $state<HTMLElement | null>(null);
	let handleEl = $state<HTMLButtonElement | null>(null);
	let panelWidth = $state<number>();
	let resizing = $state(false);
	let restored = false;
	let stickyShift = $state(0);
	let viewportWidth = $state<number>();
	let lengthTick = $state(0);
	let fullBleed = $state(false);

	const overlay = $derived(mode === 'overlay');
	const showCollapseControl = $derived(collapseControl ?? !overlay);
	const shown = $derived(overlay ? open : !collapsed);
	const showScrim = $derived(overlay && open && (scrim ?? true));

	function measureLength(css: string) {
		if (!browser || !root) return undefined;
		const probe = document.createElement('div');
		probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;width:${css}`;
		root.appendChild(probe);
		const measured = probe.getBoundingClientRect().width;
		probe.remove();
		return measured;
	}

	const minPx = $derived.by(() => {
		void lengthTick;
		return resolveLength(minWidth, measureLength) ?? 180;
	});
	const maxPx = $derived.by(() => {
		void lengthTick;
		return resolveLength(maxWidth, measureLength) ?? 480;
	});
	const viewportCap = $derived(
		overlay && clampToViewport && viewportWidth ? viewportWidth : Number.POSITIVE_INFINITY
	);
	const boundedMin = $derived(Math.max(1, Math.min(minPx, maxPx, viewportCap)));
	const boundedMax = $derived(Math.max(boundedMin, Math.min(maxPx, viewportCap)));
	const currentWidth = $derived(
		Math.round(Math.max(boundedMin, Math.min(panelWidth ?? width, boundedMax)))
	);
	const toggleLabel = $derived(
		overlay ? `Close ${label}` : collapsed ? `Expand ${label}` : `Collapse ${label}`
	);
	const toggleIcon = $derived(
		!overlay && collapsed
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
		lengthTick = untrack(() => lengthTick) + 1;
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

	$effect(() => {
		if (!browser) return;
		const sync = () => {
			viewportWidth = window.innerWidth;
			lengthTick = untrack(() => lengthTick) + 1;
		};
		sync();
		addEventListener('resize', sync);
		return () => removeEventListener('resize', sync);
	});

	$effect(() => {
		if (!browser || !overlay || !fullWidthBelow) {
			fullBleed = false;
			return;
		}
		const query = matchMedia(`(max-width: ${fullWidthBelow})`);
		const sync = () => {
			fullBleed = query.matches;
		};
		sync();
		query.addEventListener('change', sync);
		return () => query.removeEventListener('change', sync);
	});

	$effect(() => {
		if (!browser || !overlay || !open) return;
		const onKeydown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape' || event.defaultPrevented) return;
			event.preventDefault();
			close();
		};
		document.addEventListener('keydown', onKeydown);
		return () => document.removeEventListener('keydown', onKeydown);
	});

	$effect(() => {
		if (!browser || !overlay || !open || !panelEl) return;
		const previous = document.activeElement as HTMLElement | null;
		if (!panelEl.contains(previous)) panelEl.focus({ preventScroll: true });
		return () => {
			if (previous?.isConnected && document.activeElement === document.body) previous.focus();
		};
	});

	function persistWidth(nextWidth: number) {
		if (browser && widthKey) localStorage.setItem(widthKey, String(nextWidth));
	}

	function setWidth(nextWidth: number) {
		panelWidth = Math.round(Math.max(boundedMin, Math.min(nextWidth, boundedMax)));
	}

	// Keep the collapse handle within the viewport (and its panel) while a long
	// panel scrolls past the fold. Scroll fires often, so coalesce recomputes
	// into one per animation frame.
	let stickyFrame: number | undefined;

	function computeSticky() {
		if (!stickyHandle || overlay || !root || !handleEl) {
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
		if (!browser || !stickyHandle || overlay) {
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

	function close() {
		if (!open) return;
		open = false;
		onclose?.();
	}

	function toggle() {
		if (overlay) {
			close();
			return;
		}
		collapsed = !collapsed;
		if (browser && widthKey && persistCollapsed) {
			localStorage.setItem(`${widthKey}:collapsed`, String(collapsed));
		}
	}
</script>

<div
	bind:this={root}
	class="panel-layout"
	class:left={side === 'left'}
	class:right={side === 'right'}
	class:collapsed={!overlay && collapsed}
	class:overlay
	class:full-bleed={fullBleed}
	class:resizing
	style="--panel-width: {currentWidth}px"
	data-tsu="ResizablePanel"
>
	{#if showScrim}
		<Scrim onclose={close} hideBelow={fullWidthBelow} label={`Close ${label}`} />
	{/if}

	{#if !overlay || open}
		<svelte:element
			this={overlay ? 'div' : 'aside'}
			bind:this={panelEl}
			aria-label={label}
			class="panel"
			role={overlay ? 'dialog' : undefined}
			aria-modal={overlay ? 'false' : undefined}
			tabindex={overlay ? -1 : undefined}
		>
			{#if shown}
				<div class="panel-content">{@render panel()}</div>
				<!-- The separator role is interactive when focusable and wired to the
				     required arrow/Home/End keyboard behavior by the resizeHandle action. -->
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<div
					class="resize-handle"
					role="separator"
					tabindex="0"
					aria-label={`Resize ${label}`}
					aria-orientation="vertical"
					aria-valuemin={boundedMin}
					aria-valuemax={boundedMax}
					aria-valuenow={currentWidth}
					use:resizeHandle={{
						side,
						min: boundedMin,
						max: boundedMax,
						step: resizeStep,
						measure: () => currentWidth,
						onwidth: setWidth,
						oncommit: persistWidth,
						onactive: (active) => (resizing = active)
					}}
				></div>
			{/if}

			{#if showCollapseControl}
			<button
				bind:this={handleEl}
				type="button"
				class="collapse-control"
				class:top={handlePlacement === 'top'}
				class:bottom={handlePlacement === 'bottom'}
				aria-label={toggleLabel}
				aria-expanded={overlay ? undefined : !collapsed}
				title={toggleLabel}
				style="transform: translateY({stickyShift}px)"
				onclick={toggle}
			>
				<Icon name={toggleIcon} size={14} />
			</button>
			{/if}
		</svelte:element>
	{/if}

	{#if children}
		<div class="main">{@render children()}</div>
	{/if}
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
	/* The handle overhangs the panel edge by 6px, but never past the host
	   container: when the panel fills it (edge at the window border), the
	   overhang would land off-screen and be ungrabbable, so the shift clamps to
	   the leftover space and the lost overhang is added back inside instead. */
	.resize-handle {
		--handle-shift: max(-6px, calc(var(--panel-current-width) - 100cqw));
		position: absolute;
		top: 0;
		right: var(--handle-shift);
		bottom: 0;
		z-index: 2;
		width: calc(18px + var(--handle-shift));
		padding: 0;
		background: transparent;
		border: 0;
		cursor: ew-resize;
		touch-action: none;
	}
	.right .resize-handle {
		right: auto;
		left: var(--handle-shift);
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
		/* The 85cqw cap guarantees free space beside the panel, but the clamp
		   above reads --panel-current-width, which the cap may exceed. */
		.resize-handle {
			--handle-shift: -6px;
		}
		.main {
			height: 100%;
		}
	}

	/* Overlay mode: a fixed non-modal drawer on the viewport edge. The page
	   (`.main`) flows as normal underneath; the handle overhang is a viewport
	   edge, so the container clamp does not apply. */
	.panel-layout.overlay {
		display: block;
		container: none;
	}
	.overlay .panel {
		position: fixed;
		inset-block: 0;
		left: 0;
		z-index: var(--z-drawer);
		width: min(var(--panel-current-width), 100vw);
		box-shadow: var(--shadow-md);
		outline: none;
		animation: panel-slide-left 0.18s var(--ease);
	}
	.overlay.right .panel {
		right: 0;
		left: auto;
		animation-name: panel-slide-right;
	}
	.overlay .resize-handle {
		--handle-shift: -6px;
	}
	.overlay.full-bleed .panel {
		width: 100vw;
		border: 0;
		box-shadow: none;
	}
	.overlay.full-bleed .resize-handle {
		display: none;
	}
	@keyframes panel-slide-left {
		from {
			transform: translateX(-100%);
		}
	}
	@keyframes panel-slide-right {
		from {
			transform: translateX(100%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.panel {
			transition: none;
			animation: none;
		}
	}
</style>
