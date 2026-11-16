<script lang="ts">
	import type { Snippet } from 'svelte';
	import { tick } from 'svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import Drawer from '$lib/components/molecules/Drawer.svelte';
	import EmptyState from '$lib/components/molecules/EmptyState.svelte';
	import FilterChips from '$lib/components/molecules/FilterChips.svelte';
	import IconButton from '$lib/components/molecules/IconButton.svelte';
	import LoadMore from '$lib/components/molecules/LoadMore.svelte';
	import NotificationItem, { type NotificationData } from '$lib/components/molecules/NotificationItem.svelte';
	import Popover from '$lib/components/molecules/Popover.svelte';
	import { media } from '$lib/media.svelte';
	import { maxWidth } from '$lib/breakpoints';
	import { playSound } from '$lib/sound';
	import { dayLabel, type NotificationFilter } from './notification-center';

	let {
		items = [],
		unread,
		loading = false,
		hasMore = false,
		open = $bindable(false),
		filter = $bindable<NotificationFilter>('all'),
		filters = false,
		title = 'Notifications',
		markAllLabel = 'Mark all read',
		closeLabel = 'Close notifications',
		emptyTitle = 'No notifications',
		emptyDescription = 'You are all caught up.',
		placement = 'bottom-end',
		sheet: sheetProp = 'auto',
		attention = true,
		chime = false,
		sound = true,
		onaction,
		onread,
		onreadall,
		onloadmore,
		onopenchange,
		onvisible,
		onitemopen,
		ondismiss,
		footer: footerSnippet,
		empty,
		class: klass = '',
		style: styleProp = '',
	}: {
		items?: NotificationData[];
		/** Badge count; defaults to the number of unread `items`. */
		unread?: number;
		loading?: boolean;
		hasMore?: boolean;
		open?: boolean;
		filter?: NotificationFilter;
		/** Show the All / Unread / Needs action chips. */
		filters?: boolean;
		title?: string;
		markAllLabel?: string;
		closeLabel?: string;
		emptyTitle?: string;
		emptyDescription?: string;
		placement?: 'bottom-start' | 'bottom-end';
		/** `auto` opens a bottom Drawer on coarse pointers and narrow screens, a Popover otherwise. */
		sheet?: 'auto' | boolean;
		/** Wiggle the bell when the unread count rises; skipped under reduced motion. */
		attention?: boolean;
		/** Play the `notify` sound when the unread count rises (needs sounds enabled). */
		chime?: boolean;
		sound?: boolean;
		/** May return a promise; the item's action stays pending until it settles. */
		onaction?: (itemId: string, actionId: string) => unknown;
		/** An unread item was opened. */
		onread?: (id: string) => void;
		onreadall?: () => void;
		onloadmore?: () => void;
		onopenchange?: (open: boolean) => void;
		/** An unread item scrolled into view while the panel is open; once per open. */
		onvisible?: (id: string) => void;
		onitemopen?: (id: string) => void;
		/** Shows a dismiss button on each item when set. */
		ondismiss?: (id: string) => void;
		footer?: Snippet;
		/** Replaces the empty state. */
		empty?: Snippet;
		class?: string;
		style?: string;
	} = $props();

	const uid = Math.random().toString(36).slice(2, 8);
	const bellId = `nc-bell-${uid}`;
	const titleId = `nc-title-${uid}`;

	const narrow = media(`(pointer: coarse), ${maxWidth('sm')}`);
	const sheet = $derived(sheetProp === 'auto' ? narrow.matches : sheetProp);

	const count = $derived(unread ?? items.filter((i) => i.unread).length);
	const needsAction = (i: NotificationData) => !i.state && (i.actions?.length ?? 0) > 0;
	const shown = $derived(
		filter === 'unread' ? items.filter((i) => i.unread) : filter === 'action' ? items.filter(needsAction) : items,
	);
	const groups = $derived.by(() => {
		const out: { label: string; items: NotificationData[] }[] = [];
		const now = new Date();
		for (const item of shown) {
			const label = dayLabel(item.time, now);
			const last = out[out.length - 1];
			if (last?.label === label) last.items.push(item);
			else out.push({ label, items: [item] });
		}
		return out;
	});
	const filterOptions = $derived([
		{ id: 'all', label: 'All' },
		{ id: 'unread', label: 'Unread', count: items.filter((i) => i.unread).length },
		{ id: 'action', label: 'Needs action', count: items.filter(needsAction).length },
	]);

	let activeId = $state<string | null>(null);
	const focusId = $derived(shown.some((i) => i.id === activeId) ? activeId : (shown[0]?.id ?? null));

	let bodyEl = $state<HTMLElement | null>(null);
	let wiggle = $state(false);
	let lastCount: number | null = null;
	let wiggleTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		const n = count;
		if (lastCount !== null && n > lastCount) {
			if (attention) {
				wiggle = false;
				clearTimeout(wiggleTimer);
				requestAnimationFrame(() => {
					wiggle = true;
					wiggleTimer = setTimeout(() => (wiggle = false), 700);
				});
			}
			if (chime) playSound('notify', sound);
		}
		lastCount = n;
	});
	$effect(() => () => clearTimeout(wiggleTimer));

	let reported = new Set<string>();
	$effect(() => {
		if (!open || !bodyEl || !onvisible || typeof IntersectionObserver === 'undefined') return;
		void shown;
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (!e.isIntersecting) continue;
					const id = (e.target as HTMLElement).dataset.id;
					io.unobserve(e.target);
					if (id && !reported.has(id)) {
						reported.add(id);
						onvisible?.(id);
					}
				}
			},
			{ root: sheet ? null : bodyEl, threshold: 0.6 },
		);
		for (const el of bodyEl.querySelectorAll<HTMLElement>('[data-tsu="NotificationItem"][data-unread]')) io.observe(el);
		return () => io.disconnect();
	});

	let wasOpen = false;
	$effect(() => {
		const o = open;
		if (o === wasOpen) return;
		wasOpen = o;
		onopenchange?.(o);
		if (o) {
			reported = new Set();
			tick().then(focusFirst);
		}
	});

	function focusFirst() {
		const first = bodyEl?.querySelector<HTMLElement>('[data-tsu="NotificationItem"][tabindex="0"]');
		(first ?? bodyEl)?.focus({ preventScroll: true });
	}

	function bell(): HTMLElement | null {
		return document.getElementById(bellId);
	}

	function restoreFocus() {
		const active = document.activeElement;
		if (!active || active === document.body || bodyEl?.closest('.nc-panel')?.contains(active)) bell()?.focus();
	}

	async function close() {
		open = false;
		await tick();
		restoreFocus();
	}

	async function onSheetClose() {
		await tick();
		restoreFocus();
	}

	function itemEls(): HTMLElement[] {
		return [...(bodyEl?.querySelectorAll<HTMLElement>('[data-tsu="NotificationItem"]') ?? [])];
	}

	function onPanelKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			close();
			return;
		}
		if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
		const target = e.target as HTMLElement;
		if (target.closest('input, textarea, [role="menu"], [role="radiogroup"], [role="tablist"]')) return;
		const list = itemEls();
		if (!list.length) return;
		const current = list.findIndex((el) => el.contains(target));
		let next = current;
		if (e.key === 'Home') next = 0;
		else if (e.key === 'End') next = list.length - 1;
		else if (e.key === 'ArrowDown') next = current < 0 ? 0 : Math.min(list.length - 1, current + 1);
		else next = current < 0 ? 0 : Math.max(0, current - 1);
		e.preventDefault();
		activeId = list[next].dataset.id ?? null;
		list[next].focus();
	}

	function openItem(item: NotificationData) {
		if (item.unread) onread?.(item.id);
		onitemopen?.(item.id);
	}
</script>

{#snippet bellGlyph()}
	<span class="nc-bell" class:wiggle><Icon name="bell" /></span>
{/snippet}

{#snippet sheetHead()}
	<div class="nc-header" role="none" onkeydown={onPanelKeydown}>{@render head()}</div>
{/snippet}

{#snippet sheetFoot()}
	{@render footerSnippet?.()}
{/snippet}

{#snippet head()}
	<div class="nc-head">
		<span id={titleId} class="nc-title">{title}</span>
		{#if count > 0}<Badge size="xs" numeric tone="accent" border={false}>{count}</Badge>{/if}
		<span class="nc-spacer"></span>
		<Button size="sm" variant="ghost" disabled={count === 0} onclick={() => onreadall?.()}>{markAllLabel}</Button>
		{#if sheet}<IconButton icon="x" label={closeLabel} onclick={close} />{/if}
	</div>
	{#if filters}
		<div class="nc-filters">
			<FilterChips
				options={filterOptions}
				value={filter}
				size="sm"
				label="Filter notifications"
				onchange={(v) => (filter = v as NotificationFilter)}
				{sound}
			/>
		</div>
	{/if}
{/snippet}

{#snippet body()}
	<div class="nc-body" bind:this={bodyEl} tabindex="-1" aria-busy={loading || undefined}>
		{#if shown.length === 0}
			{#if loading}
				<EmptyState size="compact" loading title="Loading notifications" />
			{:else if empty}
				{@render empty()}
			{:else}
				<EmptyState size="compact" icon="bell" title={emptyTitle} description={emptyDescription} />
			{/if}
		{:else}
			{#each groups as group, g (group.label)}
				<section class="nc-group" aria-labelledby="{titleId}-g{g}">
					<h3 id="{titleId}-g{g}" class="nc-day">{group.label}</h3>
					<ul class="nc-list" aria-labelledby="{titleId}-g{g}">
						{#each group.items as item (item.id)}
							<NotificationItem
								as="li"
								data-id={item.id}
								tabindex={item.id === focusId ? 0 : -1}
								onfocusin={() => (activeId = item.id)}
								title={item.title}
								text={item.text}
								time={item.time}
								icon={item.icon}
								tone={item.tone}
								unread={item.unread}
								state={item.state}
								actions={item.actions}
								href={item.href}
								onaction={(actionId) => onaction?.(item.id, actionId)}
								onopen={() => openItem(item)}
								ondismiss={ondismiss ? () => ondismiss?.(item.id) : undefined}
							/>
						{/each}
					</ul>
				</section>
			{/each}
			{#if hasMore || loading}
				<LoadMore state={loading ? 'loading' : 'idle'} onload={() => onloadmore?.()} {sound} />
			{/if}
		{/if}
	</div>
{/snippet}

<span data-tsu="NotificationCenter" class="nc {klass}" style={styleProp}>
	{#if sheet}
		<IconButton
			id={bellId}
			icon="bell"
			label={title}
			{count}
			class="nc-bell-btn {wiggle ? 'nc-wiggle' : ''}"
			aria-haspopup="dialog"
			aria-expanded={open}
			onclick={() => (open = !open)}
			{sound}
		/>
		<Drawer
			bind:open
			side="bottom"
			{title}
			class="nc-panel nc-sheet"
			style="--drawer-body-pad: 0"
			header={sheetHead}
			footer={footerSnippet ? sheetFoot : undefined}
			onclose={onSheetClose}
			{sound}
		>
			<div class="nc-content" role="none" onkeydown={onPanelKeydown}>{@render body()}</div>
		</Drawer>
	{:else}
		<Popover
			id={bellId}
			label={title}
			bind:open
			{count}
			{placement}
			role="dialog"
			haspopup="dialog"
			panelClass="nc-panel nc-pop"
			panelStyle="width: min(26rem, calc(100vw - 2 * var(--sp-3))); max-width: none; padding: 0"
			onclose={onSheetClose}
			{sound}
			trigger={bellGlyph}
		>
			<div class="nc-content nc-pop-content" role="none" onkeydown={onPanelKeydown}>
				{@render head()}
				{@render body()}
				{#if footerSnippet}<div class="nc-foot">{@render footerSnippet()}</div>{/if}
			</div>
		</Popover>
	{/if}
</span>

<style>
	.nc {
		display: inline-flex;
	}
	.nc-bell {
		display: inline-flex;
		transform-origin: 50% 10%;
	}
	.nc-bell.wiggle,
	.nc :global(.nc-wiggle svg) {
		transform-origin: 50% 10%;
		animation: nc-wiggle 0.6s var(--ease-out);
	}
	@keyframes nc-wiggle {
		0%,
		100% {
			rotate: 0deg;
		}
		20% {
			rotate: 14deg;
		}
		40% {
			rotate: -12deg;
		}
		60% {
			rotate: 8deg;
		}
		80% {
			rotate: -4deg;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.nc-bell.wiggle,
		.nc :global(.nc-wiggle svg) {
			animation: none;
		}
	}
	.nc-pop-content {
		display: flex;
		flex-direction: column;
		max-height: min(36rem, calc(100dvh - 6rem));
	}
	.nc-head {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		min-width: 0;
		padding: var(--sp-2) var(--sp-2) var(--sp-2) var(--sp-3);
		border-bottom: var(--edge-width) solid var(--surface-edge);
	}
	.nc-header .nc-head {
		padding: var(--sp-3) var(--sp-3) var(--sp-3) var(--sp-4);
	}
	.nc-title {
		font-weight: var(--fw-semibold);
		font-size: var(--fs-base);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
	}
	.nc-spacer {
		flex: 1 1 auto;
	}
	.nc-filters {
		padding: var(--sp-2) var(--sp-3);
		border-bottom: var(--edge-width) solid var(--surface-edge);
	}
	.nc-body {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: var(--sp-1);
		outline: none;
	}
	.nc-group + .nc-group {
		margin-top: var(--sp-2);
	}
	.nc-day {
		margin: 0;
		padding: var(--sp-2) var(--sp-3) var(--sp-1);
		font-size: var(--fs-xs);
		font-weight: var(--fw-semibold);
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.nc-list {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.nc-foot {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--sp-2);
		padding: var(--sp-2);
		border-top: var(--edge-width) solid var(--surface-edge);
	}
</style>
