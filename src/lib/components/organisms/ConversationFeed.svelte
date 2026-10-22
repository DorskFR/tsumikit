<script lang="ts" generics="T">
	// Scrolling message feed: sticks to the bottom while the user is there,
	// keeps the viewport still when older items are prepended, and offers a
	// "jump to latest" pill once new items land while scrolled up.
	import { type Snippet, tick, untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import Button from '$lib/components/atoms/Button.svelte';
	import LoadMore from '$lib/components/molecules/LoadMore.svelte';

	let {
		items,
		key,
		item,
		empty,
		loadMore,
		onloadmore,
		loadMoreLabel = 'Load older',
		follow = true,
		jumpLabel = 'Jump to latest',
		label = 'Messages',
		class: klass = '',
		style: styleProp = ''
	}: {
		items: T[];
		key: (item: T) => string | number;
		item: Snippet<[T, number]>;
		empty?: Snippet;
		/** State of the LoadMore pill at the top; omit to hide it. */
		loadMore?: 'idle' | 'loading' | 'error' | 'done';
		/** Prepend older items; the scroll position is preserved. */
		onloadmore?: () => void;
		loadMoreLabel?: string;
		/** Stick to the bottom while the user is at the bottom. */
		follow?: boolean;
		jumpLabel?: string;
		/** Accessible name of the message log. */
		label?: string;
		class?: string;
		style?: string;
	} = $props();

	const THRESHOLD = 80;

	let scroller = $state<HTMLElement | null>(null);
	let stuck = $state(true);
	let pending = $state(false);
	// Keeps screen readers from announcing a history load or swap as new messages.
	let busy = $state(false);
	let prevFirst: string | number | undefined;
	let prevLast: string | number | undefined;

	const atBottom = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight <= THRESHOLD;

	export function scrollToBottom(behavior: ScrollBehavior = 'auto') {
		const el = scroller;
		if (el) el.scrollTo({ top: el.scrollHeight, behavior });
		stuck = true;
		pending = false;
	}

	function onscroll() {
		if (!scroller) return;
		stuck = atBottom(scroller);
		if (stuck) pending = false;
	}

	// Keyboard focus at the scroll edge would cut its ring: bring it inside the scroll padding.
	function onfocusin(e: FocusEvent) {
		const el = scroller;
		const target = e.target;
		if (!el || !(target instanceof Element) || target === el) return;
		try {
			if (!target.matches(':focus-visible')) return;
		} catch {
			return;
		}
		const pad = Number.parseFloat(getComputedStyle(el).scrollPaddingTop) || 0;
		const box = el.getBoundingClientRect();
		const r = target.getBoundingClientRect();
		const top = box.top + el.clientTop;
		const bottom = top + el.clientHeight;
		if (r.top - pad < top) el.scrollTop -= top - (r.top - pad);
		else if (r.bottom + pad > bottom) el.scrollTop += r.bottom + pad - bottom;
	}

	$effect.pre(() => {
		const el = scroller;
		const first = items.length ? key(items[0]) : undefined;
		const last = items.length ? key(items[items.length - 1]) : undefined;
		if (!el) return;
		const keys = prevFirst === undefined ? null : new Set(items.map(key));
		const kept = (k: string | number | undefined) => k !== undefined && keys !== null && keys.has(k);
		const prepended = first !== prevFirst && last === prevLast && kept(prevFirst);
		const reset = prevLast !== undefined && !kept(prevLast) && !kept(prevFirst);
		const appended = !reset && last !== undefined && last !== prevLast;
		prevFirst = first;
		prevLast = last;
		const fromBottom = el.scrollHeight - el.scrollTop;
		if (prepended || reset) {
			busy = true;
			requestAnimationFrame(() => requestAnimationFrame(() => (busy = false)));
		}
		tick().then(() => {
			if (prepended) {
				el.scrollTop = el.scrollHeight - fromBottom;
			} else if (reset) {
				pending = false;
				if (untrack(() => follow)) scrollToBottom();
				else el.scrollTop = 0;
			} else if (appended) {
				if (untrack(() => follow && stuck)) scrollToBottom();
				else pending = true;
			}
		});
	});

	const pin: Attachment = (node) => {
		if (typeof ResizeObserver === 'undefined') return;
		const ro = new ResizeObserver(() => {
			if (follow && stuck && scroller) scroller.scrollTop = scroller.scrollHeight;
		});
		ro.observe(node);
		return () => ro.disconnect();
	};
</script>

<div data-tsu="ConversationFeed" class="feed-wrap {klass}" style={styleProp}>
	<div class="feed" bind:this={scroller} {onscroll} {onfocusin}>
		{#if loadMore}
			<LoadMore pill state={loadMore} onload={onloadmore} label={loadMoreLabel} />
		{/if}
		{#if items.length === 0 && empty}
			{@render empty()}
		{/if}
		<div class="feed-items" role="log" aria-label={label} aria-busy={busy} {@attach pin}>
			{#each items as entry, i (key(entry))}
				{@render item(entry, i)}
			{/each}
		</div>
	</div>
	{#if pending}
		<div class="jump">
			<Button pill size="sm" onclick={() => scrollToBottom('smooth')}>{jumpLabel} ↓</Button>
		</div>
	{/if}
</div>

<style>
	.feed-wrap {
		position: relative;
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}
	.feed {
		position: relative;
		flex: 1;
		min-height: 0;
		overflow: auto;
		overscroll-behavior: contain;
		display: flex;
		flex-direction: column;
		gap: var(--sp-3);
		padding: var(--sp-3);
		scroll-padding-block: var(--sp-2);
	}
	.feed > * {
		flex-shrink: 0;
	}
	.feed-items {
		display: flex;
		flex-direction: column;
		gap: var(--sp-3);
	}
	.jump {
		position: absolute;
		inset-inline: 0;
		bottom: var(--sp-3);
		width: fit-content;
		margin-inline: auto;
		z-index: 1;
		border-radius: var(--r-pill);
		box-shadow: var(--shadow-md);
	}
</style>
