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
	};
</script>

<script lang="ts">
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
		size = 'md',
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

	const small = $derived(compact || size === 'sm');
	const showChevron = $derived(chevron ?? variant !== 'embedded');
	const selected = $derived(options?.find((o) => o.value === value));
	const hasFace = $derived(!!options && variant !== 'ghost');

	const optionText = (o: SelectOption) =>
		[o.emoji, o.label, o.hint && `· ${o.hint}`].filter(Boolean).join(' ');
</script>

{#snippet optionList()}
	{#if options}
		{#each options as o (o.value)}
			<option value={o.value} disabled={o.disabled}>{optionText(o)}</option>
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
					<Icon name={selected.icon} size={small ? 14 : 16} />
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
		min-height: var(--control-height-default);
		padding: var(--sp-2) var(--sp-3);
		line-height: var(--lh-tight);
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
	/* The face draws the trigger text; the native text underneath stays laid out
	   (so `width="auto"` still sizes to it) but invisible. Popup options keep
	   their own colour so the transparency does not inherit into the list. */
	.select.has-face {
		color: transparent;
	}
	.select.has-face option {
		color: var(--text);
		background: var(--bg);
	}
	.select-face {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		padding: 0 var(--sp-3);
		padding-right: calc(var(--sp-3) + 1.25rem);
		color: var(--text);
		pointer-events: none;
		overflow: hidden;
	}
	.select-wrap.no-chevron .select-face {
		padding-right: var(--sp-3);
	}
	.select-face.compact {
		padding: 0 var(--sp-2);
		padding-right: calc(var(--sp-2) + 1rem);
		font-size: var(--fs-xs);
	}
	.select-wrap.no-chevron .select-face.compact {
		padding-right: var(--sp-2);
	}
	.select:disabled ~ .select-face {
		color: var(--text-muted);
	}
	.select-emoji {
		line-height: 1;
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
