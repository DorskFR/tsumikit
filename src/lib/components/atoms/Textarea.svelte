<script lang="ts">
	import type { ControlSize } from '$lib/size';
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
	// With `autoresize`, the handle (either edge) sets a manual *floor*
	// (min-height) rather than a fixed height: the textarea still grows with
	// content, but dragging reserves extra space. `rows` is the initial floor.
	//
	// `onsubmit` fires with the value on Enter (`submitOn="enter"`, Shift+Enter
	// still inserts a newline) or Ctrl/Meta+Enter (`submitOn="mod-enter"`, the
	// default whenever `onsubmit` is given).
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import { autoresize as autoresizeAction, rowsFloor, rowsHeight } from '$lib/autoresize';
	import { getFieldContext, warnUnlabelled } from '$lib/field-context';
	import { getInputGroupContext } from '$lib/input-group-context';

	type Props = HTMLTextareaAttributes & {
		mono?: boolean;
		autoresize?: boolean;
		size?: ControlSize;
		/** Fill the free space of a flex row (`flex: 1 1 0`). */
		grow?: boolean;
		/** `false` pins the box (`flex: none`). */
		shrink?: boolean;
		/** Full-width block. */
		block?: boolean;
		/** Manual resize handle edge, or 'none' to disable. Defaults to a bottom
		 *  handle. With `autoresize` it drags a min-height floor (the textarea
		 *  still grows with content). */
		resize?: 'none' | 'top' | 'bottom';
		/** Error state: danger border + aria-invalid (also styles if a consumer
		 *  sets aria-invalid directly). */
		invalid?: boolean;
		/** Cap the height (with autoresize: stop growing and scroll past this). */
		maxHeight?: string;
		/** Fires with the current value on the `submitOn` key combo. */
		onsubmit?: (value: string) => void;
		submitOn?: 'enter' | 'mod-enter' | 'none';
		id?: string;
		'aria-describedby'?: string | null;
		'aria-invalid'?: HTMLTextareaAttributes['aria-invalid'];
		class?: string;
		value?: HTMLTextareaAttributes['value'];
		el?: HTMLTextAreaElement | null;
	};

	let {
		mono = false,
		autoresize = false,
		size,
		grow = false,
		shrink = true,
		block = false,
		resize = 'bottom',
		invalid = false,
		disabled = false,
		maxHeight,
		onsubmit,
		submitOn = 'none',
		onkeydown,
		id,
		'aria-describedby': ariaDescribedby,
		'aria-invalid': ariaInvalid,
		class: klass = '',
		value = $bindable(),
		el = $bindable(null),
		...rest
	}: Props = $props();

	const field = getFieldContext();
	const group = getInputGroupContext();
	const sizeEff = $derived(size ?? group?.size ?? 'md');
	const isInvalid = $derived(invalid || !!field?.invalid || !!group?.invalid);
	const isDisabled = $derived(disabled || !!group?.disabled);

	$effect(() => warnUnlabelled(el, 'Textarea'));

	// Grouped: report whether the content needs more than one row when laid out
	// with the single-line padding (measured in that layout so the bar cannot
	// flip back and forth), which moves the adornments into a bar under the text.
	// An empty field has no content height: its scrollHeight counts the placeholder.
	function probeBar() {
		if (!el || !group) return;
		const node = el;
		const wasBar = node.classList.contains('bar');
		const prevHeight = node.style.height;
		const floor = parseFloat(node.style.minHeight) || 0;
		node.classList.remove('bar');
		node.style.height = 'auto';
		node.style.minHeight = '';
		const cs = getComputedStyle(node);
		const borders = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
		const content = node.value === '' ? 0 : node.scrollHeight + borders;
		const height = Math.max(content, floor, rowsFloor(node));
		const oneRow = Math.max(rowsHeight(node, 1), parseFloat(cs.minHeight) || 0);
		node.style.height = prevHeight;
		if (floor) node.style.minHeight = `${floor}px`;
		if (wasBar) node.classList.add('bar');
		group.setBar(height > oneRow + 1);
	}
	$effect(() => {
		if (!group) return;
		void value;
		void group.leadingW;
		void group.trailingW;
		probeBar();
	});
	$effect(() => {
		if (!el || !group || typeof ResizeObserver === 'undefined') return;
		const ro = new ResizeObserver(probeBar);
		ro.observe(el);
		return () => ro.disconnect();
	});

	const handleEdge = $derived(resize);
	const showHandle = $derived(handleEdge !== 'none');
	const submitMode = $derived(submitOn === 'none' && onsubmit ? 'mod-enter' : submitOn);

	function handleKeydown(e: KeyboardEvent & { currentTarget: EventTarget & HTMLTextAreaElement }) {
		onkeydown?.(e);
		if (!onsubmit || e.key !== 'Enter' || e.defaultPrevented || submitMode === 'none') return;
		const mod = e.ctrlKey || e.metaKey;
		const submits =
			submitMode === 'enter' ? !e.shiftKey && !mod && !e.altKey : mod && !e.shiftKey && !e.altKey;
		if (!submits) return;
		e.preventDefault();
		onsubmit(String(value ?? ''));
	}

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

<div
	class="textarea-wrap"
	class:dragging
	class:grow={grow}
	class:no-shrink={!shrink}
	class:block={block}
	class:grouped={!!group}
	class:bar={!!group?.bar}
	data-tsu="Textarea"
>
	{#if autoresize}
		<textarea
			bind:this={el}
			class="textarea {klass}"
			class:mono
			class:textarea-sm={sizeEff === 'sm'}
			class:textarea-lg={sizeEff === 'lg'}
			class:grouped={!!group}
			class:bar={!!group?.bar}
			class:capped={!!maxHeight}
			disabled={isDisabled}
			style:max-height={maxHeight}
			bind:value
			use:autoresizeAction={typeof value === 'string' ? value : ''}
			{...rest}
			onkeydown={onsubmit || onkeydown ? handleKeydown : undefined}
			id={id ?? field?.id}
			aria-describedby={ariaDescribedby ?? field?.describedBy}
			aria-invalid={ariaInvalid ?? (isInvalid ? 'true' : undefined)}
		></textarea>
	{:else}
		<textarea
			bind:this={el}
			class="textarea {klass}"
			class:mono
			class:textarea-sm={sizeEff === 'sm'}
			class:textarea-lg={sizeEff === 'lg'}
			class:grouped={!!group}
			class:bar={!!group?.bar}
			class:capped={!!maxHeight}
			disabled={isDisabled}
			style:max-height={maxHeight}
			bind:value
			{...rest}
			onkeydown={onsubmit || onkeydown ? handleKeydown : undefined}
			id={id ?? field?.id}
			aria-describedby={ariaDescribedby ?? field?.describedBy}
			aria-invalid={ariaInvalid ?? (isInvalid ? 'true' : undefined)}
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
	.grow {
		flex: 1 1 0;
		min-width: 0;
	}
	.no-shrink {
		flex: none;
	}
	.block {
		display: flex;
		width: 100%;
	}
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
		background: var(--textarea-bg, var(--bg));
		border: 1px solid var(--textarea-border, var(--border-strong));
		border-radius: var(--textarea-radius, var(--r-md));
		color: var(--textarea-fg, var(--text));
		transition: border-color 0.12s var(--ease);
		/* Custom handle replaces the native grip; never show the native one. */
		resize: none;
		/* Match the single-row height of Button/Input so a `rows={1}` textarea
		   lines up with them; the native `rows` attribute grows it from here. */
		min-height: var(--textarea-size, 2.5rem);
		line-height: var(--lh-tight);
		font-family: inherit;
	}
	.textarea:focus {
		outline: none;
		border-color: var(--accent);
	}
	.textarea:focus-visible {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
	}
	.textarea.capped {
		overflow-y: auto;
	}
	.textarea-sm {
		padding: var(--sp-1) var(--sp-2);
		font-size: var(--fs-sm);
		min-height: var(--textarea-size, 2rem);
	}
	.textarea-lg {
		padding: var(--sp-3) var(--sp-4);
		font-size: max(16px, var(--fs-md));
		min-height: var(--textarea-size, var(--control-height-large));
	}
	/* iOS auto-zooms any field under 16px on focus; on touch the size modifiers
	   carry their difference through padding and height alone. */
	@media (pointer: coarse) {
		.textarea-sm {
			font-size: max(16px, var(--fs-sm));
		}
	}
	.textarea[aria-invalid='true'],
	.textarea[aria-invalid='true']:focus {
		border-color: var(--danger);
	}
	/* Inside an InputGroup the group draws the focus ring and the overlaid
	   adornments report their widths; the text stays clear of them. */
	.textarea.grouped {
		border-radius: var(--ig-radius);
		padding-inline: max(var(--ig-pad-x), var(--ig-leading-w, 0px) + var(--ig-gap))
			max(var(--ig-pad-x), var(--ig-trailing-w, 0px) + var(--ig-gap));
	}
	.textarea.grouped:not(.bar)::placeholder {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.textarea.grouped:focus-visible {
		outline: none;
	}
	.textarea.grouped.bar {
		padding-inline: var(--ig-pad-x);
		border-bottom: 0;
		border-end-start-radius: 0;
		border-end-end-radius: 0;
	}
	.textarea-wrap.grouped {
		width: 100%;
	}
	.textarea-wrap.grouped .resize-handle {
		left: var(--ig-leading-w, 0px);
		right: var(--ig-trailing-w, 0px);
	}
	.textarea-wrap.grouped.bar .resize-handle {
		left: 0;
		right: 0;
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
