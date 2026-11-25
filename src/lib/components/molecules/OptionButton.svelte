<script lang="ts">
	// Selection-card option — a bordered card that gains a colored ring + tint
	// when `selected`. The ring follows `tone` (default accent), so each picker
	// recolors per use (green/blue/red for permission mode). `row` lays the content out
	// horizontally (icon + label) instead of the default label-over-hint column.
	//
	// A selection card shares almost nothing visually with Button, so it owns its
	// own <button> + scoped styles rather than specializing the Button atom.
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { playSound } from '$lib/sound';
	import { canonicalTone, type Tone } from '$lib/tone';

	let {
		selected = false,
		tone = 'accent',
		row = false,
		align = 'center',
		block = false,
		type = 'button',
		disabled = false,
		value,
		description,
		onfocuschange,
		onfocus,
		onpointerenter,
		onclick,
		sound = true,
		'aria-describedby': describedBy,
		class: klass = '',
		children,
		...rest
	}: Omit<HTMLButtonAttributes, 'value'> & {
		selected?: boolean;
		/** Colour of the selected ring and tint. */
		tone?: Tone;
		row?: boolean;
		/** Identifies this option in `onfocuschange`. */
		value?: string;
		/** Secondary text under the content, announced via `aria-describedby`. */
		description?: string;
		/** Fires with `value` when the button gains keyboard focus or pointer
		 *  hover, so a consumer can drive a preview pane across a set of cards. */
		onfocuschange?: (value: string) => void;
		/** Horizontal content alignment. `start` gives a left-aligned list-row
		 *  variant (pair with `block` for a full-width menu item). */
		align?: 'center' | 'start';
		/** Stretch to fill the container width (full-width list/menu row). */
		block?: boolean;
		/** Play UI sounds when enabled globally; false silences this instance. */
		sound?: boolean;
		children?: Snippet;
	} = $props();

	const t = $derived(canonicalTone(tone));
	const uid = $props.id();
	const descId = $derived(description ? `${uid}-desc` : undefined);
	const ariaDescribedBy = $derived([describedBy, descId].filter(Boolean).join(' ') || undefined);

	function activate() {
		if (value !== undefined) onfocuschange?.(value);
	}
</script>

<button
	data-tsu="OptionButton"
	{...rest}
	{type}
	{disabled}
	{value}
	aria-describedby={ariaDescribedBy}
	onfocus={(e) => {
		onfocus?.(e);
		activate();
	}}
	onpointerenter={(e) => {
		onpointerenter?.(e);
		activate();
	}}
	onclick={(e) => {
		if (disabled) return;
		playSound('click', sound);
		onclick?.(e);
	}}
	class="opt {klass}"
	class:row
	class:align-start={align === 'start'}
	class:block
	class:selected
	class:tone-neutral={t === 'neutral'}
	class:tone-ok={t === 'ok'}
	class:tone-warn={t === 'warn'}
	class:tone-danger={t === 'danger'}
	class:tone-info={t === 'info'}
	aria-pressed={selected}
>
	{@render children?.()}
	{#if description}<span class="description" id={descId}>{description}</span>{/if}
</button>

<style>
	.opt {
		display: flex;
		flex-direction: column;
		gap: var(--sp-0-5);
		padding: var(--sp-2);
		background: var(--control-fill);
		border: var(--edge-width) solid var(--control-edge);
		border-radius: var(--r-md);
		box-shadow: var(--control-shadow);
		color: var(--text);
		text-align: left;
		white-space: normal;
		user-select: none;
		transition:
			background var(--dur-fast) ease,
			border-color var(--dur-fast) ease,
			color var(--dur-fast) ease,
			translate var(--dur-fast) ease,
			scale var(--dur-fast) var(--ease-out);
	}
	.opt:disabled {
		opacity: var(--disabled-opacity);
		cursor: not-allowed;
	}
	.opt:active:not(:disabled) {
		scale: var(--press-scale);
		transition:
			background var(--dur-fast) ease,
			border-color var(--dur-fast) ease,
			color var(--dur-fast) ease,
			translate var(--dur-fast) ease,
			scale var(--dur-press) var(--ease-out);
	}
	.opt.row {
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: var(--sp-2);
		color: var(--text-muted);
		font-weight: var(--fw-semibold);
	}
	.opt.block {
		width: 100%;
	}
	.description {
		font-size: var(--fs-xs);
		color: var(--text-muted);
		font-weight: var(--fw-normal);
	}
	.opt.row .description {
		flex: 1 1 auto;
		min-width: 0;
	}
	/* Left-aligned list-row variant: content packs to the start on both axes. */
	.opt.align-start {
		align-items: flex-start;
	}
	.opt.row.align-start {
		justify-content: flex-start;
	}
	.opt.selected {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 14%, var(--bg));
		color: var(--accent);
	}
	.opt.selected .description,
	.opt.selected :global(.faint) {
		color: color-mix(in srgb, var(--accent) 70%, var(--text-muted));
	}
	.opt.selected.tone-neutral {
		border-color: var(--text);
		background: color-mix(in srgb, var(--text) 14%, var(--bg));
		color: var(--text);
	}
	.opt.selected.tone-neutral .description,
	.opt.selected.tone-neutral :global(.faint) {
		color: color-mix(in srgb, var(--text) 70%, var(--text-muted));
	}
	.opt.selected.tone-ok {
		border-color: var(--ok);
		background: color-mix(in srgb, var(--ok) 14%, var(--bg));
		color: var(--ok);
	}
	.opt.selected.tone-ok .description,
	.opt.selected.tone-ok :global(.faint) {
		color: color-mix(in srgb, var(--ok) 70%, var(--text-muted));
	}
	.opt.selected.tone-warn {
		border-color: var(--warn);
		background: color-mix(in srgb, var(--warn) 14%, var(--bg));
		color: var(--warn);
	}
	.opt.selected.tone-warn .description,
	.opt.selected.tone-warn :global(.faint) {
		color: color-mix(in srgb, var(--warn) 70%, var(--text-muted));
	}
	.opt.selected.tone-danger {
		border-color: var(--danger);
		background: color-mix(in srgb, var(--danger) 14%, var(--bg));
		color: var(--danger);
	}
	.opt.selected.tone-danger .description,
	.opt.selected.tone-danger :global(.faint) {
		color: color-mix(in srgb, var(--danger) 70%, var(--text-muted));
	}
	.opt.selected.tone-info {
		border-color: var(--info);
		background: color-mix(in srgb, var(--info) 14%, var(--bg));
		color: var(--info);
	}
	.opt.selected.tone-info .description,
	.opt.selected.tone-info :global(.faint) {
		color: color-mix(in srgb, var(--info) 70%, var(--text-muted));
	}
	@media (hover: hover) and (pointer: fine) {
		.opt:hover:not(:disabled) {
			translate: 0 calc(-1 * var(--hover-lift));
		}
		.opt:hover:not(:disabled):not(.selected) {
			border-color: var(--control-edge);
		}
		.opt.selected:hover:not(:disabled) {
			background: color-mix(in srgb, var(--accent) 20%, var(--bg));
		}
		.opt.selected.tone-neutral:hover:not(:disabled) {
			background: color-mix(in srgb, var(--text) 20%, var(--bg));
		}
		.opt.selected.tone-ok:hover:not(:disabled) {
			background: color-mix(in srgb, var(--ok) 20%, var(--bg));
		}
		.opt.selected.tone-warn:hover:not(:disabled) {
			background: color-mix(in srgb, var(--warn) 20%, var(--bg));
		}
		.opt.selected.tone-danger:hover:not(:disabled) {
			background: color-mix(in srgb, var(--danger) 20%, var(--bg));
		}
		.opt.selected.tone-info:hover:not(:disabled) {
			background: color-mix(in srgb, var(--info) 20%, var(--bg));
		}
	}
</style>
