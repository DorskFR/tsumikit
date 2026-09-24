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
		/**
		 * Two-state item: rendered as `menuitemcheckbox` with `aria-checked`. Its icon stays in
		 * the leading column and the check glyph moves to the trailing edge; without an icon
		 * the check glyph takes the leading column.
		 */
		pressed?: boolean;
		/** Selecting this item leaves the menu open (overrides the menu's `closeOnSelect`). */
		keepOpen?: boolean;
		/** Custom row content (a rename Input, a slider…) replacing icon/label/tag. */
		content?: import('svelte').Snippet<[MenuItem]>;
		/**
		 * Extra attributes for the rendered row — `data-*`, `title`, `aria-describedby`…
		 * The row's own semantics (`role`, `aria-checked`, `disabled`, `class`, `onclick`)
		 * are applied after and win.
		 */
		attrs?: import('svelte/elements').HTMLButtonAttributes;
	}
</script>

<script lang="ts">
	// Dropdown menu: a Popover whose panel carries the WAI-ARIA `menu` role. Items are
	// `menuitem`s navigable with ↑/↓/Home/End, activated with Enter/Space (and
	// click). Selecting an item runs its action and closes the menu unless the menu
	// sets `closeOnSelect={false}` or the item sets `keepOpen`. Focus moves
	// to the first item when the menu opens. Escape / click-outside close it
	// (inherited from the native popover). An item's `tag` renders as a soft
	// Badge pill after the label; the `tag` snippet replaces that pill.
	import type { ComponentProps, Snippet } from 'svelte';
	import Popover from '$lib/components/molecules/Popover.svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import { menuItemCloses, menuItemGlyphs } from '$lib/components/molecules/menu-item';

	type PopoverProps = ComponentProps<typeof Popover>;
	type TriggerChrome = Pick<
		PopoverProps,
		| 'variant'
		| 'tone'
		| 'size'
		| 'box'
		| 'pill'
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
		pill,
		control,
		block,
		triggerClass,
		bare,
		hitArea,
		disabled,
		gap,
		onopen,
		onclose,
		open = $bindable(false),
		closeOnSelect = true,
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
		/** Bindable open state; set it to open/close programmatically. */
		open?: boolean;
		/** Close the menu after an item is selected; a per-item `keepOpen` wins over it. */
		closeOnSelect?: boolean;
		class?: string;
		style?: string;
		panelClass?: string;
	} & TriggerChrome = $props();

	let listEl = $state<HTMLDivElement | null>(null);

	$effect(() => {
		const pop = listEl?.closest<HTMLElement>('[popover]');
		if (!pop) return;
		const isOpen = pop.matches(':popover-open');
		try {
			if (open && !isOpen) pop.showPopover();
			else if (!open && isOpen) pop.hidePopover();
		} catch {}
	});

	function buttons(): HTMLButtonElement[] {
		return listEl
			? Array.from(listEl.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled), [role="menuitemcheckbox"]:not(:disabled)'))
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
	function select(item: MenuItem, close: () => void) {
		if (item.disabled) return;
		if (menuItemCloses(item, closeOnSelect)) close();
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
	{pill}
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
	onclose={() => {
		open = false;
		onclose?.();
	}}
	onopen={() => {
		open = true;
		queueMicrotask(() => focusAt(0));
		onopen?.();
	}}
>
	{#snippet children({ close }: { close: () => void })}
	<div bind:this={listEl} role="none" class="menu" data-tsu="Menu" tabindex="-1" {onkeydown}>
		{#each items as item (item.label)}
			<button
				type="button"
				{...item.attrs}
				role={item.pressed === undefined ? 'menuitem' : 'menuitemcheckbox'}
				aria-checked={item.pressed === undefined ? undefined : item.pressed}
				class="menu-item"
				class:danger={item.danger}
				class:on={item.pressed}
				disabled={item.disabled}
				tabindex="-1"
				onclick={() => select(item, close)}
			>
				{#if item.content}
					{@render item.content(item)}
				{:else}
				{@const glyphs = menuItemGlyphs(item)}
				{#if glyphs.leading === 'check'}<span class="menu-check"><Icon name="check" /></span>{:else if glyphs.leading === 'icon' && item.icon}<Icon name={item.icon} />{/if}
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
				{#if glyphs.trailingCheck}<span class="menu-check menu-check-trailing"><Icon name="check" /></span>{/if}
				{/if}
			</button>
		{/each}
	</div>
	{/snippet}
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
	.menu-check {
		display: inline-flex;
		width: 1em;
		visibility: hidden;
	}
	.menu-item.on .menu-check {
		visibility: visible;
		color: var(--accent);
	}
	.menu-check-trailing {
		flex: none;
		margin-inline-start: auto;
		padding-inline-start: var(--sp-3);
	}
	.menu-tag {
		display: inline-flex;
		flex: none;
		margin-inline-start: auto;
		padding-inline-start: var(--sp-3);
	}
	.menu-tag + .menu-check-trailing {
		margin-inline-start: 0;
		padding-inline-start: 0;
	}
	.menu-item:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
</style>
