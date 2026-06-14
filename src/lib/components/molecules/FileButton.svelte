<script lang="ts">
	// File-picker button. A real <input type="file"> visually hidden inside a
	// <label> styled as a button — so it's keyboard-focusable and works with zero
	// JS to open the dialog. Emits the chosen files via `onfiles`. Dependency-free.
	import Icon from '$lib/components/atoms/Icon.svelte';
	import type { IconName } from '$lib/components/atoms/Icon.svelte';

	let {
		onfiles,
		label = 'Choose file',
		icon,
		emoji = '📎',
		iconOnly = false,
		accept,
		multiple = false,
		disabled = false,
		variant = 'default',
		size = 'md',
		class: klass = ''
	}: {
		onfiles: (files: File[]) => void;
		label?: string;
		/** A registered glyph name (rendered as SVG). Use `emoji` for an
		 *  off-registry glyph. */
		icon?: IconName;
		/** Off-registry glyph such as an emoji, rendered as text as-is. Defaults to
		 *  the 📎 paperclip emoji; ignored when `icon` is set. */
		emoji?: string;
		/** Hide the label visually, showing only the icon. The label is kept for
		 *  assistive tech (and used as the accessible name). */
		iconOnly?: boolean;
		accept?: string;
		multiple?: boolean;
		disabled?: boolean;
		variant?: 'default' | 'primary' | 'ghost';
		/** Match the Button atom's sizes so a FileButton lines up with buttons in
		 *  the same row. */
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	} = $props();

	function onchange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const files = Array.from(input.files ?? []);
		if (files.length) onfiles(files);
		input.value = ''; // allow re-picking the same file
	}
</script>

<label
	class="file-btn {klass}"
	class:primary={variant === 'primary'}
	class:ghost={variant === 'ghost'}
	class:sm={size === 'sm'}
	class:lg={size === 'lg'}
	class:icon-only={iconOnly}
	class:disabled
	aria-label={iconOnly ? label : undefined}
>
	<input
		class="sr-only"
		type="file"
		{accept}
		{multiple}
		{disabled}
		onchange={onchange}
	/>
	{#if icon}
		<Icon name={icon} />
	{:else if emoji}
		<span class="emoji" aria-hidden="true">{emoji}</span>
	{/if}
	<span class:sr-only={iconOnly}>{label}</span>
</label>

<style>
	/* FileButton is a <label> (so the native file input stays inside it and
	   keyboard-focusable), not a <button>, so it can't be the Button atom — it
	   owns the canonical control look here, from the same tokens. */
	.file-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--sp-2);
		padding: var(--sp-2) var(--sp-4);
		min-height: 2.5rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--r-md);
		background: var(--surface);
		color: var(--text);
		font-weight: var(--fw-medium);
		font-size: var(--fs-sm);
		line-height: 1;
		white-space: nowrap;
		cursor: pointer;
		user-select: none;
		transition:
			background 0.12s var(--ease),
			border-color 0.12s var(--ease),
			opacity 0.12s var(--ease);
	}
	.file-btn:hover:not(.disabled) {
		border-color: var(--accent);
	}
	/* Size variants mirror the Button atom (sm 2rem / md 2.5rem / lg 3rem). */
	.file-btn.sm {
		min-height: 2rem;
		padding: var(--sp-1) var(--sp-3);
		font-size: var(--fs-xs);
	}
	.file-btn.lg {
		min-height: 3rem;
		padding: var(--sp-3) var(--sp-5);
		font-size: var(--fs-base);
	}
	/* icon-only: square it up and drop the label gap. */
	.file-btn.icon-only {
		gap: 0;
		padding: var(--sp-2);
		aspect-ratio: 1;
	}
	/* Emoji glyph is bumped above the text size — at 1em a paperclip is hard to
	   read, so render it a touch larger for legibility. */
	.emoji {
		display: inline-flex;
		font-size: 1.35em;
		line-height: 1;
	}
	.file-btn.primary {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--text-on-accent);
		font-weight: var(--fw-semibold);
	}
	.file-btn.primary:hover:not(.disabled) {
		filter: brightness(1.08);
	}
	.file-btn.ghost {
		background: transparent;
		border-color: transparent;
	}
	.file-btn.ghost:hover:not(.disabled) {
		background: var(--bg-elevated-2);
		border-color: transparent;
	}
	/* The hidden input keeps focusability (sr-only, not display:none), so mirror
	   its focus onto the label for a visible ring. */
	.file-btn:focus-within {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.file-btn.disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
</style>
