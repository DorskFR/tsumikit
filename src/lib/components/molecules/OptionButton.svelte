<script lang="ts">
	// Selection-card option — a bordered card that gains a colored ring + tint
	// when `selected`. The accent is driven by `--opt-accent` (default accent),
	// so each picker recolors per use (blue for run-target, brand color for the
	// adapter, green/blue/red for permission mode). `row` lays the content out
	// horizontally (icon + label) instead of the default label-over-hint column.
	//
	// A selection card shares almost nothing visually with Button, so it owns its
	// own <button> + scoped styles rather than specializing the Button atom.
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { playSound } from '$lib/sound';

	let {
		selected = false,
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
		--opt-scale-dur: var(--dur-fast);
		transition:
			background var(--dur-fast) ease,
			border-color var(--dur-fast) ease,
			color var(--dur-fast) ease,
			translate var(--dur-fast) ease,
			scale var(--opt-scale-dur) var(--ease-out);
	}
	.opt:disabled {
		opacity: var(--disabled-opacity);
		cursor: not-allowed;
	}
	.opt:active:not(:disabled) {
		--opt-scale-dur: var(--dur-press);
		scale: var(--press-scale);
	}
	.opt.row {
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: var(--sp-2);
		color: var(--text-muted);
		font-weight: var(--fw-medium);
	}
	.opt.block {
		width: 100%;
	}
	.description {
		font-size: var(--fs-xs);
		color: var(--faint-color, var(--text-muted));
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
		--oc: var(--opt-accent, var(--accent));
		/* Retint slotted `.faint` hint text toward the accent — via an inherited
		   custom property, so no :global reach into slotted content. */
		--faint-color: color-mix(in srgb, var(--oc) 70%, var(--text-muted));
		border-color: var(--oc);
		background: color-mix(in srgb, var(--oc) 14%, var(--bg));
		color: var(--oc);
	}
	@media (hover: hover) and (pointer: fine) {
		.opt:hover:not(:disabled) {
			translate: 0 calc(-1 * var(--hover-lift));
		}
		.opt:hover:not(:disabled):not(.selected) {
			border-color: var(--control-edge);
		}
		.opt.selected:hover:not(:disabled) {
			border-color: var(--oc);
			background: color-mix(in srgb, var(--oc) 20%, var(--bg));
		}
	}
</style>
