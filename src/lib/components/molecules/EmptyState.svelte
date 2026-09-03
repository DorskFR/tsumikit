<script lang="ts">
	// Empty / placeholder state — the "nothing here yet" panel every unworked
	// settings section, empty list, and zero-result table reaches for. Centered
	// stack of:
	//   • a tinted icon chip (when `icon`/`iconChildren` is set)
	//   • a title
	//   • a muted, max-width-limited description
	//   • an optional action area (slot via `action`, or a built-in button when
	//     `actionLabel`+`onAction` are passed)
	// Everything is token-driven. `size` picks the layout: `default`, `compact`
	// (tighter spacing), or `inline` (a single muted line). `loading` swaps the
	// chip for a spinner and marks the root busy.
	import type { Snippet } from 'svelte';
	import Button from '../atoms/Button.svelte';
	import Icon, { type IconName } from '../atoms/Icon.svelte';
	import Spinner from '../atoms/Spinner.svelte';

	let {
		title,
		description,
		icon,
		// Tints the icon chip with a semantic hue; neutral falls back to accent.
		tone = 'neutral',
		// Built-in primary action button. Provide both to render it; for anything
		// richer (multiple buttons, links) use the `action` snippet instead.
		actionLabel,
		onAction,
		// Legacy alias for size="compact".
		compact = false,
		size = 'default',
		loading = false,
		class: klass = '',
		// Raw SVG markup for a custom glyph — passed straight to `Icon`.
		iconChildren,
		// Custom action area (overrides the built-in button when present).
		action,
		...rest
	}: {
		title?: string;
		description?: string | Snippet;
		icon?: IconName;
		tone?: 'neutral' | 'ok' | 'warn' | 'danger' | 'info';
		actionLabel?: string;
		onAction?: () => void;
		compact?: boolean;
		size?: 'inline' | 'compact' | 'default';
		loading?: boolean;
		class?: string;
		iconChildren?: Snippet;
		action?: Snippet;
		[key: string]: unknown;
	} = $props();

	const sz = $derived(compact ? 'compact' : size);
</script>

<div
	class="empty empty-{tone} {klass}"
	class:empty-compact={sz === 'compact'}
	class:empty-inline={sz === 'inline'}
	class:empty-loading={loading}
	aria-busy={loading ? 'true' : undefined}
	data-tsu="EmptyState"
	{...rest}
>
	{#if loading}
		<span class="empty-chip">
			<Spinner />
		</span>
	{:else if (icon || iconChildren) && sz !== 'inline'}
		<span class="empty-chip" aria-hidden="true">
			{#if iconChildren}
				<Icon>{@render iconChildren()}</Icon>
			{:else}
				<Icon name={icon} />
			{/if}
		</span>
	{/if}
	{#if title}<p class="empty-title">{title}</p>{/if}
	{#if description}
		<p class="empty-desc">
			{#if typeof description === 'function'}{@render description()}{:else}{description}{/if}
		</p>
	{/if}
	{#if action}
		<div class="empty-action">{@render action()}</div>
	{:else if actionLabel && onAction}
		<div class="empty-action">
			<Button variant="primary" onclick={onAction}>{actionLabel}</Button>
		</div>
	{/if}
</div>

<style>
	.empty {
		/* The tone hue the chip pulls from; neutral falls back to accent. */
		--empty-tone: var(--accent);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: var(--sp-3);
		padding: var(--sp-8) var(--sp-5);
	}
	:global(.empty-ok) {
		--empty-tone: var(--ok);
	}
	:global(.empty-warn) {
		--empty-tone: var(--warn);
	}
	:global(.empty-danger) {
		--empty-tone: var(--danger);
	}
	:global(.empty-info) {
		--empty-tone: var(--info);
	}
	.empty-compact {
		gap: var(--sp-2);
		padding: var(--sp-4) var(--sp-3);
	}

	.empty-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: 3rem;
		height: 3rem;
		border-radius: var(--r-lg);
		font-size: 1.5rem;
		color: var(--empty-tone);
		background: color-mix(in srgb, var(--empty-tone) 14%, transparent);
		border: 1px solid color-mix(in srgb, var(--empty-tone) 30%, transparent);
	}
	.empty-compact .empty-chip {
		width: 2.25rem;
		height: 2.25rem;
		font-size: 1.125rem;
	}
	.empty-inline {
		flex-direction: row;
		justify-content: center;
		gap: var(--sp-2);
		padding: var(--sp-6) var(--sp-4);
	}
	.empty-inline .empty-chip {
		width: auto;
		height: auto;
		font-size: 1em;
		background: none;
		border: none;
	}
	.empty-inline .empty-title {
		color: var(--text-muted);
		font-weight: var(--fw-normal);
		font-size: var(--fs-sm);
	}
	.empty-inline .empty-desc {
		max-width: none;
	}
	.empty-inline .empty-action {
		margin-top: 0;
	}
	.empty-title {
		margin: 0;
		font-size: var(--fs-md);
		font-weight: var(--fw-semibold);
		color: var(--text);
		line-height: 1.3;
	}
	.empty-desc {
		margin: 0;
		max-width: 32ch;
		font-size: var(--fs-sm);
		color: var(--text-muted);
		line-height: 1.5;
	}
	.empty-action {
		margin-top: var(--sp-1);
	}
</style>
