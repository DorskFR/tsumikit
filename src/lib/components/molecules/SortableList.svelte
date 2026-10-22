<script lang="ts" module>
	export interface SortableListMove {
		key: string;
		from: number;
		to: number;
	}
	export interface SortableListRowContext {
		index: number;
		grabbed: boolean;
		selected: boolean;
	}
	/** Accessible strings. `pos` is 1-based. */
	export interface SortableListMessages {
		instructions: string;
		reorder: (name: string) => string;
		moveUp: (name: string) => string;
		moveDown: (name: string) => string;
		grabbed: (name: string, pos: number, total: number) => string;
		moved: (name: string, pos: number, total: number) => string;
		dropped: (name: string, pos: number, total: number) => string;
		cancelled: (name: string, pos: number, total: number) => string;
	}
	export const SORTABLE_LIST_MESSAGES: SortableListMessages = {
		instructions:
			'Press Space or Enter to pick the row up. Use the arrow keys to move it, Home or End to jump to an end, Space or Enter to drop it and Escape to cancel. Alt with an arrow key moves a row one step.',
		reorder: (name) => `Reorder ${name}`,
		moveUp: (name) => `Move ${name} up`,
		moveDown: (name) => `Move ${name} down`,
		grabbed: (name, pos, total) => `Grabbed ${name}, position ${pos} of ${total}.`,
		moved: (name, pos, total) => `${name}, position ${pos} of ${total}.`,
		dropped: (name, pos, total) => `Dropped ${name} at position ${pos} of ${total}.`,
		cancelled: (name, pos, total) => `Cancelled. ${name} is back at position ${pos} of ${total}.`
	};
</script>

<script lang="ts" generics="T">
	/**
	 * Reorderable list. The consumer owns the order: `onreorder` reports the new
	 * key list, the list shows it until `items` changes or `revertAfter` ms pass.
	 * Drag runs on Pointer Events (touch included); the grip is also a keyboard
	 * grab button and the arrows move one step.
	 */
	import { tick, type Snippet } from 'svelte';
	import { flip } from 'svelte/animate';
	import type { HTMLAttributes } from 'svelte/elements';
	import IconButton from '$lib/components/molecules/IconButton.svelte';
	import {
		edgeScroll,
		edgeTarget,
		grabbedAction,
		moveItem,
		sameKeys,
		slotForTop,
		stepTarget
	} from './sortable-list-order.js';

	type Own = {
		items: T[];
		key: (item: T) => string;
		/** Row content; the kit renders the grip, ordinal and arrows around it. */
		row: Snippet<[T, SortableListRowContext]>;
		/** Interactive row extras (go, skip), kept outside the selectable body. */
		trailing?: Snippet<[T, SortableListRowContext]>;
		/** Fires on drop or an arrow press with the full new key order. */
		onreorder?: (keys: string[], move: SortableListMove) => void;
		/** Veto a target index for a key. */
		canMove?: (key: string, to: number) => boolean;
		/** A locked row has no grip and disabled arrows. */
		locked?: (item: T) => boolean;
		/** Accessible row name used in labels and announcements. Defaults to the key. */
		name?: (item: T) => string;
		arrows?: boolean;
		numbered?: boolean;
		selected?: string;
		onselect?: (key: string) => void;
		/** Render the row body as a select button. Defaults to on when `onselect` or `selected` is given. */
		selectable?: boolean;
		/** `row` drags from anywhere on the row; touch then needs a 250 ms long-press. */
		handle?: 'grip' | 'row';
		size?: 'sm' | 'md';
		label: string;
		messages?: Partial<SortableListMessages>;
		as?: 'ol' | 'ul';
		/** Ms the optimistic order is kept when `items` is not updated. */
		revertAfter?: number;
		class?: string;
		style?: string;
	};

	let {
		items,
		key: keyOf,
		row,
		trailing,
		onreorder,
		canMove,
		locked,
		name,
		arrows = true,
		numbered = false,
		selected = $bindable(),
		onselect,
		selectable,
		handle = 'grip',
		size = 'md',
		label,
		messages,
		as = 'ol',
		revertAfter = 3000,
		class: klass = '',
		style: styleProp,
		...rest
	}: Omit<HTMLAttributes<HTMLDivElement>, keyof Own> & Own = $props();

	const LONG_PRESS_MS = 250;
	const uid = `sortable-${Math.random().toString(36).slice(2, 8)}`;
	const msgs = $derived({ ...SORTABLE_LIST_MESSAGES, ...messages });
	const canSelect = $derived(selectable ?? (onselect !== undefined || selected !== undefined));

	let pending = $state.raw<{ keys: string[]; base: T[] } | null>(null);
	let draft = $state.raw<string[] | null>(null);
	let grabKey = $state<string | null>(null);
	let mode = $state<'keyboard' | 'pointer' | null>(null);
	let dragOffset = $state(0);
	let announcement = $state('');
	let motion = $state(false);
	let listEl = $state<HTMLElement | null>(null);

	const byKey = $derived(new Map(items.map((item) => [keyOf(item), item])));
	const baseKeys = $derived(items.map(keyOf));
	const pendingKeys = $derived(
		pending && pending.base === items && sameKeys(pending.keys, baseKeys) ? pending.keys : null
	);
	const orderKeys = $derived(
		draft && sameKeys(draft, baseKeys) ? draft : (pendingKeys ?? baseKeys)
	);
	const rows = $derived(orderKeys.map((k) => byKey.get(k) as T));
	const total = $derived(rows.length);

	let grabFrom = 0;
	let revertTimer: ReturnType<typeof setTimeout> | undefined;
	let suppressClick = false;

	const nameOf = (k: string) => {
		const item = byKey.get(k);
		return item !== undefined && name ? name(item) : k;
	};
	const isLocked = (item: T) => locked?.(item) ?? false;
	const allowedFor = (k: string) => (to: number) => canMove?.(k, to) ?? true;

	$effect(() => {
		const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
		const update = () => {
			motion = !!mq && !mq.matches && typeof Element.prototype.animate === 'function';
		};
		update();
		mq?.addEventListener('change', update);
		return () => {
			mq?.removeEventListener('change', update);
			clearTimeout(revertTimer);
			endPress();
		};
	});

	$effect(() => {
		const el = listEl;
		if (!el) return;
		const block = (e: TouchEvent) => {
			if (mode === 'pointer') e.preventDefault();
		};
		el.addEventListener('touchmove', block, { passive: false });
		return () => el.removeEventListener('touchmove', block);
	});

	function announce(text: string) {
		announcement = text;
	}

	function commit(k: string, from: number, to: number, keys: string[]) {
		pending = { keys, base: items };
		clearTimeout(revertTimer);
		revertTimer = setTimeout(() => (pending = null), revertAfter);
		onreorder?.(keys, { key: k, from, to });
	}

	function rowEl(k: string): HTMLElement | undefined {
		for (const el of listEl?.children ?? []) {
			if ((el as HTMLElement).dataset.key === k) return el as HTMLElement;
		}
		return undefined;
	}

	async function refocus(k: string, part: string) {
		await tick();
		const el = rowEl(k);
		const pick = (p: string) =>
			el?.querySelector<HTMLButtonElement>(`[data-part="${p}"]:not(:disabled)`);
		const target =
			pick(part) ?? (part === 'up' ? pick('down') : part === 'down' ? pick('up') : null) ?? pick('grip');
		target?.focus();
	}

	function step(k: string, dir: 1 | -1, part: string) {
		if (mode !== null) return;
		const keys = orderKeys;
		const from = keys.indexOf(k);
		const item = byKey.get(k);
		if (from < 0 || item === undefined || isLocked(item)) return;
		const to = stepTarget(from, keys.length, dir, allowedFor(k));
		if (to === undefined) return;
		const next = moveItem(keys, from, to);
		commit(k, from, to, next);
		announce(msgs.moved(nameOf(k), to + 1, next.length));
		refocus(k, part);
	}

	function grab(k: string, how: 'keyboard' | 'pointer') {
		draft = [...orderKeys];
		grabFrom = draft.indexOf(k);
		grabKey = k;
		mode = how;
		announce(msgs.grabbed(nameOf(k), grabFrom + 1, draft.length));
	}

	function release() {
		draft = null;
		grabKey = null;
		mode = null;
		dragOffset = 0;
	}

	function drop() {
		const k = grabKey;
		const keys = draft;
		if (k === null || keys === null) return release();
		const to = keys.indexOf(k);
		if (sameKeys(keys, baseKeys) && to !== grabFrom) commit(k, grabFrom, to, keys);
		release();
		announce(msgs.dropped(nameOf(k), to + 1, keys.length));
	}

	function cancel() {
		const k = grabKey;
		release();
		if (k !== null) announce(msgs.cancelled(nameOf(k), grabFrom + 1, total));
	}

	function moveDraft(k: string, to: number | undefined) {
		if (!draft || to === undefined) return;
		const from = draft.indexOf(k);
		if (to === from) return;
		draft = moveItem(draft, from, to);
		announce(msgs.moved(nameOf(k), to + 1, draft.length));
	}

	function onGripKeydown(e: KeyboardEvent, k: string) {
		if (mode === 'pointer') return;
		if (grabKey !== k) {
			if (e.key === ' ' || e.key === 'Enter') {
				e.preventDefault();
				grab(k, 'keyboard');
			}
			return;
		}
		const action = grabbedAction(e.key);
		if (!action || !draft) return;
		e.preventDefault();
		e.stopPropagation();
		const from = draft.indexOf(k);
		const allowed = allowedFor(k);
		if (action === 'drop') drop();
		else if (action === 'cancel') cancel();
		else if (action === 'up') moveDraft(k, stepTarget(from, draft.length, -1, allowed));
		else if (action === 'down') moveDraft(k, stepTarget(from, draft.length, 1, allowed));
		else moveDraft(k, edgeTarget(from, draft.length, action, allowed));
		refocus(k, 'grip');
	}

	function onRowKeydown(e: KeyboardEvent, k: string) {
		if (!e.altKey || mode !== null) return;
		if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
		e.preventDefault();
		const part = (document.activeElement as HTMLElement | null)?.dataset.part ?? 'grip';
		step(k, e.key === 'ArrowUp' ? -1 : 1, part);
	}

	function onfocusout() {
		if (mode !== 'keyboard') return;
		setTimeout(() => {
			if (mode !== 'keyboard' || grabKey === null) return;
			const grip = rowEl(grabKey)?.querySelector('[data-part="grip"]');
			if (document.activeElement !== grip) cancel();
		}, 0);
	}

	type Press = {
		id: number;
		key: string;
		x: number;
		y: number;
		lastY: number;
		started: boolean;
		timer?: ReturnType<typeof setTimeout>;
		grabOffset: number;
		heights: Map<string, number>;
		origin: number;
		scroller: HTMLElement | null;
		frame?: number;
	};
	let press: Press | null = null;

	function onRowPointerdown(e: PointerEvent, k: string, item: T) {
		if (mode !== null || isLocked(item)) return;
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		const target = e.target as HTMLElement;
		if (target.closest('[data-part="arrows"], [data-part="trailing"]')) return;
		const fromGrip = target.closest('[data-part="grip"]') !== null;
		if (handle === 'grip' && !fromGrip) return;
		endPress();
		press = {
			id: e.pointerId,
			key: k,
			x: e.clientX,
			y: e.clientY,
			lastY: e.clientY,
			started: false,
			grabOffset: 0,
			heights: new Map(),
			origin: 0,
			scroller: null
		};
		if (e.pointerType === 'touch' && !fromGrip) {
			press.timer = setTimeout(() => {
				if (press) {
					press.timer = undefined;
					startDrag();
				}
			}, LONG_PRESS_MS);
		}
		addEventListener('pointermove', onPointermove);
		addEventListener('pointerup', onPointerup);
		addEventListener('pointercancel', onPointercancel);
		addEventListener('keydown', onDragKeydown);
	}

	function scrollerOf(el: HTMLElement): HTMLElement | null {
		for (let p = el.parentElement; p; p = p.parentElement) {
			const oy = getComputedStyle(p).overflowY;
			if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight) return p;
		}
		return null;
	}

	function startDrag() {
		if (!press || !listEl) return;
		const listTop = listEl.getBoundingClientRect().top;
		let first: number | undefined;
		for (const el of listEl.children) {
			const li = el as HTMLElement;
			const r = li.getBoundingClientRect();
			first ??= r.top;
			press.heights.set(li.dataset.key ?? '', r.height);
			if (li.dataset.key === press.key) press.grabOffset = press.y - r.top;
		}
		press.origin = (first ?? listTop) - listTop;
		press.scroller = scrollerOf(listEl);
		press.started = true;
		grab(press.key, 'pointer');
		autoScroll();
	}

	function layout() {
		if (!press || !listEl || !draft) return;
		const k = press.key;
		const y = press.lastY - listEl.getBoundingClientRect().top - press.origin;
		const top = y - press.grabOffset;
		const others = draft.filter((x) => x !== k);
		const slot = slotForTop(top, others.map((x) => press?.heights.get(x) ?? 0));
		if (slot !== draft.indexOf(k) && allowedFor(k)(slot)) moveDraft(k, slot);
		let slotTop = 0;
		for (const x of draft) {
			if (x === k) break;
			slotTop += press.heights.get(x) ?? 0;
		}
		dragOffset = top - slotTop;
	}

	function autoScroll() {
		if (!press?.started || typeof requestAnimationFrame !== 'function') return;
		const sc = press.scroller;
		const doc = document.scrollingElement as HTMLElement | null;
		const box = sc ? sc.getBoundingClientRect() : { top: 0, bottom: innerHeight };
		const v = edgeScroll(press.lastY, box.top, box.bottom);
		const el = sc ?? doc;
		if (v !== 0 && el) {
			const before = el.scrollTop;
			el.scrollTop = before + v;
			if (el.scrollTop !== before) layout();
		}
		press.frame = requestAnimationFrame(autoScroll);
	}

	function onPointermove(e: PointerEvent) {
		if (!press || e.pointerId !== press.id) return;
		press.lastY = e.clientY;
		if (!press.started) {
			const dist = Math.hypot(e.clientX - press.x, e.clientY - press.y);
			if (press.timer !== undefined) {
				if (dist > 8) endPress();
				return;
			}
			if (dist < 4) return;
			startDrag();
		}
		e.preventDefault();
		layout();
	}

	function onPointerup(e: PointerEvent) {
		if (!press || e.pointerId !== press.id) return;
		const started = press.started;
		endPress();
		if (!started) return;
		suppressClick = true;
		setTimeout(() => (suppressClick = false), 0);
		drop();
	}

	function onPointercancel(e: PointerEvent) {
		if (!press || e.pointerId !== press.id) return;
		const started = press.started;
		endPress();
		if (started) cancel();
	}

	function onDragKeydown(e: KeyboardEvent) {
		if (e.key !== 'Escape' || !press) return;
		e.preventDefault();
		const started = press.started;
		endPress();
		if (started) cancel();
	}

	function endPress() {
		if (press) {
			clearTimeout(press.timer);
			if (press.frame !== undefined) cancelAnimationFrame(press.frame);
		}
		press = null;
		if (typeof removeEventListener !== 'function') return;
		removeEventListener('pointermove', onPointermove);
		removeEventListener('pointerup', onPointerup);
		removeEventListener('pointercancel', onPointercancel);
		removeEventListener('keydown', onDragKeydown);
	}

	function choose(k: string) {
		if (suppressClick) return;
		selected = k;
		onselect?.(k);
	}
</script>

<div
	{...rest}
	class="sortable sortable-{size} {klass}"
	class:dragging={mode === 'pointer'}
	class:handle-row={handle === 'row'}
	style={styleProp}
	data-tsu="SortableList"
	{onfocusout}
>
	<svelte:element this={as} bind:this={listEl} class="sl-list" role="list" aria-label={label}>
		{#each rows as item, i (keyOf(item))}
			{@const k = keyOf(item)}
			{@const ctx = { index: i, grabbed: grabKey === k, selected: selected === k }}
			{@const fixed = isLocked(item)}
			{@const lifted = mode === 'pointer' && grabKey === k}
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<li
				class="sl-row"
				class:locked={fixed}
				class:selected={ctx.selected}
				class:grabbed={ctx.grabbed}
				class:lifted
				data-key={k}
				animate:flip={{ duration: motion && !lifted ? 160 : 0 }}
				onpointerdown={(e) => onRowPointerdown(e, k, item)}
				onkeydown={(e) => onRowKeydown(e, k)}
				oncontextmenu={(e) => {
					if (handle === 'row' && press) e.preventDefault();
				}}
			>
				<div class="sl-lift" style:transform={lifted ? `translateY(${dragOffset}px)` : undefined}>
					{#if fixed}
						<span class="sl-grip-spacer" aria-hidden="true"></span>
					{:else}
						<button
							type="button"
							class="sl-grip"
							data-part="grip"
							aria-label={msgs.reorder(nameOf(k))}
							aria-describedby="{uid}-help"
							aria-pressed={ctx.grabbed}
							onkeydown={(e) => onGripKeydown(e, k)}
						></button>
					{/if}
					{#if numbered}
						<span class="sl-ordinal" aria-hidden="true">{i + 1}</span>
					{/if}
					{#if canSelect}
						<button
							type="button"
							class="sl-body"
							data-part="body"
							aria-current={ctx.selected ? 'true' : undefined}
							onclick={() => choose(k)}
						>
							{@render row(item, ctx)}
						</button>
					{:else}
						<div class="sl-body">{@render row(item, ctx)}</div>
					{/if}
					{#if trailing}
						<span class="sl-trailing" data-part="trailing">{@render trailing(item, ctx)}</span>
					{/if}
					{#if arrows}
						<span class="sl-arrows" data-part="arrows">
							<IconButton
								icon="chevron-up"
								label={msgs.moveUp(nameOf(k))}
								box="xs"
								size={14}
								data-part="up"
								disabled={fixed || stepTarget(i, total, -1, allowedFor(k)) === undefined}
								onclick={() => step(k, -1, 'up')}
							/>
							<IconButton
								icon="chevron-down"
								label={msgs.moveDown(nameOf(k))}
								box="xs"
								size={14}
								data-part="down"
								disabled={fixed || stepTarget(i, total, 1, allowedFor(k)) === undefined}
								onclick={() => step(k, 1, 'down')}
							/>
						</span>
					{/if}
				</div>
			</li>
		{/each}
	</svelte:element>
	<span id="{uid}-help" hidden>{msgs.instructions}</span>
	<div class="sl-live" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
</div>

<style>
	.sortable {
		position: relative;
		min-width: 0;
	}
	.sl-list {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.dragging {
		user-select: none;
		-webkit-user-select: none;
		cursor: grabbing;
	}
	.sl-row {
		position: relative;
		border-bottom: var(--edge-width) solid var(--surface-edge);
	}
	.sl-row:last-child {
		border-bottom: 0;
	}
	.sl-lift {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		min-height: var(--sortable-row-h, 2.25rem);
		padding-inline-end: var(--sp-1);
		border-radius: var(--r-sm);
		background: transparent;
		transition:
			transform var(--dur-base) var(--ease),
			box-shadow var(--dur-base) var(--ease);
	}
	.sortable-sm .sl-lift {
		min-height: var(--sortable-row-h, 1.875rem);
	}
	.sl-row.selected {
		background: color-mix(in srgb, var(--accent) 10%, transparent);
		box-shadow: inset 2px 0 0 var(--accent);
	}
	.sl-row.grabbed .sl-lift {
		background: var(--bg-elevated-2);
		outline: 1px solid var(--accent);
		outline-offset: -1px;
	}
	.sl-row.lifted {
		background: color-mix(in srgb, var(--accent) 6%, transparent);
		outline: 1px dashed var(--accent);
		outline-offset: -1px;
	}
	.sl-row.lifted .sl-lift {
		position: relative;
		z-index: 1;
		background: var(--bg-elevated-2);
		box-shadow: var(--raised-shadow);
		transition: none;
	}
	.sl-grip,
	.sl-grip-spacer {
		flex: none;
		align-self: stretch;
		width: 1.25rem;
	}
	.sl-grip {
		position: relative;
		padding: 0;
		border: 0;
		border-radius: var(--r-sm);
		color: var(--text-faint);
		background: none;
		cursor: grab;
		touch-action: none;
	}
	.sl-grip::before {
		content: '';
		position: absolute;
		inset: 50% auto auto 50%;
		width: 10px;
		height: 15px;
		translate: -50% -50%;
		background: radial-gradient(circle, currentColor 1px, transparent 1.5px) 0 0 / 5px 5px;
	}
	@media (hover: hover) and (pointer: fine) {
		.sl-grip:hover {
			color: var(--accent);
		}
	}
	.sl-grip[aria-pressed='true'] {
		color: var(--accent);
	}
	.sl-grip:focus-visible {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset-inset);
	}
	.handle-row .sl-row:not(.locked) {
		cursor: grab;
		-webkit-touch-callout: none;
	}
	.sl-ordinal {
		flex: none;
		min-width: 1.5em;
		color: var(--text-faint);
		font-size: var(--fs-sm);
		font-variant-numeric: tabular-nums;
		text-align: end;
	}
	.sl-body {
		flex: 1 1 auto;
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		min-width: 0;
		align-self: stretch;
		padding: 0;
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		text-align: start;
	}
	button.sl-body {
		cursor: pointer;
	}
	button.sl-body:focus-visible {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset-inset);
		border-radius: var(--r-sm);
	}
	.sl-row.selected button.sl-body {
		color: var(--accent);
	}
	.sl-trailing,
	.sl-arrows {
		flex: none;
		display: inline-flex;
		align-items: center;
		gap: var(--sp-0-5);
	}
	.sl-live {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
		border: 0;
	}
	@media (pointer: coarse) {
		.sl-grip,
		.sl-grip-spacer {
			width: var(--touch-target);
		}
		.sl-grip::after {
			content: '';
			position: absolute;
			inset-block: min(0px, calc((100% - var(--touch-target)) / 2));
			inset-inline: 0;
		}
	}
</style>
