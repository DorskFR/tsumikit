<script lang="ts">
	import type { ControlSize } from '$lib/size';
	// Text input primitive. Owns its styling from theme tokens; supports
	// `bind:value` and passes through every native <input> attribute. `mono`
	// switches to the monospace family (paths, tokens, env values). A wrapper is
	// rendered only when `icon` / `clearable` are used, so the bare <input> DOM
	// stays as-is otherwise.
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Icon, { type IconName } from '$lib/components/atoms/Icon.svelte';
	import { getFieldContext, warnUnlabelled } from '$lib/field-context';
	import { getInputGroupContext } from '$lib/input-group-context';

	// `size` shadows the native char-width attribute (unused in token-sized
	// layouts) to expose a height preset instead.
	type Props = Omit<HTMLInputAttributes, 'size'> & {
		mono?: boolean;
		size?: ControlSize;
		/** Fill the available width of a flex/Cluster row (flex: 1) instead of
		 *  needing a raw `style="flex:1"` at the call-site. */
		grow?: boolean;
		/** Error state: danger border + aria-invalid (also styles if a consumer
		 *  sets aria-invalid directly). */
		invalid?: boolean;
		/** Leading icon, inset inside the control. */
		icon?: IconName;
		/** Trailing clear (✕) button shown while the value is non-empty. */
		clearable?: boolean;
		onclear?: () => void;
		clearLabel?: string;
		shape?: 'square' | 'pill';
		/** Fixed width (also `flex: none` so flex rows don't stretch it). */
		width?: string;
		/** Fires with the current value on Enter. */
		onenter?: (value: string) => void;
		/** Alias of `onenter`; both fire when given. */
		onsubmit?: (value: string) => void;
		id?: string;
		'aria-describedby'?: string | null;
		'aria-invalid'?: HTMLInputAttributes['aria-invalid'];
		class?: string;
		value?: HTMLInputAttributes['value'];
		el?: HTMLInputElement | null;
	};

	let {
		mono = false,
		size,
		grow = false,
		invalid = false,
		disabled = false,
		icon,
		clearable = false,
		onclear,
		clearLabel = 'Clear',
		shape = 'square',
		width,
		onenter,
		onsubmit,
		onkeydown,
		id,
		'aria-describedby': ariaDescribedby,
		'aria-invalid': ariaInvalid,
		class: klass = '',
		value = $bindable(),
		el = $bindable(null),
		...rest
	}: Props = $props();

	const field = getFieldContext();
	const group = getInputGroupContext();
	const sizeEff = $derived(size ?? group?.size ?? 'md');
	const isInvalid = $derived(invalid || !!field?.invalid || !!group?.invalid);
	const isDisabled = $derived(disabled || !!group?.disabled);

	$effect(() => warnUnlabelled(el, 'Input'));

	const wrapped = $derived(!!icon || clearable);

	function handleKeydown(e: KeyboardEvent & { currentTarget: EventTarget & HTMLInputElement }) {
		onkeydown?.(e);
		if (onenter && e.key === 'Enter' && !e.defaultPrevented) onenter(String(value ?? ''));
		if (onsubmit && e.key === 'Enter' && !e.defaultPrevented) onsubmit(String(value ?? ''));
	}

	function clear() {
		value = '';
		onclear?.();
		el?.focus();
	}
</script>

{#snippet control()}
	<input
		bind:this={el}
		data-tsu="Input"
		class="input {klass}"
		class:mono
		class:input-sm={sizeEff === 'sm'}
		class:input-lg={sizeEff === 'lg'}
		class:grouped={!!group}
		class:input-grow={grow}
		class:input-fixed={!!width && !wrapped}
		class:input-pill={shape === 'pill'}
		class:has-icon={!!icon}
		class:has-clear={clearable}
		style:width={wrapped ? undefined : width}
		bind:value
		{...rest}
		disabled={isDisabled}
		onkeydown={onenter || onsubmit || onkeydown ? handleKeydown : undefined}
		id={id ?? field?.id}
		aria-describedby={ariaDescribedby ?? field?.describedBy}
		aria-invalid={ariaInvalid ?? (isInvalid ? 'true' : undefined)}
	/>
{/snippet}

{#if wrapped}
	<div
		class="input-wrap"
		data-part="wrap"
		class:input-grow={grow}
		class:input-fixed={!!width}
		style:width
	>
		{#if icon}<span class="input-icon"><Icon name={icon} /></span>{/if}
		{@render control()}
		{#if clearable && value}
			<button type="button" class="input-clear" aria-label={clearLabel} onclick={clear}>
				<Icon name="x" />
			</button>
		{/if}
	</div>
{:else}
	{@render control()}
{/if}

<style>
	.input {
		width: 100%;
		min-height: var(--input-size, var(--control-height-default));
		padding: var(--sp-2) var(--sp-3);
		line-height: var(--lh-tight);
		background: var(--input-bg, var(--bg));
		border: 1px solid var(--input-border, var(--border-strong));
		border-radius: var(--input-radius, var(--r-md));
		color: var(--input-fg, var(--text));
		transition: border-color 0.12s var(--ease);
	}
	.input:focus {
		outline: none;
		border-color: var(--accent);
	}
	.input:focus-visible {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
	}
	.input-sm {
		min-height: var(--input-size, var(--control-height-compact));
		padding: var(--sp-1) var(--sp-2);
		font-size: var(--fs-sm);
	}
	.input-lg {
		min-height: var(--input-size, var(--control-height-large));
		padding: var(--sp-3) var(--sp-4);
		font-size: max(16px, var(--fs-md));
	}
	/* iOS auto-zooms any field under 16px on focus; on touch the size modifiers
	   carry their difference through padding and height alone. */
	@media (pointer: coarse) {
		.input-sm {
			font-size: max(16px, var(--fs-sm));
		}
	}
	.input-grow {
		flex: 1 1 0;
		width: auto;
		min-width: 0;
	}
	.input-fixed {
		flex: none;
	}
	.input-pill {
		border-radius: var(--input-radius, var(--r-pill));
		padding-inline: var(--sp-4);
	}
	.input[aria-invalid='true'] {
		border-color: var(--danger);
	}
	.input[aria-invalid='true']:focus {
		border-color: var(--danger);
	}
	/* Inside an InputGroup the group draws the focus ring and the overlaid
	   adornments report their widths; the text stays clear of them. */
	.input.grouped {
		width: 100%;
		border-radius: var(--ig-radius);
		padding-inline: max(var(--ig-pad-x), var(--ig-leading-w, 0px) + var(--ig-gap))
			max(var(--ig-pad-x), var(--ig-trailing-w, 0px) + var(--ig-gap));
	}
	.input.grouped:focus-visible {
		outline: none;
	}
	.mono {
		font-family: var(--font-mono);
	}

	.input-wrap {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
	}
	.input-wrap .input {
		width: 100%;
	}
	.has-icon {
		padding-inline-start: calc(var(--sp-3) + 1em + var(--sp-2));
	}
	.has-clear {
		padding-inline-end: calc(var(--sp-3) + 1em + var(--sp-2));
	}
	.input-icon,
	.input-clear {
		position: absolute;
		top: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		color: var(--text-faint);
		pointer-events: none;
	}
	.input-icon {
		left: var(--sp-3);
	}
	.input-clear {
		right: var(--sp-2);
		pointer-events: auto;
		border: 0;
		background: transparent;
		padding: 0 var(--sp-1);
		cursor: pointer;
		border-radius: var(--r-sm);
	}
	.input-clear:hover,
	.input-clear:focus-visible {
		color: var(--text);
	}
</style>
