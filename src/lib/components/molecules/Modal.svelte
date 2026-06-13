<script lang="ts">
	// Accessible dialog / bottom-sheet built on the native <dialog> element, so
	// the platform gives us the hard parts for free: top-layer rendering above
	// everything (no z-index races), a real focus trap, inert background, initial
	// focus, focus restoration to the trigger, Escape-to-close and a styleable
	// ::backdrop. We only add: open-on-mount, click-outside, and optional
	// desktop resize (width persisted under `resizeKey`).
	import type { Snippet } from 'svelte';
	import { browser } from '$app/environment';
	import IconButton from '$lib/components/molecules/IconButton.svelte';

	let {
		title,
		onclose,
		body,
		footer,
		resizeKey
	}: {
		title: string;
		onclose: () => void;
		body: Snippet;
		footer?: Snippet;
		/** When set, the sheet is horizontally resizable on desktop and the chosen
		 *  width persists under this localStorage key. */
		resizeKey?: string;
	} = $props();

	const titleId = `modal-title-${Math.random().toString(36).slice(2, 8)}`;

	const MIN_W = 544; // 34rem at 16px base
	const MAX_W = 1100;

	function loadWidth(): number | null {
		if (!browser || !resizeKey) return null;
		const n = Number(localStorage.getItem(resizeKey));
		return Number.isFinite(n) && n >= MIN_W ? Math.min(n, MAX_W) : null;
	}
	let width = $state<number | null>(loadWidth());
	let dialogEl = $state<HTMLDialogElement | null>(null);

	$effect(() => {
		// Open as a modal (top layer + trap + inert background + focus mgmt). The
		// native element restores focus to the trigger automatically on close.
		dialogEl?.showModal();
	});

	// Click outside: <dialog fills the viewport; clicks on its padding-free self
	// (not the inner .sheet) are backdrop clicks.
	function onDialogClick(e: MouseEvent) {
		if (e.target === dialogEl) onclose();
	}

	// --- resize ---
	let resizing = $state(false);
	let startX = 0;
	let startW = 0;
	function startResize(e: PointerEvent) {
		resizing = true;
		startX = e.clientX;
		startW = (e.currentTarget as HTMLElement).closest('.sheet')!.getBoundingClientRect().width;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		e.preventDefault();
	}
	function onResize(e: PointerEvent) {
		if (!resizing) return;
		const next = startW + (e.clientX - startX) * 2; // centered: edge tracks cursor
		width = Math.round(Math.max(MIN_W, Math.min(next, MAX_W, window.innerWidth - 32)));
	}
	function endResize(e: PointerEvent) {
		if (!resizing) return;
		resizing = false;
		try {
			(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		} catch {
			/* already released */
		}
		if (browser && resizeKey && width != null) localStorage.setItem(resizeKey, String(width));
	}
</script>

<dialog
	bind:this={dialogEl}
	class="modal"
	class:resizing
	aria-labelledby={titleId}
	style={width != null ? `--sheet-w: ${width}px` : undefined}
	oncancel={(e) => {
		e.preventDefault(); /* keep parent the source of truth for open state */
		onclose();
	}}
	onclick={onDialogClick}
>
	<div class="sheet">
		<div class="sheet-head">
			<span id={titleId} class="sheet-title truncate">{title}</span>
			<div class="spacer"></div>
			<IconButton icon="x" label="Close dialog" onclick={onclose} />
		</div>
		<div class="sheet-body">
			{@render body()}
		</div>
		{#if footer}
			<div class="sheet-foot">{@render footer()}</div>
		{/if}
		{#if resizeKey}
			<div
				class="sheet-resize"
				role="separator"
				aria-label="Resize dialog width"
				aria-orientation="vertical"
				onpointerdown={startResize}
				onpointermove={onResize}
				onpointerup={endResize}
				onpointercancel={endResize}
			></div>
		{/if}
	</div>
</dialog>

<style>
	/* Reset the UA dialog box: we own the surface via the inner .sheet. The
	   dialog itself is just the centering/backdrop layer. */
	.modal {
		margin: 0;
		padding: 0;
		border: 0;
		background: none;
		max-width: 100vw;
		max-height: 100dvh;
		width: 100%;
		height: 100%;
		color: var(--text);
		/* center on desktop; the sheet anchors to the bottom on mobile */
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}
	.modal::backdrop {
		background: rgba(0, 0, 0, 0.55);
		/* animate the backdrop in (progressive enhancement) */
		animation: backdrop-in 0.18s var(--ease);
	}
	@keyframes backdrop-in {
		from {
			opacity: 0;
		}
	}
	@media (min-width: 640px) {
		.modal {
			align-items: center;
			padding: var(--sp-6);
		}
	}

	.sheet {
		position: relative;
		width: 100%;
		max-width: 34rem;
		max-height: calc(100dvh - var(--safe-top) - var(--sp-6));
		display: flex;
		flex-direction: column;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--r-lg) var(--r-lg) 0 0;
		box-shadow: var(--shadow-lg);
		animation: sheet-up 0.18s var(--ease);
		padding-bottom: var(--safe-bottom);
	}
	@media (min-width: 640px) {
		.sheet {
			border-radius: var(--r-lg);
			padding-bottom: 0;
			width: var(--sheet-w, 34rem);
			max-width: min(var(--sheet-w, 34rem), calc(100vw - 2rem));
		}
	}
	@keyframes sheet-up {
		from {
			transform: translateY(8%);
			opacity: 0.4;
		}
	}
	.modal.resizing .sheet {
		user-select: none;
	}

	.sheet-head {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		padding: var(--sp-4);
		border-bottom: 1px solid var(--border);
	}
	.sheet-title {
		font-size: var(--fs-lg);
		font-weight: var(--fw-semibold);
	}
	.sheet-body {
		padding: var(--sp-4);
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
	}
	.sheet-foot {
		display: flex;
		gap: var(--sp-2);
		padding: var(--sp-4);
		border-top: 1px solid var(--border);
	}

	.sheet-resize {
		display: none;
	}
	@media (min-width: 640px) {
		.sheet-resize {
			display: block;
			position: absolute;
			top: 0;
			bottom: 0;
			right: 0;
			width: 12px;
			margin-right: -6px;
			cursor: ew-resize;
			touch-action: none;
			z-index: 2;
		}
		.sheet-resize::after {
			content: '';
			position: absolute;
			top: 50%;
			right: 6px;
			transform: translateY(-50%);
			width: 3px;
			height: 28px;
			border-radius: 999px;
			background: var(--border-strong);
			transition: background 0.12s var(--ease);
		}
		.sheet-resize:hover::after,
		.modal.resizing .sheet-resize::after {
			background: var(--accent);
		}
	}
</style>
