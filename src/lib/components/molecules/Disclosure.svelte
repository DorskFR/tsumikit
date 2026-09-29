<script lang="ts" module>
	export type DisclosureChevron = 'start' | 'end' | false;
	export type DisclosureSize = 'default' | 'compact';
	export interface DisclosureHeaderContext {
		open: boolean;
	}
</script>

<script lang="ts">
	// Single collapsible: a native <button aria-expanded aria-controls> (so Enter
	// and Space activate it without a keydown handler) toggling a region panel.
	// `open` is bindable; an unbound `open` plus `onchange` gives controlled mode.
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Icon from '$lib/components/atoms/Icon.svelte';

	let {
		open = $bindable(false),
		header,
		children,
		chevron = 'end',
		size = 'default',
		id,
		onchange,
		disabled = false,
		class: klass = '',
		style: styleProp = '',
		buttonClass = '',
		panelClass = '',
		...rest
	}: Omit<HTMLAttributes<HTMLDivElement>, keyof Own> & Own = $props();

	type Own = {
		open?: boolean;
		/** Rich header content; receives the live open state. */
		header: Snippet<[DisclosureHeaderContext]>;
		children: Snippet;
		/** Chevron placement; `false` hides it. */
		chevron?: DisclosureChevron;
		/** Header/panel density. `compact` shrinks both to `--fs-xs` and tighter
		 *  padding for strip rows; tune either with `--disclosure-pad`,
		 *  `--disclosure-fs`, `--disclosure-panel-pad`. */
		size?: DisclosureSize;
		/** Base for the button/panel ids the ARIA wiring uses. */
		id?: string;
		onchange?: (open: boolean) => void;
		disabled?: boolean;
		class?: string;
		style?: string;
		buttonClass?: string;
		panelClass?: string;
	};

	const uid = $props.id();
	const baseId = $derived(id ?? `disclosure-${uid}`);
	const buttonId = $derived(`${baseId}-button`);
	const panelId = $derived(`${baseId}-panel`);

	function toggle() {
		open = !open;
		onchange?.(open);
	}
</script>

<div
	{...rest}
	class="disclosure {klass}"
	class:disclosure--open={open}
	class:disclosure--compact={size === 'compact'}
	style={styleProp}
	data-tsu="Disclosure"
>
	<button
		type="button"
		id={buttonId}
		class="disclosure__button {buttonClass}"
		aria-expanded={open}
		aria-controls={panelId}
		{disabled}
		onclick={toggle}
	>
		{#if chevron === 'start'}
			<span class="disclosure__chevron"><Icon name="chevron-down" /></span>
		{/if}
		<span class="disclosure__header">{@render header({ open })}</span>
		{#if chevron === 'end'}
			<span class="disclosure__chevron"><Icon name="chevron-down" /></span>
		{/if}
	</button>
	<div
		id={panelId}
		class="disclosure__panel {panelClass}"
		role="region"
		aria-labelledby={buttonId}
		hidden={!open}
	>
		{@render children()}
	</div>
</div>

<style>
	.disclosure {
		display: block;
	}
	.disclosure__button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-2);
		width: 100%;
		padding: var(--disclosure-pad, var(--sp-3) var(--sp-4));
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		font-weight: var(--fw-medium);
		font-size: var(--disclosure-fs, var(--fs-sm));
		text-align: start;
		cursor: pointer;
		user-select: none;
	}
	.disclosure__button:hover:not(:disabled) {
		background: var(--bg-elevated-2);
	}
	.disclosure__button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}
	.disclosure__button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}
	.disclosure__header {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		min-width: 0;
		flex: 1 1 auto;
	}
	.disclosure__chevron {
		display: inline-flex;
		flex: none;
		color: var(--text-muted);
		transition: transform 0.15s var(--ease);
	}
	.disclosure--open .disclosure__chevron {
		transform: rotate(180deg);
	}
	@media (prefers-reduced-motion: reduce) {
		.disclosure__chevron {
			transition: none;
		}
	}
	.disclosure__panel {
		padding: var(--disclosure-panel-pad, 0 var(--sp-4) var(--sp-4));
		font-size: var(--disclosure-fs, var(--fs-sm));
		color: var(--text-muted);
	}
	.disclosure--compact {
		--disclosure-pad: var(--sp-1) var(--sp-2);
		--disclosure-fs: var(--fs-xs);
		--disclosure-panel-pad: 0 var(--sp-2) var(--sp-2);
	}
	.disclosure__panel[hidden] {
		display: none;
	}
</style>
