<script lang="ts">
	// One conversation line: role-tinted bubble with a meta row, optional
	// actions, delivery state, clamp-and-expand body and a copy affordance.
	import type { Snippet } from 'svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import CopyButton from '$lib/components/molecules/CopyButton.svelte';

	let {
		role = 'assistant',
		roleLabel,
		align,
		meta,
		actions,
		state: delivery,
		onretry,
		retryLabel = 'Retry',
		clamp,
		expandLabel = 'Show more',
		collapseLabel = 'Show less',
		selected = false,
		copyText,
		children,
		class: klass = '',
		style: styleProp = ''
	}: {
		role?: 'user' | 'assistant' | 'system' | 'tool' | 'mcp';
		/** Text of the role pill; defaults to the role name. */
		roleLabel?: string;
		/** Defaults to `end` for the user, `start` otherwise. */
		align?: 'start' | 'end';
		meta?: Snippet;
		actions?: Snippet;
		state?: 'sending' | 'failed';
		onretry?: () => void;
		retryLabel?: string;
		/** Max visible lines before an expand toggle appears. */
		clamp?: number;
		expandLabel?: string;
		collapseLabel?: string;
		selected?: boolean;
		/** Renders a CopyButton in the actions row. */
		copyText?: string;
		children: Snippet;
		class?: string;
		style?: string;
	} = $props();

	const side = $derived(align ?? (role === 'user' ? 'end' : 'start'));
	let expanded = $state(false);
</script>

<article
	data-tsu="ChatBubble"
	data-role={role}
	data-state={delivery}
	data-selected={selected || undefined}
	class="bubble role-{role} align-{side} {klass}"
	class:selected
	class:clamped={!!clamp && !expanded}
	style="--clamp: {clamp ?? 'none'}; {styleProp}"
>
	<header class="meta">
		<Badge size="xs" class="role-pill">{roleLabel ?? role}</Badge>
		{#if meta}{@render meta()}{/if}
		{#if delivery === 'sending'}<span class="state">sending…</span>{/if}
		{#if delivery === 'failed'}
			<span class="state failed">not delivered</span>
			{#if onretry}<Button size="sm" variant="link" onclick={onretry}>{retryLabel}</Button>{/if}
		{/if}
		{#if actions || copyText}
			<span class="actions">
				{#if actions}{@render actions()}{/if}
				{#if copyText}<CopyButton text={copyText} showLabel={false} box="xs" />{/if}
			</span>
		{/if}
	</header>
	<div class="body">{@render children()}</div>
	{#if clamp}
		<Button size="sm" variant="link" onclick={() => (expanded = !expanded)}>
			{expanded ? collapseLabel : expandLabel}
		</Button>
	{/if}
</article>

<style>
	.bubble {
		--role: var(--role-assistant);
		display: flex;
		flex-direction: column;
		gap: var(--sp-1);
		max-width: min(100%, 72ch);
		padding: var(--sp-2) var(--sp-3);
		border: 1px solid color-mix(in srgb, var(--role) 30%, var(--border));
		border-inline-start: 3px solid var(--role);
		border-radius: var(--r-lg);
		background: color-mix(in srgb, var(--role) 6%, var(--surface));
		font-size: var(--fs-sm);
	}
	.role-user {
		--role: var(--role-user);
	}
	.role-system {
		--role: var(--role-system);
	}
	.role-tool {
		--role: var(--role-tool);
	}
	.role-mcp {
		--role: var(--role-mcp);
	}
	.align-end {
		align-self: flex-end;
	}
	.align-start {
		align-self: flex-start;
	}
	.selected {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}
	.bubble[data-state='sending'] {
		opacity: 0.7;
	}
	.meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--sp-2);
		font-size: var(--fs-xs);
		color: var(--text-muted);
	}
	.meta :global(.role-pill) {
		color: var(--role);
		border-color: color-mix(in srgb, var(--role) 40%, transparent);
		text-transform: capitalize;
	}
	.state.failed {
		color: var(--danger);
	}
	.actions {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
		margin-inline-start: auto;
	}
	.body {
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.clamped .body {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: var(--clamp);
		line-clamp: var(--clamp);
		overflow: hidden;
	}
</style>
