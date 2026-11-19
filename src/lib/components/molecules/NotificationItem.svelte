<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { IconName } from '$lib/components/atoms/Icon.svelte';
	import type { Tone } from '$lib/tone';

	/** The shared Tone; `warning` is an alias of `warn`. */
	export type NotificationTone = Tone | 'warning';

	export interface NotificationAction {
		id: string;
		label: string;
		variant?: 'default' | 'primary' | 'ghost' | 'danger';
		/** Ask inline ("Reject?" Confirm / Cancel) before firing. */
		requiresConfirm?: boolean;
		/** Label of the confirming button; defaults to `label`. */
		confirmLabel?: string;
	}

	export interface NotificationData {
		id: string;
		title: string;
		text?: string;
		/** Date, epoch ms or ISO string. */
		time: Date | number | string;
		icon?: IconName;
		tone?: Tone | 'warning';
		unread?: boolean;
		/** Resolved label ("Approved on phone"): the item turns muted and drops its actions. */
		state?: string;
		actions?: NotificationAction[];
		href?: string;
	}

	export type NotificationIcon = IconName | Snippet;
</script>

<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Dot from '$lib/components/atoms/Dot.svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import IconButton from './IconButton.svelte';
	import Menu, { type MenuItem } from './Menu.svelte';
	import Timestamp from './Timestamp.svelte';
	import { canonicalTone } from '$lib/tone';

	type Hue = Exclude<Tone, 'success'>;
	const TONE_ICON: Record<Hue, IconName> = {
		neutral: 'bell',
		accent: 'bell',
		info: 'info',
		ok: 'check',
		warn: 'warning',
		danger: 'warning',
	};
	const VISIBLE_ACTIONS = 2;

	type Own = {
		title: string;
		text?: string;
		time: Date | number | string;
		/** Kit icon name or a snippet; defaults to a glyph matching `tone`. */
		icon?: NotificationIcon;
		tone?: Tone | 'warning';
		unread?: boolean;
		state?: string;
		actions?: NotificationAction[];
		href?: string;
		/** `onaction` may return a promise; the action stays pending until it settles,
		 *  or until `state` / `actions` change. */
		onaction?: (id: string) => unknown;
		onopen?: () => void;
		/** Shows a dismiss button when set. */
		ondismiss?: () => void;
		dismissLabel?: string;
		moreLabel?: string;
		cancelLabel?: string;
		unreadLabel?: string;
		/** Mount the item as an `li` inside a list. */
		as?: 'div' | 'li';
		class?: string;
	};

	let {
		title,
		text,
		time,
		icon,
		tone = 'neutral',
		unread = false,
		state: stateLabel,
		actions = [],
		href,
		onaction,
		onopen,
		ondismiss,
		dismissLabel = 'Dismiss',
		moreLabel = 'More actions',
		cancelLabel = 'Cancel',
		unreadLabel = 'Unread',
		as = 'div',
		class: klass = '',
		...rest
	}: Omit<HTMLAttributes<HTMLElement>, keyof Own> & Own = $props();

	const hue = $derived<Hue>(tone === 'warning' ? 'warn' : canonicalTone(tone));
	const resolved = $derived(Boolean(stateLabel));
	const glyph = $derived(typeof icon === 'function' ? null : (icon ?? TONE_ICON[hue]));
	const iconSnippet = $derived(typeof icon === 'function' ? icon : null);
	const visible = $derived(resolved ? [] : actions.slice(0, VISIBLE_ACTIONS));
	const overflow = $derived(resolved ? [] : actions.slice(VISIBLE_ACTIONS));

	let pendingId = $state<string | null>(null);
	let confirming = $state<NotificationAction | null>(null);
	let expanded = $state(false);
	let clamped = $state(false);
	let textEl = $state<HTMLElement | null>(null);
	let linkEl = $state<HTMLAnchorElement | null>(null);

	$effect(() => {
		void stateLabel;
		void actions;
		pendingId = null;
		confirming = null;
	});

	$effect(() => {
		void text;
		if (!textEl || expanded) return;
		clamped = textEl.scrollHeight > textEl.clientHeight + 1;
	});

	function request(action: NotificationAction) {
		if (pendingId !== null || resolved) return;
		if (action.requiresConfirm && confirming?.id !== action.id) {
			confirming = action;
			return;
		}
		confirming = null;
		pendingId = action.id;
		const result = onaction?.(action.id) as PromiseLike<unknown> | undefined;
		if (typeof result?.then === 'function') {
			const settle = () => {
				if (pendingId === action.id) pendingId = null;
			};
			result.then(settle, settle);
		}
	}

	const menuItems = $derived<MenuItem[]>(
		overflow.map((a) => ({
			id: a.id,
			label: a.label,
			danger: a.variant === 'danger',
			disabled: pendingId !== null,
			onselect: () => request(a),
		})),
	);

	function open() {
		onopen?.();
		if (href) linkEl?.click();
	}

	function onRootClick(e: MouseEvent) {
		const target = e.target as Element;
		if (target.closest('button, a, input, [role="menu"], [popover]')) return;
		open();
	}

	function onRootKeydown(e: KeyboardEvent) {
		if (e.key !== 'Enter' || e.target !== e.currentTarget) return;
		e.preventDefault();
		open();
	}
</script>

<svelte:element
	this={as}
	{...rest}
	data-tsu="NotificationItem"
	data-tone={hue}
	data-unread={unread || undefined}
	data-resolved={resolved || undefined}
	class="notif {klass}"
	onclick={onRootClick}
	onkeydown={onRootKeydown}
>
	<span class="notif-icon" aria-hidden="true">
		{#if iconSnippet}{@render iconSnippet()}{:else if glyph}<Icon name={glyph} />{/if}
	</span>
	<div class="notif-main">
		<div class="notif-head">
			{#if href}
				<a bind:this={linkEl} class="notif-title" {href} onclick={() => onopen?.()}>{title}</a>
			{:else}
				<span class="notif-title">{title}</span>
			{/if}
			<span class="notif-time"><Timestamp value={time} mode="relative" details={false} size="xs" /></span>
			{#if unread}
				<span class="notif-dot"><Dot color="var(--accent)" /><span class="sr-only">{unreadLabel}</span></span>
			{/if}
		</div>
		{#if text}
			<p bind:this={textEl} class="notif-text" class:expanded>{text}</p>
			{#if clamped || expanded}
				<button type="button" class="notif-more" aria-expanded={expanded} onclick={() => (expanded = !expanded)}>
					{expanded ? 'Show less' : 'Show more'}
				</button>
			{/if}
		{/if}
		{#if resolved}
			<span class="notif-state"><Badge tone="muted" size="sm" border={false}>{stateLabel}</Badge></span>
		{:else if confirming}
			<div class="notif-actions" role="group" aria-label={confirming.label}>
				<span class="notif-ask">{confirming.label}?</span>
				<Button
					size="sm"
					variant={confirming.variant === 'danger' ? 'danger' : 'primary'}
					data-action={confirming.id}
					data-confirm
					onclick={() => confirming && request(confirming)}
				>
					{confirming.confirmLabel ?? confirming.label}
				</Button>
				<Button size="sm" variant="ghost" onclick={() => (confirming = null)}>{cancelLabel}</Button>
			</div>
		{:else if visible.length}
			<div class="notif-actions">
				{#each visible as action (action.id)}
					<Button
						size="sm"
						variant={action.variant ?? 'default'}
						data-action={action.id}
						loading={pendingId === action.id}
						disabled={pendingId !== null && pendingId !== action.id}
						onclick={() => request(action)}
					>
						{action.label}
					</Button>
				{/each}
				{#if overflow.length}
					<Menu label={moreLabel} items={menuItems} size="sm" variant="ghost" placement="bottom-end">
						{#snippet trigger()}<Icon name="more" />{/snippet}
					</Menu>
				{/if}
			</div>
		{/if}
	</div>
	{#if ondismiss}
		<span class="notif-dismiss">
			<IconButton icon="x" label={dismissLabel} inline hitArea="compact" onclick={() => ondismiss?.()} />
		</span>
	{/if}
</svelte:element>

<style>
	.notif {
		position: relative;
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: start;
		gap: var(--sp-3);
		padding: var(--sp-3);
		border-radius: var(--r-md);
		list-style: none;
		color: var(--text);
		cursor: default;
	}
	.notif:focus-visible {
		outline-offset: var(--focus-ring-offset-inset);
		border-radius: var(--r-md);
	}
	@media (hover: hover) and (pointer: fine) {
		.notif:hover {
			background: var(--bg-elevated-2);
		}
	}
	.notif-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--box-md);
		height: var(--box-md);
		border-radius: var(--r-md);
		background: color-mix(in srgb, var(--text-muted) 14%, transparent);
		color: var(--text-muted);
	}
	.notif-icon :global(.icon) {
		font-size: var(--icon-md);
	}
	.notif[data-tone='info'] .notif-icon {
		background: color-mix(in srgb, var(--info) 14%, transparent);
		color: var(--info);
	}
	.notif[data-tone='accent'] .notif-icon {
		background: color-mix(in srgb, var(--accent) 14%, transparent);
		color: var(--accent);
	}
	.notif[data-tone='ok'] .notif-icon {
		background: color-mix(in srgb, var(--ok) 14%, transparent);
		color: var(--ok);
	}
	.notif[data-tone='warn'] .notif-icon {
		background: color-mix(in srgb, var(--warn) 14%, transparent);
		color: var(--warn);
	}
	.notif[data-tone='danger'] .notif-icon {
		background: color-mix(in srgb, var(--danger) 14%, transparent);
		color: var(--danger);
	}
	.notif-main {
		display: flex;
		flex-direction: column;
		gap: var(--sp-1);
		min-width: 0;
	}
	.notif-head {
		display: flex;
		align-items: baseline;
		gap: var(--sp-2);
		min-width: 0;
	}
	.notif-title {
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-weight: var(--fw-semibold);
		font-size: var(--fs-sm);
		color: inherit;
		text-decoration: none;
	}
	a.notif-title:hover {
		text-decoration: underline;
	}
	.notif-time {
		flex: none;
		white-space: nowrap;
	}
	.notif-dot {
		flex: none;
		display: inline-flex;
		align-self: center;
	}
	.notif-text {
		margin: 0;
		font-size: var(--fs-sm);
		color: var(--text-muted);
		overflow-wrap: anywhere;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
	}
	.notif-text.expanded {
		display: block;
		overflow: visible;
	}
	.notif-more {
		align-self: flex-start;
		padding: 0;
		border: 0;
		background: none;
		color: var(--accent);
		font: inherit;
		font-size: var(--fs-xs);
		cursor: pointer;
	}
	.notif-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--sp-2);
		margin-top: var(--sp-1);
	}
	.notif-ask {
		font-size: var(--fs-sm);
		font-weight: var(--fw-medium);
	}
	.notif-state {
		display: flex;
		margin-top: var(--sp-1);
	}
	.notif[data-resolved] .notif-icon,
	.notif[data-resolved] .notif-head,
	.notif[data-resolved] .notif-text {
		opacity: 0.7;
	}
	.notif[data-resolved] .notif-icon {
		background: color-mix(in srgb, var(--text-muted) 14%, transparent);
		color: var(--text-muted);
	}
	.notif-dismiss {
		display: inline-flex;
	}
</style>
