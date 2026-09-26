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
		class?: string;
		style?: string;
	} = $props();

	const THRESHOLD = 80;

	let scroller = $state<HTMLElement | null>(null);
	let stuck = $state(true);
	let pending = $state(false);
	let prevFirst: string | number | undefined;
	let prevLast: string | number | undefined;
	let prevLength = 0;

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

	$effect.pre(() => {
		const el = scroller;
		const first = items.length ? key(items[0]) : undefined;
		const last = items.length ? key(items[items.length - 1]) : undefined;
		const length = items.length;
		if (!el) return;
		const prepended = prevFirst !== undefined && first !== prevFirst && length > prevLength;
		const appended = last !== undefined && last !== prevLast;
		prevFirst = first;
		prevLast = last;
		prevLength = length;
		const fromBottom = el.scrollHeight - el.scrollTop;
		tick().then(() => {
			if (prepended) {
				el.scrollTop = el.scrollHeight - fromBottom;
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
	<div class="feed" bind:this={scroller} {onscroll}>
		{#if loadMore}
			<LoadMore pill state={loadMore} onload={onloadmore} label={loadMoreLabel} />
		{/if}
		{#if items.length === 0 && empty}
			{@render empty()}
		{/if}
		<div class="feed-items" {@attach pin}>
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
		flex: 1;
		min-height: 0;
		overflow: auto;
		overscroll-behavior: contain;
		display: flex;
		flex-direction: column;
		gap: var(--sp-3);
		padding: var(--sp-3);
	}
	.feed-items {
		display: flex;
		flex-direction: column;
		gap: var(--sp-3);
	}
	.jump {
		position: absolute;
		inset-inline-start: 50%;
		bottom: var(--sp-3);
		transform: translateX(-50%);
		z-index: 1;
		border-radius: var(--r-pill);
		box-shadow: var(--shadow-md);
	}
</style>
