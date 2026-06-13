<script lang="ts">
	// Selection-card option — a bordered card that gains a colored ring + tint
	// when `selected`. The accent is driven by `--opt-accent` (default accent),
	// so each picker recolors per use (blue for run-target, brand color for the
	// adapter, green/blue/red for permission mode). `row` lays the content out
	// horizontally (icon + label) instead of the default label-over-hint column.
	//
	// Specializes the Button atom (ghost variant) so it inherits the canonical
	// disabled/focus/transition behaviour; the card surface + selection ring are
	// overrides. Button's variant classes are scoped via :where() (0 specificity),
	// so `.btn.opt-btn` (0,2,0) wins cleanly over `.btn-ghost`.
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Button from '$lib/components/atoms/Button.svelte';

	let {
		selected = false,
		row = false,
		class: klass = '',
		children,
		...rest
	}: HTMLButtonAttributes & {
		selected?: boolean;
		row?: boolean;
		children?: Snippet;
	} = $props();
</script>

<Button
	{...rest}
	variant="ghost"
	class="opt-btn {row ? 'row' : ''} {selected ? 'sel' : ''} {klass}"
	aria-pressed={selected}
>
	{@render children?.()}
</Button>

<style>
	/* Rendered inside Button, so target via :global; `.btn.opt-btn` outranks the
	   atom's :where()-scoped variant classes. */
	:global(.btn.opt-btn) {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: var(--sp-2);
		min-height: 0;
		background: var(--bg);
		border: 1px solid var(--border-strong);
		border-radius: var(--r-md);
		color: var(--text);
		text-align: left;
		white-space: normal;
	}
	/* Hover only restyles UNselected cards. Excluding `.sel` matters because this
	   rule is (0,4,0) — the `:not(:disabled)` pseudo-class pushes it above
	   `.btn.opt-btn.sel` (0,3,0) — so without the guard it would strip a selected
	   card's accent border + tint on hover, leaving a half-styled card. */
	:global(.btn.opt-btn:hover:not(:disabled):not(.sel)) {
		border-color: var(--border-strong);
		background: var(--bg);
	}
	:global(.btn.opt-btn.row) {
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: var(--sp-2);
		color: var(--text-muted);
		font-weight: var(--fw-medium);
	}
	:global(.btn.opt-btn.sel) {
		--oc: var(--opt-accent, var(--accent));
		border-color: var(--oc);
		background: color-mix(in srgb, var(--oc) 14%, var(--bg));
		color: var(--oc);
	}
	/* Reassert the accent on a hovered selected card. Button's `.btn-ghost:hover`
	   (0,3,0) ties with `.sel` and wins on source order, repainting the card with
	   the neutral elevated hover bg + transparent border; this rule (0,5,0) beats
	   it so the selection stays visible, slightly brightened for hover affordance. */
	:global(.btn.opt-btn.sel:hover:not(:disabled)) {
		border-color: var(--oc);
		background: color-mix(in srgb, var(--oc) 20%, var(--bg));
	}
	/* The slotted hint text (a global `.faint`) tints toward the accent too. */
	:global(.btn.opt-btn.sel .faint) {
		color: color-mix(in srgb, var(--oc) 70%, var(--text-muted));
	}
</style>
