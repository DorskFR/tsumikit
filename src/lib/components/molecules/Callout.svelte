<script lang="ts">
	// Inline message banner — the one way to say "heads up" inside a page:
	// tone-tinted Card with a leading glyph, optional title, body, right-aligned
	// actions and an optional dismiss button. `busy` swaps the glyph for a
	// Spinner (auto-search / long-running states). Announced as a live region:
	// `status` normally, `alert` for danger so errors interrupt.
	import type { Snippet } from 'svelte';
	import Card from '../atoms/Card.svelte';
	import Icon, { type IconName } from '../atoms/Icon.svelte';
	import Spinner from '../atoms/Spinner.svelte';
	import IconButton from './IconButton.svelte';

	type Tone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info';

	const DEFAULT_ICON: Record<Tone, IconName> = {
		neutral: 'info',
		info: 'info',
		ok: 'check',
		warn: 'warning',
		danger: 'warning'
	};

	let {
		tone = 'info',
		icon,
		title,
		dismissible = false,
		dismissLabel = 'Dismiss',
		ondismiss,
		busy = false,
		class: klass = '',
		children,
		actions,
		...rest
	}: {
		tone?: Tone;
		icon?: IconName;
		title?: string;
		dismissible?: boolean;
		dismissLabel?: string;
		ondismiss?: () => void;
		busy?: boolean;
		class?: string;
		children?: Snippet;
		actions?: Snippet;
		[key: string]: unknown;
	} = $props();

	let glyph = $derived(icon ?? DEFAULT_ICON[tone]);
</script>

<Card
	{tone}
	padding="none"
	role={tone === 'danger' ? 'alert' : 'status'}
	class="callout callout-{tone} {klass}"
	data-tsu="Callout"
	{...rest}
>
	<span class="callout-icon" aria-hidden={busy ? undefined : true}>
		{#if busy}
			<Spinner />
		{:else}
			<Icon name={glyph} />
		{/if}
	</span>
	<div class="callout-body">
		{#if title}<p class="callout-title">{title}</p>{/if}
		{#if children}<div class="callout-text">{@render children()}</div>{/if}
	</div>
	{#if actions}
		<div class="callout-actions">{@render actions()}</div>
	{/if}
	{#if dismissible}
		<span class="callout-dismiss">
			<IconButton icon="x" inline label={dismissLabel} onclick={() => ondismiss?.()} />
		</span>
	{/if}
</Card>

<style>
	:global(.card.callout) {
		--callout-tone: var(--text-muted);
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: var(--sp-3);
		padding: var(--sp-3);
	}
	:global(.callout-ok) {
		--callout-tone: var(--ok);
	}
	:global(.callout-warn) {
		--callout-tone: var(--warn);
	}
	:global(.callout-danger) {
		--callout-tone: var(--danger);
	}
	:global(.callout-info) {
		--callout-tone: var(--info);
	}

	.callout-icon {
		display: inline-flex;
		flex: none;
		align-items: center;
		color: var(--callout-tone);
		font-size: 1.125rem;
		line-height: 1;
		min-height: 1.4em;
	}
	.callout-body {
		flex: 1 1 12rem;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--sp-1);
		font-size: var(--fs-sm);
		line-height: 1.5;
		color: var(--text);
	}
	.callout-title {
		margin: 0;
		font-weight: var(--fw-semibold);
	}
	.callout-text {
		overflow-wrap: anywhere;
	}
	.callout-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--sp-2);
		margin-left: auto;
	}
	.callout-dismiss {
		display: inline-flex;
		flex: none;
		margin-left: auto;
	}
	.callout-actions + .callout-dismiss {
		margin-left: 0;
	}
</style>
