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

	let {
		selected = false,
		row = false,
		align = 'center',
		block = false,
		type = 'button',
		disabled = false,
		class: klass = '',
		children,
		...rest
	}: HTMLButtonAttributes & {
		selected?: boolean;
		row?: boolean;
		/** Horizontal content alignment. `start` gives a left-aligned list-row
		 *  variant (pair with `block` for a full-width menu item). */
		align?: 'center' | 'start';
		/** Stretch to fill the container width (full-width list/menu row). */
		block?: boolean;
		children?: Snippet;
	} = $props();
</script>

<button
	data-tsu="OptionButton"
	{...rest}
	{type}
	{disabled}
	class="opt {klass}"
	class:row
	class:align-start={align === 'start'}
	class:block
	class:selected
	aria-pressed={selected}
>
	{@render children?.()}
</button>

<style>
	.opt {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: var(--sp-2);
		background: var(--bg);
		border: 1px solid var(--border-strong);
		border-radius: var(--r-md);
		color: var(--text);
		text-align: left;
		white-space: normal;
		user-select: none;
		transition:
			background 0.12s var(--ease),
			border-color 0.12s var(--ease),
			color 0.12s var(--ease);
	}
	.opt:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.opt:hover:not(:disabled):not(.selected) {
		border-color: var(--border-strong);
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
	.opt.selected:hover:not(:disabled) {
		border-color: var(--oc);
		background: color-mix(in srgb, var(--oc) 20%, var(--bg));
	}
</style>
