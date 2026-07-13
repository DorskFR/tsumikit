<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type ButtonProps = HTMLButtonAttributes & {
		variant?: 'default' | 'primary' | 'ghost' | 'danger';
		// Semantic state tint layered on top of the variant: tints text/border and
		// adds a subtle fill on hover. For stateful controls — an "on"/active toggle
		// (`accent`), or cost/severity states (`info`, `warn`).
		tone?: 'none' | 'accent' | 'info' | 'warn' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		control?: boolean;
		block?: boolean;
		// Square 2.25rem icon-only tap target (IconButton). `iconInline` is the
		// borderless, compact variant (chip-remove ✕, inline edit ✎); pair with
		// `hoverDanger` to tint it red on hover (delete affordances).
		icon?: boolean;
		// Larger 2.5rem outlined square icon-chip (header/toolbar action). Pairs
		// with `tone` for tinted severity chips (back/archive/interrupt/more).
		chip?: boolean;
		iconInline?: boolean;
		hoverDanger?: boolean;
		// Async/busy state: shows a spinner, blocks clicks, sets aria-busy. Stays
		// disabled-equivalent while true (so a double-submit can't fire).
		loading?: boolean;
		class?: string;
		children?: Snippet;
	};

	let {
		variant = 'default',
		tone = 'none',
		size = 'md',
		control = false,
		block = false,
		icon = false,
		chip = false,
		iconInline = false,
		hoverDanger = false,
		loading = false,
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
	data-tsu="Button"
	{...rest}
	{type}
	disabled={disabled || loading}
	aria-busy={loading || undefined}
	{title}
	class="btn {klass}"
	class:btn-primary={variant === 'primary'}
	class:btn-ghost={variant === 'ghost'}
	class:btn-danger={variant === 'danger'}
	class:btn-sm={size === 'sm'}
	class:btn-lg={size === 'lg'}
	class:btn-control={control}
	class:btn-block={block}
	class:btn-icon={icon}
	class:btn-chip={chip}
	class:btn-tone-accent={tone === 'accent'}
	class:btn-tone-info={tone === 'info'}
	class:btn-tone-warn={tone === 'warn'}
	class:btn-tone-danger={tone === 'danger'}
	class:btn-icon-inline={iconInline}
	class:hover-danger={hoverDanger}
	class:loading
	onclick={onclick}
>
	{#if loading}<span class="btn-spinner" aria-hidden="true"></span>{/if}
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
		min-height: var(--control-height-default);
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
		height: var(--control-height-compact);
		min-height: var(--control-height-compact);
		padding: var(--sp-1) var(--sp-3);
		font-size: var(--fs-xs);
	}
	.btn-lg {
		min-height: var(--control-height-large);
		padding: var(--sp-3) var(--sp-5);
		font-size: var(--fs-base);
	}
	.btn-block {
		width: 100%;
	}

	/* Semantic state tones — tint text + border, subtle fill on hover. Layered on
	   the neutral/ghost variant; each defines --btn-tone so one ruleset paints. */
	.btn-tone-accent {
		--btn-tone: var(--accent);
	}
	.btn-tone-info {
		--btn-tone: var(--info);
	}
	.btn-tone-warn {
		--btn-tone: var(--warn);
	}
	.btn-tone-danger {
		--btn-tone: var(--danger);
	}
	.btn-tone-accent,
	.btn-tone-info,
	.btn-tone-warn,
	.btn-tone-danger {
		color: var(--btn-tone);
		border-color: color-mix(in srgb, var(--btn-tone) 50%, var(--border));
	}
	.btn-tone-accent:hover:not(:disabled),
	.btn-tone-info:hover:not(:disabled),
	.btn-tone-warn:hover:not(:disabled),
	.btn-tone-danger:hover:not(:disabled) {
		background: color-mix(in srgb, var(--btn-tone) 14%, transparent);
		border-color: var(--btn-tone);
	}

	/* Icon-chip: larger square outlined tap target for header/toolbar actions.
	   Combines with a tone for tinted severity chips. */
	.btn-chip {
		min-height: 2.5rem;
		min-width: 2.5rem;
		height: 2.5rem;
		width: 2.5rem;
		padding: 0;
		border-radius: var(--r-md);
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

	/* Two-state (toggle) buttons — e.g. an IconButton with `pressed`. Reacts to
	   the native aria-pressed that flows through, so no extra class. Tint defaults
	   to the accent; override per-instance with `style="--btn-on: var(--warn)"`. */
	.btn[aria-pressed='true'] {
		color: var(--btn-on, var(--accent));
	}

	/* Loading: keep full opacity (it's busy, not disabled-looking) + a wait cursor,
	   and show a spinner in the current text color. */
	.btn.loading {
		cursor: wait;
	}
	.btn.loading:disabled {
		opacity: 1;
	}
	.btn-spinner {
		width: 0.9em;
		height: 0.9em;
		flex: none;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: btn-spin 0.6s linear infinite;
	}
	@keyframes btn-spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
