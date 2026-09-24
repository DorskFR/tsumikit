<script lang="ts">
	// One control, two segments: a primary action and a narrow caret that opens
	// a Menu. Both segments keep their own hover/active/focus, and the caret
	// carries the popup semantics. The segments are the stock Button and Menu
	// triggers, joined through their published `--btn-*` / `--pop-trigger-*`
	// properties so the fused look needs no reach into their scoped CSS.
	import type { ControlSize } from '$lib/size';
	import type { ComponentProps, Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Button from '$lib/components/atoms/Button.svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import Menu, { type MenuItem } from '$lib/components/molecules/Menu.svelte';

	type MenuProps = ComponentProps<typeof Menu>;

	type Own = {
		variant?: 'default' | 'primary' | 'danger';
		size?: ControlSize;
		/** Use the shared `--control-height` toolbar/composer contract. */
		control?: boolean;
		/** Disables both segments. */
		disabled?: boolean;
		/** Disables the caret only; the primary action keeps working. */
		menuDisabled?: boolean;
		/** Accessible name of the caret ("More send options"). */
		label: string;
		items: MenuItem[];
		placement?: MenuProps['placement'];
		/** Custom trailing content for items that carry a `tag`. */
		tag?: MenuProps['tag'];
		panelClass?: string;
		gap?: number;
		/** Bindable open state of the menu. */
		open?: boolean;
		onopen?: () => void;
		onclose?: () => void;
		/** `type` of the primary action, for a submit inside a form. */
		type?: 'button' | 'submit';
		/** Busy primary action: spinner, blocks clicks, `aria-busy`. */
		loading?: boolean;
		/** Handler of the primary action. */
		onclick?: (e: MouseEvent) => void;
		class?: string;
		style?: string;
		/** Content of the primary action. */
		children: Snippet;
	};

	let {
		variant = 'default',
		size = 'md',
		control = false,
		disabled = false,
		menuDisabled = false,
		label,
		items,
		placement = 'bottom-end',
		tag,
		panelClass,
		gap,
		open = $bindable(false),
		onopen,
		onclose,
		type = 'button',
		loading = false,
		onclick,
		class: klass = '',
		style: styleProp = '',
		children,
		...rest
	}: Omit<HTMLAttributes<HTMLDivElement>, keyof Own> & Own = $props();

	const HEIGHT: Record<ControlSize, string> = {
		sm: 'var(--control-height-compact)',
		md: 'var(--control-height-default)',
		lg: 'var(--control-height-large)',
	};
	const height = $derived(control ? 'var(--control-height)' : HEIGHT[size]);
	const caretDisabled = $derived(disabled || menuDisabled);

	function onPrimaryKeydown(e: KeyboardEvent) {
		if (e.key !== 'ArrowDown' || caretDisabled) return;
		e.preventDefault();
		open = true;
	}
</script>

<div
	{...rest}
	data-tsu="SplitButton"
	class="split {klass}"
	class:split-primary={variant === 'primary'}
	style={styleProp}
	style:--split-height={height}
>
	<span class="split-main">
		<Button
			{variant}
			{size}
			{control}
			{type}
			{loading}
			{disabled}
			block
			{onclick}
			onkeydown={onPrimaryKeydown}
		>
			{@render children()}
		</Button>
	</span>
	<span class="split-caret">
		<Menu
			{label}
			{items}
			{placement}
			{tag}
			{panelClass}
			{gap}
			{variant}
			{size}
			{control}
			block
			disabled={caretDisabled}
			bind:open
			{onopen}
			{onclose}
		>
			{#snippet trigger()}<Icon name="chevron-down" size={size === 'sm' ? 14 : 16} />{/snippet}
		</Menu>
	</span>
</div>

<style>
	.split {
		display: inline-flex;
		align-items: stretch;
		vertical-align: middle;
	}
	.split-main {
		display: flex;
		position: relative;
		--btn-radius: var(--r-md) 0 0 var(--r-md);
	}
	/* The caret is as wide as the control is tall; its border overlaps the
	   primary's so the two 1px lines read as one divider. */
	.split-caret {
		display: flex;
		position: relative;
		width: var(--split-height);
		flex: none;
		margin-inline-start: -1px;
		--pop-trigger-radius: 0 var(--r-md) var(--r-md) 0;
		--pop-trigger-pad: 0;
	}
	/* The hovered or focused segment paints above its neighbour, so its
	   accent border and focus ring are not cut by the overlap. */
	.split-main:hover,
	.split-main:focus-within,
	.split-caret:hover,
	.split-caret:focus-within {
		z-index: 1;
	}
	/* On a filled primary the borders match the fill; paint the divider in the
	   on-accent foreground instead. */
	.split-primary .split-caret::before {
		content: '';
		position: absolute;
		inset-block: 0;
		inset-inline-start: 0;
		width: 1px;
		background: color-mix(in srgb, var(--text-on-accent) 35%, transparent);
		pointer-events: none;
		z-index: 2;
	}
</style>
