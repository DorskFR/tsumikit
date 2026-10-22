<script lang="ts">
	import type { ControlSize } from '$lib/size';
	// File-picker button. A real <input type="file"> visually hidden inside a
	// <label> styled as a button — so it's keyboard-focusable and works with zero
	// JS to open the dialog. Emits the chosen files via `onfiles`. Dependency-free.
	import Icon from '$lib/components/atoms/Icon.svelte';
	import type { IconName } from '$lib/components/atoms/Icon.svelte';
	import { playSound } from '$lib/sound';

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
		control = false,
		box,
		hitArea = 'auto',
		sound = true,
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
		size?: ControlSize;
		/** Uniform `--control-height`, like Button's `control`, so it lines up in a
		 *  composer/toolbar row. */
		control?: boolean;
		/** Shared square box scale (`--box-xs/sm/md/lg`); implies `iconOnly`. */
		box?: 'xs' | 'sm' | 'md' | 'lg';
		/** Icon-only buttons grow a touch hit slab on coarse pointers; `compact` opts out. */
		hitArea?: 'auto' | 'compact';
		/** Play UI sounds when enabled globally; false silences this instance. */
		sound?: boolean;
		class?: string;
	} = $props();

	const onlyIcon = $derived(iconOnly || box !== undefined);

	function onchange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const files = Array.from(input.files ?? []);
		if (files.length) onfiles(files);
		input.value = ''; // allow re-picking the same file
	}
</script>

<label
	class="file-btn {klass}"
	data-tsu="FileButton"
	class:primary={variant === 'primary'}
	class:ghost={variant === 'ghost'}
	class:sm={size === 'sm'}
	class:lg={size === 'lg'}
	class:control
	class:icon-only={onlyIcon}
	class:box={box !== undefined}
	class:hit-compact={hitArea === 'compact'}
	style:--file-box={box ? `var(--box-${box})` : undefined}
	class:disabled
	aria-label={onlyIcon ? label : undefined}
>
	<input
		class="sr-only"
		type="file"
		{accept}
		{multiple}
		{disabled}
		onclick={() => playSound('click', sound)}
		onchange={onchange}
	/>
	{#if icon}
		<Icon name={icon} />
	{:else if emoji}
		<span class="emoji" aria-hidden="true">{emoji}</span>
	{/if}
	<span class="text" class:sr-only={onlyIcon}>{label}</span>
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
		padding: var(--sp-2) var(--btn-px-md);
		min-height: var(--control-height-default);
		border: var(--edge-width) solid var(--btn-edge);
		border-radius: var(--r-md);
		background: var(--btn-fill);
		--file-shadow-rest: var(--btn-shadow);
		--file-shadow-lift: var(--btn-shadow-hover);
		box-shadow: var(--file-shadow-rest);
		color: var(--text);
		font-weight: var(--fw-medium);
		font-size: var(--control-fs-md);
		line-height: var(--lh-none);
		max-width: 100%;
		white-space: nowrap;
		cursor: pointer;
		user-select: none;
		--icon-size: var(--control-icon-md);
		--file-scale-dur: var(--dur-release);
		--file-scale-ease: var(--ease-spring-bounce);
		transition:
			background var(--dur-fast) ease,
			border-color var(--dur-fast) ease,
			box-shadow var(--dur-fast) ease,
			color var(--dur-fast) ease,
			opacity var(--dur-fast) ease,
			translate var(--dur-fast) var(--ease-out),
			scale var(--file-scale-dur) var(--file-scale-ease);
	}
	.file-btn:active:not(.disabled) {
		--file-scale-dur: var(--dur-press);
		--file-scale-ease: var(--ease-out);
		scale: var(--press-scale);
	}
	.file-btn.icon-only:active:not(.disabled),
	.file-btn.box:active:not(.disabled) {
		scale: var(--press-scale-sm);
	}
	/* Size variants mirror the Button atom. */
	.file-btn.sm {
		min-height: var(--control-height-compact);
		padding: var(--sp-1) var(--btn-px-sm);
		font-size: var(--control-fs-sm);
		--icon-size: var(--control-icon-sm);
	}
	.file-btn.lg {
		min-height: var(--control-height-large);
		padding: var(--sp-3) var(--btn-px-lg);
		font-size: var(--control-fs-lg);
		--icon-size: var(--control-icon-lg);
	}
	.file-btn.control {
		height: var(--control-height);
		min-height: var(--control-height);
		padding: 0 var(--control-px-md);
	}
	/* icon-only: square it up and drop the label gap. */
	.file-btn.icon-only {
		gap: 0;
		padding: var(--sp-2);
		aspect-ratio: 1;
	}
	.file-btn.box {
		width: var(--file-box);
		min-width: var(--file-box);
		height: var(--file-box);
		min-height: var(--file-box);
		padding: 0;
		flex: none;
	}
	@media (pointer: coarse) {
		.file-btn.icon-only:not(.hit-compact) {
			position: relative;
		}
		.file-btn.icon-only:not(.hit-compact)::after {
			content: '';
			position: absolute;
			inset-block: min(0px, calc((100% - var(--touch-target)) / 2));
			inset-inline-start: min(0px, calc((100% - var(--touch-target)) / 2));
			inset-inline-end: 0;
		}
	}
	/* An emoji reads small next to an SVG glyph of the same size: one icon tier up. */
	.text:not(.sr-only) {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.emoji {
		display: inline-flex;
		font-size: var(--icon-lg);
		line-height: var(--lh-none);
	}
	.file-btn.sm .emoji {
		font-size: var(--icon-md);
	}
	.file-btn.lg .emoji {
		font-size: var(--icon-xl);
	}
	.file-btn.primary {
		background: var(--btn-primary-fill);
		border-color: var(--btn-primary-edge);
		--file-shadow-rest: var(--btn-primary-shadow);
		--file-shadow-lift: var(--btn-primary-shadow-hover);
		color: var(--text-on-accent);
		font-weight: var(--fw-semibold);
	}
	.file-btn.ghost {
		background: transparent;
		border-color: transparent;
		--file-shadow-rest: none;
		--file-shadow-lift: none;
	}
	/* The hidden input keeps focusability (sr-only, not display:none), so mirror
	   its focus onto the label for a visible ring. */
	.file-btn:focus-within {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
		box-shadow: var(--file-shadow-rest), var(--focus-glow);
	}
	.file-btn.disabled {
		opacity: var(--disabled-opacity);
		cursor: not-allowed;
	}
	@media (hover: hover) and (pointer: fine) {
		.file-btn:hover:not(.disabled) {
			border-color: var(--accent);
			translate: 0 calc(-1 * var(--hover-lift));
			--file-shadow-rest: var(--file-shadow-lift);
		}
		.file-btn.primary:hover:not(.disabled) {
			filter: brightness(1.08);
		}
		.file-btn.ghost:hover:not(.disabled) {
			background: var(--bg-elevated-2);
			border-color: transparent;
		}
	}
</style>
