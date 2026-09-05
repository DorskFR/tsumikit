<script lang="ts">
	import { canonicalTone, type Tone } from '$lib/tone';
	// Accessible dialog / bottom-sheet built on the native <dialog> element, so
	// the platform gives us the hard parts for free: top-layer rendering above
	// everything (no z-index races), a real focus trap, inert background, initial
	// focus, focus restoration to the trigger, Escape-to-close and a styleable
	// ::backdrop. We only add: open-on-mount (or `open`-driven), click-outside,
	// tone/busy chrome, and optional desktop resize (width persisted under
	// `resizeKey`).
	import type { Snippet } from 'svelte';
	import { browser } from '$lib/env';
	import Icon, { type IconName } from '$lib/components/atoms/Icon.svelte';
	import Spinner from '$lib/components/atoms/Spinner.svelte';
	import IconButton from '$lib/components/molecules/IconButton.svelte';

	const TONE_ICON: Record<Exclude<Tone, 'neutral' | 'success'>, IconName> = {
		danger: 'warning',
		warn: 'warning',
		info: 'info',
		ok: 'check',
		accent: 'info'
	};

	let {
		title,
		open = $bindable(),
		onclose,
		body,
		footer,
		size = 'md',
		tone = 'neutral',
		busy = false,
		resizeKey,
		class: klass = '',
		style: styleProp = '',
		bodyClass = '',
		maxHeight,
	}: {
		title: string;
		/** Controlled visibility. When provided the `<dialog>` stays mounted and
		 *  `showModal()`/`close()` follow the value; closing sets it back to false.
		 *  Omit to open on mount (mount/unmount the component to show/hide). */
		open?: boolean;
		onclose?: () => void;
		body: Snippet;
		footer?: Snippet;
		/** Title glyph + 3px top border in the semantic colour. */
		tone?: Tone;
		/** Work in flight: body is inert, a spinner sits by the title and Escape,
		 *  backdrop and the close button stop closing until it clears. */
		busy?: boolean;
		/** Desktop width preset (sm 24rem / md 34rem / lg 48rem / xl 72rem). A
		 *  `resizeKey` drag still overrides it. */
		size?: 'sm' | 'md' | 'lg' | 'xl';
		/** When set, the sheet is horizontally resizable on desktop and the chosen
		 *  width persists under this localStorage key. */
		resizeKey?: string;
		class?: string;
		style?: string;
		/** Class on the inner sheet (the visible panel). */
		bodyClass?: string;
		/** Cap the sheet height; the body scrolls inside it. */
		maxHeight?: string;
	} = $props();
	const t = $derived(canonicalTone(tone));

	const titleId = `modal-title-${Math.random().toString(36).slice(2, 8)}`;

	const MIN_W = 544; // 34rem at 16px base
	const MAX_W = 1680;

	function loadWidth(): number | null {
		if (!browser || !resizeKey) return null;
		const n = Number(localStorage.getItem(resizeKey));
		return Number.isFinite(n) && n >= MIN_W ? Math.min(n, MAX_W) : null;
	}
	let width = $state<number | null>(loadWidth());
	let dialogEl = $state<HTMLDialogElement | null>(null);

	const controlled = $derived(open !== undefined);

	// Open as a modal (top layer + trap + inert background + focus mgmt). The
	// native element restores focus to the trigger automatically on close.
	$effect(() => {
		if (!dialogEl) return;
		if (!controlled) {
			dialogEl.showModal();
			return;
		}
		if (open && !dialogEl.open) dialogEl.showModal();
		else if (!open && dialogEl.open) dialogEl.close();
	});

	function requestClose() {
		if (busy) return;
		if (controlled) open = false;
		onclose?.();
	}

	// Click outside: <dialog fills the viewport; clicks on its padding-free self
	// (not the inner .sheet) are backdrop clicks.
	function onDialogClick(e: MouseEvent) {
		if (e.target === dialogEl) requestClose();
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
	// Coalesce pointermoves to one width update per frame. Pointer events fire
	// faster than the display refresh, and each width change reflows the sheet +
	// repaints its shadow — writing once per rAF caps that to the frame rate.
	let rafId = 0;
	let lastX = 0;
	function onResize(e: PointerEvent) {
		if (!resizing) return;
		lastX = e.clientX;
		if (rafId) return;
		rafId = requestAnimationFrame(() => {
			rafId = 0;
			const next = startW + (lastX - startX) * 2; // centered: edge tracks cursor
			width = Math.round(Math.max(MIN_W, Math.min(next, MAX_W, window.innerWidth - 32)));
		});
	}
	function endResize(e: PointerEvent) {
		if (!resizing) return;
		resizing = false;
		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = 0;
		}
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
	data-tsu="Modal"
	class="modal {klass}"
	class:resizing
	aria-labelledby={titleId}
	aria-busy={busy || undefined}
	data-tone={t === 'neutral' ? undefined : t}
	style="{width != null ? `--sheet-w: ${width}px;` : ''}{styleProp}"
	oncancel={(e) => {
		e.preventDefault(); /* keep parent the source of truth for open state */
		requestClose();
	}}
	onclose={() => {
		if (controlled) open = false;
	}}
	onclick={onDialogClick}
>
	<div
		class="sheet {bodyClass}"
		style:max-height={maxHeight}
		class:sheet-sm={size === 'sm'}
		class:sheet-lg={size === 'lg'}
		class:sheet-xl={size === 'xl'}
		class:sheet-toned={t !== 'neutral'}
		style:--modal-tone={t === 'neutral' ? undefined : `var(--${t})`}
	>
		<div class="sheet-head">
			{#if t !== 'neutral'}
				<span class="sheet-tone-icon"><Icon name={TONE_ICON[t]} size={18} /></span>
			{/if}
			<span id={titleId} class="sheet-title truncate">{title}</span>
			{#if busy}<Spinner label="Working" />{/if}
			<div class="spacer"></div>
			<IconButton icon="x" label="Close dialog" disabled={busy} onclick={requestClose} />
		</div>
		<div class="sheet-body" inert={busy}>
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
	.modal:not([open]) {
		display: none;
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
		--sw: 34rem; /* width preset; overridden by --sheet-w when resized */
		position: relative;
		width: 100%;
		max-width: var(--sw);
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
			width: var(--sheet-w, var(--sw));
			max-width: min(var(--sheet-w, var(--sw)), calc(100vw - 2rem));
		}
		.sheet-sm {
			--sw: 24rem;
		}
		.sheet-lg {
			--sw: 48rem;
		}
		.sheet-xl {
			--sw: 72rem;
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
		/* Make per-frame width changes cheap to paint: hint the animated property,
		   isolate layout/paint to the sheet, and drop the heavy blurred shadow
		   (40px blur) for a light one while dragging. */
		will-change: width;
		contain: layout paint;
		box-shadow: var(--shadow-sm);
	}

	.sheet-head {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		padding: var(--sp-4);
		border-bottom: 1px solid var(--border);
	}
	.sheet-toned {
		border-top: 3px solid var(--modal-tone);
	}
	.sheet-tone-icon {
		display: inline-flex;
		flex: none;
		color: var(--modal-tone);
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
		justify-content: flex-end;
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
		/* Full-height edge line that lights up on hover, so the affordance is
		   findable without knowing it exists. */
		.sheet-resize::before {
			content: '';
			position: absolute;
			top: 0;
			bottom: 0;
			right: 6px;
			width: 2px;
			border-radius: 999px;
			background: transparent;
			transition: background 0.12s var(--ease);
		}
		.sheet-resize::after {
			content: '';
			position: absolute;
			top: 50%;
			right: 5px;
			transform: translateY(-50%);
			width: 4px;
			height: 44px;
			border-radius: 999px;
			background: var(--border-strong);
			transition: background 0.12s var(--ease);
		}
		.sheet-resize:hover::before,
		.modal.resizing .sheet-resize::before {
			background: color-mix(in srgb, var(--accent) 45%, transparent);
		}
		.sheet-resize:hover::after,
		.modal.resizing .sheet-resize::after {
			background: var(--accent);
		}
	}
</style>
