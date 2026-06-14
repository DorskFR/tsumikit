<script lang="ts">
	// Multi-line text input primitive. Owns its styling from theme tokens;
	// supports `bind:value` and passes through every native <textarea> attribute
	// and event (Svelte 5 events are props, so `...rest` forwards them). `mono`
	// switches to the monospace family. `autoresize` opts into the grow-with-
	// content action without the call-site wiring `use:` itself. `bind:el`
	// exposes the underlying element for focus/measure.
	//
	// `resize` replaces the native (un-themeable) resize grip with our own drag
	// handle on the top or bottom edge, styled like the Modal/AppShell grips: a
	// centered pill that's a thicker portion of the border.
	//
	// With `autoresize`, only a `top` handle is offered and it sets a manual
	// *floor* (min-height) rather than a fixed height: the textarea still grows
	// with content, but dragging up reserves extra space. (A bottom handle makes
	// no sense alongside content-driven sizing, so it's suppressed.)
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import { autoresize as autoresizeAction } from '$lib/autoresize';

	type Props = HTMLTextareaAttributes & {
		mono?: boolean;
		autoresize?: boolean;
		size?: 'sm' | 'md';
		/** Manual resize handle edge, or 'none' to disable. Defaults to a bottom
		 *  handle. With `autoresize`, only `top` is honored and it drags a
		 *  min-height floor (the textarea still grows with content). */
		resize?: 'none' | 'top' | 'bottom';
		/** Error state: danger border + aria-invalid (also styles if a consumer
		 *  sets aria-invalid directly). */
		invalid?: boolean;
		class?: string;
		value?: HTMLTextareaAttributes['value'];
		el?: HTMLTextAreaElement | null;
	};

	let {
		mono = false,
		autoresize = false,
		size = 'md',
		resize = 'bottom',
		invalid = false,
		class: klass = '',
		value = $bindable(),
		el = $bindable(null),
		...rest
	}: Props = $props();

	// With autoresize, only the top handle (a min-height floor) is meaningful.
	const handleEdge = $derived(autoresize ? (resize === 'top' ? 'top' : 'none') : resize);
	const showHandle = $derived(handleEdge !== 'none');

	// --- manual resize drag (mirrors AppShell/Modal: rAF-throttled pointer drag) ---
	let dragging = $state(false);
	let rafId = 0;
	let startY = 0;
	let startH = 0;
	let lastY = 0;

	function startDrag(e: PointerEvent) {
		if (!el) return;
		dragging = true;
		startY = lastY = e.clientY;
		startH = el.offsetHeight;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		e.preventDefault();
	}
	function onDrag(e: PointerEvent) {
		if (!dragging || !el) return;
		lastY = e.clientY;
		if (rafId) return;
		rafId = requestAnimationFrame(() => {
			rafId = 0;
			if (!el) return;
			// Top handle grows upward (drag up = taller), bottom grows downward.
			const delta = handleEdge === 'top' ? startY - lastY : lastY - startY;
			const next = Math.max(0, startH + delta);
			if (autoresize) {
				// Set a min-height floor and let the autoresize action re-measure
				// (content still wins the lower bound). Dispatch input to re-run it.
				el.style.minHeight = `${next}px`;
				el.dispatchEvent(new Event('input'));
			} else {
				el.style.height = `${next}px`;
			}
		});
	}
	function endDrag(e: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = 0;
		}
		try {
			(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		} catch {
			/* already released */
		}
	}
</script>

<div class="textarea-wrap" class:dragging>
	{#if autoresize}
		<textarea
			bind:this={el}
			class="textarea {klass}"
			class:mono
			class:textarea-sm={size === 'sm'}
			bind:value
			use:autoresizeAction={typeof value === 'string' ? value : ''}
			{...rest}
			aria-invalid={invalid || undefined}
		></textarea>
	{:else}
		<textarea
			bind:this={el}
			class="textarea {klass}"
			class:mono
			class:textarea-sm={size === 'sm'}
			bind:value
			{...rest}
			aria-invalid={invalid || undefined}
		></textarea>
	{/if}
	{#if showHandle}
		<div
			class="resize-handle resize-{handleEdge}"
			onpointerdown={startDrag}
			onpointermove={onDrag}
			onpointerup={endDrag}
			onpointercancel={endDrag}
			role="separator"
			aria-orientation="horizontal"
			aria-label="Resize"
		></div>
	{/if}
</div>

<style>
	.textarea-wrap {
		position: relative;
		display: flex;
	}
	.textarea {
		width: 100%;
		/* Horizontal padding matches Input/Button; vertical padding is tighter
		   (--sp-2) so a single line-box + border actually fits the 2.5rem floor —
		   --sp-3 top+bottom would overshoot it and a `rows={1}` textarea would
		   render taller than the buttons it sits beside. */
		padding: var(--sp-2) var(--sp-3);
		background: var(--bg);
		border: 1px solid var(--border-strong);
		border-radius: var(--r-md);
		color: var(--text);
		transition: border-color 0.12s var(--ease);
		/* Custom handle replaces the native grip; never show the native one. */
		resize: none;
		/* Match the single-row height of Button/Input so a `rows={1}` textarea
		   lines up with them; the native `rows` attribute grows it from here. */
		min-height: 2.5rem;
		line-height: var(--lh-tight);
		font-family: inherit;
	}
	.textarea:focus {
		outline: none;
		border-color: var(--accent);
	}
	.textarea-sm {
		padding: var(--sp-1) var(--sp-2);
		font-size: var(--fs-sm);
		min-height: 2rem;
	}
	.textarea[aria-invalid='true'],
	.textarea[aria-invalid='true']:focus {
		border-color: var(--danger);
	}
	.mono {
		font-family: var(--font-mono);
	}

	/* Drag handle: a thin full-width strip on an edge, with a centered pill grip
	   (a thicker portion of the border) that brightens to the accent on hover /
	   while dragging — mirroring the Modal and AppShell resize grips. */
	.resize-handle {
		position: absolute;
		left: 0;
		right: 0;
		height: 12px;
		cursor: ns-resize;
		touch-action: none;
	}
	.resize-bottom {
		bottom: 0;
	}
	.resize-top {
		top: 0;
	}
	.resize-handle::after {
		content: '';
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		width: 28px;
		height: 3px;
		border-radius: 999px;
		background: var(--border-strong);
		transition: background 0.12s var(--ease);
	}
	.resize-bottom::after {
		bottom: 3px;
	}
	.resize-top::after {
		top: 3px;
	}
	.resize-handle:hover::after,
	.dragging .resize-handle::after {
		background: var(--accent);
	}
</style>
