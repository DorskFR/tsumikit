<script lang="ts">
	import type { Snippet } from 'svelte';
	import { browser } from '$lib/env';
	import Icon from '$lib/components/atoms/Icon.svelte';
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
		resizeStep = 16
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
	} = $props();

	let root: HTMLDivElement;
	let panelWidth = $state<number>();
	let resizing = $state(false);
	let restored = false;

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
		setWidth(widthFromPointer(event.clientX), false);
	}

	function finishResize(event: PointerEvent) {
		if (!resizing) return;
		resizing = false;
		try {
			(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
		} catch {
			// Pointer capture may already have been released by the browser.
		}
		persistWidth();
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
			type="button"
			class="collapse-control"
			aria-label={toggleLabel}
			aria-expanded={!collapsed}
			title={toggleLabel}
			onclick={toggle}
		>
			<Icon name={toggleIcon} size={20} />
			{#if !collapsed}<span>{toggleLabel}</span>{/if}
		</button>
	</aside>

	<div class="main">{@render children()}</div>
</div>

<style>
	.panel-layout {
		--panel-collapsed-width: var(--control-height);
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
		--panel-current-width: var(--panel-collapsed-width);
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
	.collapse-control {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--sp-2);
		width: 100%;
		min-height: var(--control-height);
		margin-top: auto;
		padding: var(--sp-2) var(--sp-3);
		color: var(--text-muted);
		font: inherit;
		font-size: var(--fs-sm);
		font-weight: var(--fw-medium);
		background: var(--bg-elevated-2);
		border: 0;
		border-top: 1px solid var(--border);
		cursor: pointer;
	}
	.collapse-control:hover {
		color: var(--text);
		background: var(--surface);
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
		bottom: var(--control-height);
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
	   squeezing it. The bottom control remains visible as a persistent rail. */
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
			padding-left: var(--panel-collapsed-width);
		}
		.right .main {
			padding-right: var(--panel-collapsed-width);
			padding-left: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.panel {
			transition: none;
		}
	}
</style>
