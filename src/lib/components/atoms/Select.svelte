<script lang="ts" module>
	import type { IconName } from '$lib/components/atoms/Icon.svelte';

	export type SelectOption = {
		value: string;
		label: string;
		icon?: IconName;
		emoji?: string;
		/** Muted, right-aligned secondary text (e.g. "62%"). */
		hint?: string;
		disabled?: boolean;
		/** Section heading this option belongs under. Options sharing a group are
		 *  emitted inside one `<optgroup label={group}>`, in first-seen group order.
		 *  Ungrouped options render at the top level. */
		group?: string;
	};
</script>

<script lang="ts">
	import type { ControlSize } from '$lib/size';
	// Native <select> primitive. Owns its styling from theme tokens; supports
	// `bind:value` and passes through every native attribute. Options are either
	// slotted children (full control over <option> rendering) or an `options`
	// array, which adds per-option icon/emoji/hint.
	//
	// A native <select> cannot render icons in its popup or trigger. With
	// `options`, the trigger text is drawn by a pointer-transparent face layer
	// (leading icon/emoji, label, muted right-aligned hint) laid over the native
	// control whose own text is made transparent, so keyboard, focus, form
	// submission and the platform popup stay native. The popup degrades
	// gracefully: emoji and hint are folded into the option text
	// (`🐼 personal · 62%`); an `icon` only shows in the trigger.
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
	import { getFieldContext, warnUnlabelled } from '$lib/field-context';
	import { sectionOptions } from '$lib/select-options';

	// `size` shadows the native option-count attribute (unused in token layouts) to
	// expose the sm|md height scale instead.
	type Props = Omit<HTMLSelectAttributes, 'size'> & {
		variant?: 'default' | 'ghost' | 'embedded';
		/** Error state: danger border + aria-invalid. */
		invalid?: boolean;
		/** @deprecated use `size="sm"`; `size` wins when both are set. */
		compact?: boolean;
		/** Size scale matching Button/SegmentedControl: `sm` also adopts the shared
		 *  `--control-height-compact` toolbar height so it lines up with siblings. */
		size?: ControlSize;
		/** Draw the custom chevron (default). Set false for a bare inline select. */
		chevron?: boolean;
		/** `auto` sizes to the selected option instead of filling the row. */
		width?: 'full' | 'auto';
		/** Fill the available width of a flex/Cluster row (flex: 1). */
		grow?: boolean;
		id?: string;
		'aria-describedby'?: string | null;
		'aria-invalid'?: HTMLSelectAttributes['aria-invalid'];
		class?: string;
		value?: HTMLSelectAttributes['value'];
		/** Rich option list; rendered instead of `children` when given. */
		options?: SelectOption[];
		children?: Snippet;
	};

	let {
		variant = 'default',
		invalid = false,
		compact = false,
		size,
		chevron,
		width = 'full',
		grow = false,
		id,
		'aria-describedby': ariaDescribedby,
		'aria-invalid': ariaInvalid,
		class: klass = '',
		value = $bindable(),
		options,
		children,
		...rest
	}: Props = $props();

	const field = getFieldContext();
	const isInvalid = $derived(invalid || !!field?.invalid);
	let el = $state<HTMLSelectElement | null>(null);

	$effect(() => warnUnlabelled(el, 'Select'));

	const small = $derived((size ?? (compact ? 'sm' : 'md')) === 'sm');
	const showChevron = $derived(chevron ?? variant !== 'embedded');
	const selected = $derived(options?.find((o) => o.value === value));
	const hasFace = $derived(!!options && variant !== 'ghost');

	const sections = $derived(sectionOptions(options ?? []));

	const optionText = (o: SelectOption) =>
		[o.emoji, o.label, o.hint && `· ${o.hint}`].filter(Boolean).join(' ');
</script>

{#snippet optionList()}
	{#if options}
		{#each sections as section, i (`${i}:${section.group ?? ''}`)}
			{#if section.group === undefined}
				{#each section.options as o (o.value)}
					<option value={o.value} disabled={o.disabled}>{optionText(o)}</option>
				{/each}
			{:else}
				<optgroup label={section.group}>
					{#each section.options as o (o.value)}
						<option value={o.value} disabled={o.disabled}>{optionText(o)}</option>
					{/each}
				</optgroup>
			{/if}
		{/each}
	{:else}
		{@render children?.()}
	{/if}
{/snippet}

{#if variant === 'ghost'}
	<select
		bind:this={el}
		class="select ghost {klass}"
		data-tsu="Select"
		bind:value
		{...rest}
		id={id ?? field?.id}
		aria-describedby={ariaDescribedby ?? field?.describedBy}
		aria-invalid={ariaInvalid ?? (isInvalid ? 'true' : undefined)}
	>
		{@render optionList()}
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
			bind:this={el}
			class="select"
			class:compact={small}
			class:select-lg={size === 'lg'}
			class:select-sm={size === 'sm'}
			class:w-auto={width === 'auto'}
			class:embedded={variant === 'embedded'}
			class:has-face={hasFace}
			bind:value
			{...rest}
			id={id ?? field?.id}
			aria-describedby={ariaDescribedby ?? field?.describedBy}
			aria-invalid={ariaInvalid ?? (isInvalid ? 'true' : undefined)}
		>
			{@render optionList()}
		</select>
		{#if hasFace}
			<span class="select-face" class:compact={small} aria-hidden="true">
				{#if selected?.icon}
					<Icon name={selected.icon} />
				{:else if selected?.emoji}
					<span class="select-emoji">{selected.emoji}</span>
				{/if}
				<span class="select-label">{selected?.label ?? ''}</span>
				{#if selected?.hint}
					<span class="select-hint">{selected.hint}</span>
				{/if}
			</span>
		{/if}
		{#if showChevron}
			<span class="select-chevron" aria-hidden="true">
				<Icon name="chevron-down" />
			</span>
		{/if}
	</div>
{/if}

<style>
	.select-wrap {
		--select-icon: var(--control-icon-md);
		position: relative;
		display: block;
		width: 100%;
	}
	.select-wrap.w-auto {
		display: inline-block;
		width: auto;
		max-width: 100%;
	}
	.select-wrap.select-grow {
		flex: 1 1 0;
		min-width: 0;
	}
	.select-wrap:has(.select.compact) {
		--select-icon: var(--control-icon-sm);
	}
	.select-wrap:has(.select.select-lg) {
		--select-icon: var(--control-icon-lg);
	}
	.select {
		width: 100%;
		min-height: var(--select-size, var(--control-height-default));
		padding: var(--sp-2) var(--control-px-md);
		font-size: var(--control-fs-md);
		line-height: var(--lh-tight);
		background: var(--select-bg, var(--control-fill));
		border: var(--edge-width) solid var(--select-border, var(--control-edge));
		border-radius: var(--select-radius, var(--r-md));
		box-shadow: var(--control-shadow);
		color: var(--select-fg, var(--text));
		transition: border-color var(--dur-fast) ease;
	}
	/* Default variant: drop the OS chevron, reserve room for our own. */
	.select-wrap .select {
		appearance: none;
		-webkit-appearance: none;
		padding-right: calc(var(--control-px-md) + var(--select-icon) + var(--sp-1));
	}
	/* No custom chevron: reclaim the reserved right padding. */
	.select-wrap.no-chevron .select {
		padding-right: var(--control-px-md);
	}
	.select.select-lg {
		min-height: var(--select-size, var(--control-height-large));
		padding: var(--sp-3) var(--control-px-lg);
		font-size: var(--control-fs-lg);
	}
	/* Compact inline form for dense headers/toolbars. */
	.select.compact {
		padding: var(--sp-1) var(--control-px-sm);
		font-size: var(--control-fs-sm);
	}
	.select-wrap:not(.no-chevron) .select.compact {
		padding-right: calc(var(--control-px-sm) + var(--select-icon) + var(--sp-1));
	}
	/* Toolbar contract: size="sm" shares the compact control height so it lines up
	   with Button size="sm", Popover size="sm" and SegmentedControl size="sm". */
	.select.select-sm {
		height: var(--select-size, var(--control-height-compact));
		min-height: var(--select-size, var(--control-height-compact));
	}
	.select.w-auto {
		width: auto;
		max-width: 100%;
		text-overflow: ellipsis;
	}
	.select.embedded {
		background: var(--select-bg, var(--bg-elevated-2));
		border: none;
		border-radius: var(--select-radius, var(--r-sm));
		box-shadow: none;
	}
	.select:focus {
		outline: none;
		border-color: var(--accent);
	}
	.select:focus-visible:not(.embedded, .ghost) {
		box-shadow: var(--control-shadow), var(--focus-glow);
	}
	.select:focus-visible {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
	}
	.select[aria-invalid='true'],
	.select[aria-invalid='true']:focus {
		border-color: var(--danger);
	}
	.select {
		--focus-tint: var(--accent);
	}
	.select[aria-invalid='true'] {
		--focus-tint: var(--danger);
	}
	/* Focus bloom: a solid ring whose soft halo swells, then settles to a quieter glow. */
	.select:not(.ghost, .embedded):focus:not(:global([data-fx-focus='none']) *),
	:global(:is([data-fx-focus='bloom'], [data-fx-focus='label'])) .select:not(.ghost, .embedded):focus:not(:global(:is([data-fx-focus='bloom'], [data-fx-focus='label']) [data-fx-focus='none']) *) {
		outline: none;
		box-shadow:
			var(--control-shadow),
			0 0 0 var(--focus-ring-width) var(--focus-tint),
			0 0 16px 2px color-mix(in srgb, var(--focus-tint) 24%, transparent);
		animation: focus-bloom var(--dur-fast) var(--ease-out);
	}
	@keyframes focus-bloom {
		0% {
			box-shadow:
				var(--control-shadow),
				0 0 0 0 transparent,
				0 0 0 0 transparent;
		}
		45% {
			box-shadow:
				var(--control-shadow),
				0 0 0 calc(var(--focus-ring-width) + 1px) var(--focus-tint),
				0 0 20px 4px color-mix(in srgb, var(--focus-tint) 32%, transparent);
		}
	}
	.select:disabled {
		cursor: not-allowed;
	}
	/* The wrap dims as one so the face and the chevron fade with the control. */
	.select-wrap:has(.select:disabled) {
		opacity: var(--disabled-opacity);
	}
	/* The face draws the trigger text; the native text underneath stays laid out
	   (so `width="auto"` still sizes to it) but invisible. Popup options keep
	   their own colour so the transparency does not inherit into the list. */
	.select.has-face {
		color: transparent;
	}
	.select.has-face option,
	.select.has-face optgroup {
		color: var(--text);
		background: var(--bg);
	}
	.select-face {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		padding: 0 var(--control-px-md);
		padding-right: calc(var(--control-px-md) + var(--select-icon) + var(--sp-1));
		font-size: var(--control-fs-md);
		color: var(--select-fg, var(--text));
		pointer-events: none;
		overflow: hidden;
	}
	.select-face > :global(svg) {
		flex: none;
		font-size: var(--select-icon);
	}
	.select-wrap.no-chevron .select-face {
		padding-right: var(--control-px-md);
	}
	.select-face.compact {
		padding: 0 var(--control-px-sm);
		padding-right: calc(var(--control-px-sm) + var(--select-icon) + var(--sp-1));
		font-size: var(--control-fs-sm);
	}
	.select-wrap.no-chevron .select-face.compact {
		padding-right: var(--control-px-sm);
	}
	/* iOS auto-zooms any field under 16px on focus; on touch the size modifiers
	   carry their difference through padding and height alone. */
	@media (pointer: coarse) {
		.select,
		.select-face {
			font-size: max(16px, var(--control-fs-md));
		}
		.select.select-lg {
			font-size: max(16px, var(--control-fs-lg));
		}
		.select.compact,
		.select-face.compact {
			font-size: max(16px, var(--control-fs-sm));
		}
	}
	.select-emoji {
		line-height: var(--lh-none);
	}
	.select-label {
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.select-hint {
		flex: none;
		margin-left: auto;
		color: var(--text-muted);
		font-size: var(--fs-xs);
		font-variant-numeric: tabular-nums;
	}
	.select-chevron {
		position: absolute;
		top: 50%;
		right: var(--control-px-md);
		transform: translateY(-50%);
		display: inline-flex;
		font-size: var(--select-icon);
		color: var(--text-muted);
		pointer-events: none; /* clicks fall through to the select */
	}
	.select-wrap:has(.select.compact) .select-chevron {
		right: var(--control-px-sm);
	}
	@media (hover: hover) and (pointer: fine) {
		.select:hover:not(:disabled, :focus, [aria-invalid='true'], .ghost, .embedded) {
			border-color: var(--control-edge-hover);
		}
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
		box-shadow: none;
		cursor: pointer;
	}
</style>
