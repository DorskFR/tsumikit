<script lang="ts">
	// Accessible dialog / bottom-sheet. Mobile: full-width sheet anchored to the
	// bottom. Desktop (≥640px): centered, optionally resizable with the width
	// persisted under `resizeKey`. Handles the full a11y contract: role/aria-modal,
	// labelled by the title, Escape to close, click-outside to close, focus moved
	// into the dialog on open, a Tab focus-trap, and focus restored to the trigger
	// on close.
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

	// Default (and minimum) sheet width: 34rem at the 16px base = 544px.
	const MIN_W = 544;
	const MAX_W = 1100;

	function loadWidth(): number | null {
		if (!browser || !resizeKey) return null;
		const n = Number(localStorage.getItem(resizeKey));
		return Number.isFinite(n) && n >= MIN_W ? Math.min(n, MAX_W) : null;
	}
	let width = $state<number | null>(loadWidth());
	let sheetEl = $state<HTMLElement | null>(null);

	// --- focus management ---
	let previouslyFocused: HTMLElement | null = null;
	function focusables(): HTMLElement[] {
		if (!sheetEl) return [];
		return Array.from(
			sheetEl.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
			)
		).filter((el) => el.offsetParent !== null);
	}
	$effect(() => {
		// On mount: remember the trigger, move focus inside. On unmount: restore.
		previouslyFocused = (browser ? document.activeElement : null) as HTMLElement | null;
		const first = focusables()[0];
		(first ?? sheetEl)?.focus();
		return () => previouslyFocused?.focus?.();
	});

	function trap(e: KeyboardEvent) {
		if (e.key !== 'Tab') return;
		const f = focusables();
		if (f.length === 0) {
			e.preventDefault();
			sheetEl?.focus();
			return;
		}
		const first = f[0];
		const last = f[f.length - 1];
		const active = document.activeElement as HTMLElement | null;
		if (e.shiftKey && active === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && active === last) {
			e.preventDefault();
			first.focus();
		}
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

	function onkey(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.stopPropagation();
			onclose();
		} else {
			trap(e);
		}
	}
</script>

<div
	class="overlay"
	role="presentation"
	onclick={(e) => {
		if (e.target === e.currentTarget) onclose();
	}}
>
	<div
		bind:this={sheetEl}
		class="sheet"
		class:resizing
		role="dialog"
		aria-modal="true"
		aria-labelledby={titleId}
		tabindex="-1"
		onkeydown={onkey}
		style={width != null ? `--sheet-w: ${width}px` : undefined}
	>
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
</div>

<style>
	@media (min-width: 640px) {
		.sheet {
			width: var(--sheet-w, 34rem);
			max-width: min(var(--sheet-w, 34rem), calc(100vw - 2rem));
		}
	}
	.sheet {
		position: relative;
	}
	.sheet:focus {
		outline: none;
	}
	.sheet.resizing {
		user-select: none;
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
		.sheet.resizing .sheet-resize::after {
			background: var(--accent);
		}
	}
</style>
