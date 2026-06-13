<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type ButtonProps = HTMLButtonAttributes & {
		// Base look. `option`/`toggle` are specialization variants used by the
		// OptionButton / Toggle molecules — they pass a prop instead of reaching
		// into this element with :global, so all the styling stays scoped here.
		variant?: 'default' | 'primary' | 'ghost' | 'danger' | 'option' | 'toggle';
		size?: 'sm' | 'md';
		control?: boolean;
		block?: boolean;
		// Square 2.25rem icon-only tap target (IconButton). `iconInline` is the
		// borderless, compact variant (chip-remove ✕, inline edit ✎); pair with
		// `hoverDanger` to tint it red on hover (delete affordances).
		icon?: boolean;
		iconInline?: boolean;
		hoverDanger?: boolean;
		// Shared selection/shape state for the option/toggle variants.
		selected?: boolean;
		row?: boolean;
		pill?: boolean;
		struck?: boolean;
		class?: string;
		children?: Snippet;
	};

	let {
		variant = 'default',
		size = 'md',
		control = false,
		block = false,
		icon = false,
		iconInline = false,
		hoverDanger = false,
		selected = false,
		row = false,
		pill = false,
		struck = false,
		type = 'button',
		disabled = false,
		title,
		onclick,
		class: klass = '',
		children,
		...rest
	}: ButtonProps = $props();
</script>

<button
	{...rest}
	{type}
	{disabled}
	{title}
	class="btn {klass}"
	class:btn-primary={variant === 'primary'}
	class:btn-ghost={variant === 'ghost'}
	class:btn-danger={variant === 'danger'}
	class:option={variant === 'option'}
	class:toggle={variant === 'toggle'}
	class:btn-sm={size === 'sm'}
	class:btn-control={control}
	class:btn-block={block}
	class:btn-icon={icon}
	class:btn-icon-inline={iconInline}
	class:hover-danger={hoverDanger}
	class:selected
	class:row
	class:pill
	class:struck
	onclick={onclick}
>
	{@render children?.()}
</button>

<style>
	/* The canonical control: owns its variants/sizes/modifiers from theme tokens.
	   Svelte 5 scopes via :where() (zero added specificity), so feature-component
	   overrides keep winning by specificity. Icons size themselves (Icon.svelte),
	   so no svg sizing rule lives here. */
	.btn {
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
		transition:
			background 0.12s var(--ease),
			border-color 0.12s var(--ease),
			opacity 0.12s var(--ease);
		user-select: none;
		white-space: nowrap;
	}
	.btn:hover:not(:disabled) {
		border-color: var(--accent);
	}
	.btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.btn-primary {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--text-on-accent);
		font-weight: var(--fw-semibold);
	}
	.btn-primary:hover:not(:disabled) {
		filter: brightness(1.08);
	}
	.btn-danger {
		color: var(--danger);
		border-color: color-mix(in srgb, var(--danger) 50%, var(--border));
	}
	.btn-danger:hover:not(:disabled) {
		background: color-mix(in srgb, var(--danger) 14%, transparent);
		border-color: var(--danger);
	}
	.btn-ghost {
		background: transparent;
		border-color: transparent;
	}
	.btn-ghost:hover:not(:disabled) {
		background: var(--bg-elevated-2);
		border-color: transparent;
	}
	.btn-sm {
		min-height: 2rem;
		padding: var(--sp-1) var(--sp-3);
		font-size: var(--fs-xs);
	}
	.btn-block {
		width: 100%;
	}

	/* Uniform-height control: icon buttons, inputs and action buttons that share a
	   toolbar/composer row line up exactly. */
	.btn-control {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--sp-2);
		height: var(--control-height);
		min-height: var(--control-height);
		padding: 0 var(--sp-3);
		border: 1px solid var(--border-strong);
		border-radius: var(--r-md);
		background: var(--surface);
		color: var(--text);
		font-weight: var(--fw-medium);
		font-size: var(--fs-sm);
		line-height: 1;
		white-space: nowrap;
		transition:
			background 0.12s var(--ease),
			border-color 0.12s var(--ease),
			opacity 0.12s var(--ease);
		user-select: none;
	}
	.btn-control:hover:not(:disabled) {
		border-color: var(--accent);
	}
	.btn-control:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	/* .btn-control follows .btn-primary in source order and would otherwise paint
	   the primary action with the neutral --surface; restore the accent fill when
	   both are present. */
	.btn-control.btn-primary {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--text-on-accent);
	}
	.btn-control.btn-primary:hover:not(:disabled) {
		border-color: var(--accent);
		filter: brightness(1.08);
	}

	/* Icon-only buttons (IconButton). Square box = consistent 2.25rem tap target. */
	.btn-icon {
		min-height: 2.25rem;
		min-width: 2.25rem;
		padding: var(--sp-2);
	}
	.btn-icon-inline {
		min-height: 0;
		min-width: 0;
		padding: 0 var(--sp-1);
		border: none;
		background: none;
		color: var(--text-muted);
	}
	.btn-icon-inline:hover:not(:disabled) {
		border: none;
		background: none;
		color: var(--text);
	}
	.btn-icon-inline.hover-danger:hover:not(:disabled) {
		color: var(--danger);
	}

	/* OptionButton — bordered selection card; gains a colored ring + tint when
	   selected. The accent is driven by --opt-accent (default accent), so each
	   picker recolors per use. `row` lays icon + label horizontally. */
	.option {
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
	.option:hover:not(:disabled):not(.selected) {
		border-color: var(--border-strong);
		background: var(--bg);
	}
	.option.row {
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: var(--sp-2);
		color: var(--text-muted);
		font-weight: var(--fw-medium);
	}
	.option.selected {
		--oc: var(--opt-accent, var(--accent));
		border-color: var(--oc);
		background: color-mix(in srgb, var(--oc) 14%, var(--bg));
		color: var(--oc);
	}
	.option.selected:hover:not(:disabled) {
		border-color: var(--oc);
		background: color-mix(in srgb, var(--oc) 20%, var(--bg));
	}
	/* The slotted hint text (a `.faint` utility) tints toward the accent too. */
	.option.selected :global(.faint) {
		color: color-mix(in srgb, var(--oc) 70%, var(--text-muted));
	}

	/* Toggle — muted chip that lights up (tinted) when selected. The "on" tint is
	   driven by --toggle-accent (default accent), so callers recolor per use. */
	.toggle {
		gap: 4px;
		min-height: 0;
		padding: 0.15rem var(--sp-2);
		border-radius: var(--r-sm);
		font-size: var(--fs-xs);
		font-weight: var(--fw-medium);
		line-height: 1.4;
		background: var(--bg-elevated-2);
		color: var(--text-muted);
		border: 1px solid var(--border);
	}
	.toggle.pill {
		border-radius: var(--r-pill);
	}
	.toggle:hover:not(:disabled) {
		border-color: var(--border-strong);
		background: var(--bg-elevated-2);
	}
	.toggle.selected {
		--tc: var(--toggle-accent, var(--accent));
		color: var(--tc);
		border-color: color-mix(in srgb, var(--tc) 55%, transparent);
		background: color-mix(in srgb, var(--tc) 16%, transparent);
	}
	.toggle.struck {
		text-decoration: line-through;
	}
</style>
