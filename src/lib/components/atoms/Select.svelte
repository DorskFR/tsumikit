<script lang="ts">
	// Native <select> primitive. Owns its styling from theme tokens; supports
	// `bind:value` and passes through every native attribute. Options are slotted
	// children so call-sites keep full control over <option> rendering.
	//
	// The default variant hides the OS chevron (appearance: none) and draws its
	// own, so the control looks identical across platforms and the chevron sits
	// at a consistent, token-defined offset that adapts to the theme.
	//
	// `variant="ghost"` makes the control fill its (positioned) parent fully
	// transparently — for the "native select overlaid on a custom trigger" pattern
	// (SelectButton): the platform popup with no custom outside-click logic, while
	// a styled trigger shows through underneath.
	//
	// `variant="embedded"` is a borderless, elevated-surface select for inline
	// use inside cards/toolbars; it hides the chevron unless asked for explicitly.
	import type { Snippet } from 'svelte';
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import Icon from '$lib/components/atoms/Icon.svelte';

	// `size` shadows the native option-count attribute (unused in token layouts) to
	// expose the sm|md height scale instead.
	type Props = Omit<HTMLSelectAttributes, 'size'> & {
		variant?: 'default' | 'ghost' | 'embedded';
		/** Error state: danger border + aria-invalid. */
		invalid?: boolean;
		/** Compact inline form: smaller padding + font for dense toolbars/headers.
		 *  Deprecated alias for `size="sm"` (kept for backward compatibility). */
		compact?: boolean;
		/** Size scale matching Button/SegmentedControl: `sm` also adopts the shared
		 *  `--control-height-compact` toolbar height so it lines up with siblings. */
		size?: 'sm' | 'md';
		/** Draw the custom chevron (default). Set false for a bare inline select. */
		chevron?: boolean;
		/** `auto` sizes to the selected option instead of filling the row. */
		width?: 'full' | 'auto';
		/** Fill the available width of a flex/Cluster row (flex: 1). */
		grow?: boolean;
		class?: string;
		value?: HTMLSelectAttributes['value'];
		children?: Snippet;
	};

	let {
		variant = 'default',
		invalid = false,
		compact = false,
		size = 'md',
		chevron,
		width = 'full',
		grow = false,
		class: klass = '',
		value = $bindable(),
		children,
		...rest
	}: Props = $props();

	const small = $derived(compact || size === 'sm');
	const showChevron = $derived(chevron ?? variant !== 'embedded');
</script>

{#if variant === 'ghost'}
	<select class="select ghost {klass}" data-tsu="Select" bind:value {...rest} aria-invalid={invalid || undefined}>
		{@render children?.()}
	</select>
{:else}
	<div
		class="select-wrap {klass}"
		class:no-chevron={!showChevron}
		class:w-auto={width === 'auto'}
		class:select-grow={grow}
		data-tsu="Select"
	>
		<select
			class="select"
			class:compact={small}
			class:select-sm={size === 'sm'}
			class:w-auto={width === 'auto'}
			class:embedded={variant === 'embedded'}
			bind:value
			{...rest}
			aria-invalid={invalid || undefined}
		>
			{@render children?.()}
		</select>
		{#if showChevron}
			<span class="select-chevron" aria-hidden="true">
				<Icon name="chevron-down" size={16} />
			</span>
		{/if}
	</div>
{/if}

<style>
	.select-wrap {
		position: relative;
		display: block;
		width: 100%;
	}
	.select-wrap.w-auto {
		display: inline-block;
		width: auto;
	}
	.select-wrap.select-grow {
		flex: 1 1 0;
		min-width: 0;
	}
	.select {
		width: 100%;
		padding: var(--sp-3);
		background: var(--bg);
		border: 1px solid var(--border-strong);
		border-radius: var(--r-md);
		color: var(--text);
		transition: border-color 0.12s var(--ease);
	}
	/* Default variant: drop the OS chevron, reserve room for our own. */
	.select-wrap .select {
		appearance: none;
		-webkit-appearance: none;
		padding-right: calc(var(--sp-3) + 1.25rem);
	}
	/* No custom chevron: reclaim the reserved right padding. */
	.select-wrap.no-chevron .select {
		padding-right: var(--sp-3);
	}
	/* Compact inline form for dense headers/toolbars. */
	.select.compact {
		padding: var(--sp-1) var(--sp-2);
		font-size: var(--fs-xs);
	}
	.select-wrap:not(.no-chevron) .select.compact {
		padding-right: calc(var(--sp-2) + 1rem);
	}
	/* Toolbar contract: size="sm" shares the compact control height so it lines up
	   with Button size="sm", Popover size="sm" and SegmentedControl size="sm". */
	.select.select-sm {
		height: var(--control-height-compact);
	}
	.select.w-auto {
		width: auto;
	}
	.select.embedded {
		background: var(--bg-elevated-2);
		border: none;
		border-radius: var(--r-sm);
	}
	.select:focus {
		outline: none;
		border-color: var(--accent);
	}
	.select[aria-invalid='true'],
	.select[aria-invalid='true']:focus {
		border-color: var(--danger);
	}
	.select-chevron {
		position: absolute;
		top: 50%;
		right: var(--sp-3);
		transform: translateY(-50%);
		display: inline-flex;
		color: var(--text-muted);
		pointer-events: none; /* clicks fall through to the select */
	}
	/* Transparent overlay: fills the positioned parent, the trigger shows through. */
	.select.ghost {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		padding: 0;
		opacity: 0;
		border: none;
		background: none;
		cursor: pointer;
	}
</style>
