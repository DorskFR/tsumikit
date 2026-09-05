<script lang="ts" module>
	export interface MenuItem {
		label: string;
		onselect: () => void;
		icon?: import('$lib/components/atoms/Icon.svelte').IconName;
		danger?: boolean;
		disabled?: boolean;
		/** Free-form trailing pill ("admin", "pro", "beta"…), rendered as a Badge after the label. */
		tag?: string;
		tagTone?: import('svelte').ComponentProps<typeof import('$lib/components/atoms/Badge.svelte').default>['tone'];
	}
</script>

<script lang="ts">
	// Dropdown menu: a Popover whose panel carries the WAI-ARIA `menu` role. Items are
	// `menuitem`s navigable with ↑/↓/Home/End, activated with Enter/Space (and
	// click). Selecting an item runs its action and closes the menu. Focus moves
	// to the first item when the menu opens. Escape / click-outside close it
	// (inherited from the native popover). An item's `tag` renders as a soft
	// Badge pill after the label; the `tag` snippet replaces that pill.
	import type { ComponentProps, Snippet } from 'svelte';
	import Popover from '$lib/components/molecules/Popover.svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';

	type PopoverProps = ComponentProps<typeof Popover>;
	type TriggerChrome = Pick<
		PopoverProps,
		| 'variant'
		| 'tone'
		| 'size'
		| 'box'
		| 'control'
		| 'block'
		| 'triggerClass'
		| 'bare'
		| 'hitArea'
		| 'disabled'
		| 'gap'
		| 'onopen'
		| 'onclose'
	>;

	let {
		label,
		items,
		trigger,
		tag,
		placement = 'bottom-start',
		variant,
		tone,
		size,
		box,
		control,
		block,
		triggerClass,
		bare,
		hitArea,
		disabled,
		gap,
		onopen,
		onclose,
		class: klass = '',
		style: styleProp = '',
		panelClass = '',
	}: {
		label: string;
		items: MenuItem[];
		trigger: Snippet;
		/** Custom trailing content for items that carry a `tag`. */
		tag?: Snippet<[MenuItem]>;
		placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
		class?: string;
		style?: string;
		panelClass?: string;
	} & TriggerChrome = $props();

	let listEl = $state<HTMLDivElement | null>(null);

	function buttons(): HTMLButtonElement[] {
		return listEl
			? Array.from(listEl.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)'))
			: [];
	}
	function focusAt(i: number) {
		const b = buttons();
		if (b.length) b[(i + b.length) % b.length].focus();
	}
	function onkeydown(e: KeyboardEvent) {
		const b = buttons();
		const i = b.indexOf(document.activeElement as HTMLButtonElement);
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			focusAt(i + 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			focusAt(i - 1);
		} else if (e.key === 'Home') {
			e.preventDefault();
			focusAt(0);
		} else if (e.key === 'End') {
			e.preventDefault();
			focusAt(b.length - 1);
		}
	}
	function select(item: MenuItem) {
		if (item.disabled) return;
		// Close the popover, then run the action.
		listEl?.closest<HTMLElement>('[popover]')?.hidePopover();
		item.onselect();
	}
</script>

<Popover
	{label}
	{placement}
	{trigger}
	{variant}
	{tone}
	{size}
	{box}
	{control}
	{block}
	{triggerClass}
	class={klass}
	style={styleProp}
	{panelClass}
	{bare}
	{hitArea}
	{disabled}
	{gap}
	role="menu"
	haspopup="menu"
	{onclose}
	onopen={() => {
		queueMicrotask(() => focusAt(0));
		onopen?.();
	}}
>
	<div bind:this={listEl} role="none" class="menu" data-tsu="Menu" tabindex="-1" {onkeydown}>
		{#each items as item (item.label)}
			<button
				type="button"
				role="menuitem"
				class="menu-item"
				class:danger={item.danger}
				disabled={item.disabled}
				tabindex="-1"
				onclick={() => select(item)}
			>
				{#if item.icon}<Icon name={item.icon} />{/if}
				<span>{item.label}</span>
				{#if item.tag !== undefined}
					{#if tag}
						{@render tag(item)}
					{:else}
						<span class="menu-tag">
							<Badge size="xs" tone={item.tagTone ?? 'neutral'} border={false}>{item.tag}</Badge>
						</span>
					{/if}
				{/if}
			</button>
		{/each}
	</div>
</Popover>

<style>
	.menu {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.menu-item {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		width: 100%;
		text-align: left;
		padding: var(--sp-2) var(--sp-3);
		border: none;
		background: none;
		color: var(--text);
		border-radius: var(--r-sm);
		font-size: var(--fs-sm);
		white-space: nowrap;
	}
	.menu-item:hover:not(:disabled),
	.menu-item:focus-visible {
		background: var(--bg-elevated-2);
		outline: none;
	}
	.menu-item.danger {
		color: var(--danger);
	}
	.menu-tag {
		display: inline-flex;
		flex: none;
		margin-inline-start: auto;
		padding-inline-start: var(--sp-3);
	}
	.menu-item:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
</style>
