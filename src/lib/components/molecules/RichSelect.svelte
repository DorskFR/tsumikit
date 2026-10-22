<script lang="ts" module>
	export type RichSelectOptionContext<T> = {
		option: T;
		index: number;
		selected: boolean;
		active: boolean;
		/** True for the copy rendered inside the closed trigger. */
		inTrigger: boolean;
	};
</script>

<script lang="ts" generics="T">
	import { tick, type Snippet } from 'svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import { playSound } from '$lib/sound';
	import Popover from './Popover.svelte';
	import { createTypeahead, richSelectAction, typeaheadIndex } from './rich-select-keyboard.js';
	import { slotForTop } from './sortable-list-order.js';

	type Key = string | number;

	type Props = {
		options: readonly T[];
		/** Key of the selected option (`getKey`). */
		value?: Key;
		onchange?: (value: Key, option: T) => void;
		getKey?: (option: T) => Key;
		/** Text used by typeahead and announcements. */
		getLabel?: (option: T) => string;
		/** The card, rendered in the closed trigger and for every listbox row.
		 *  It sits inside the trigger button, so it must not contain controls. */
		option: Snippet<[RichSelectOptionContext<T>]>;
		/** Per-row actions beside the card. They never select the option. */
		trailing?: Snippet<[{ option: T; index: number; close: () => void }]>;
		footer?: Snippet<[{ close: () => void }]>;
		/** Enables the drag handles and Alt+ArrowUp/Down; reorder `options` in it. */
		onreorder?: (from: number, to: number) => void;
		placeholder?: Snippet | string;
		/** Accessible name of the select. */
		label: string;
		disabled?: boolean;
		box?: 'sm' | 'md' | 'lg';
		placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
		open?: boolean;
		/** Play UI sounds when enabled globally; false silences this instance. */
		sound?: boolean;
		/** Spoken after a keyboard reorder. */
		movedMessage?: (label: string, position: number, total: number) => string;
		class?: string;
		style?: string;
	};

	const fallbackKey = (o: T): Key => {
		const r = o as { id?: Key; value?: Key; key?: Key };
		return r?.key ?? r?.id ?? r?.value ?? String(o);
	};
	const fallbackLabel = (o: T): string => {
		const r = o as { label?: string; name?: string };
		return r?.label ?? r?.name ?? String(o);
	};

	let {
		options,
		value = $bindable(),
		onchange,
		getKey = fallbackKey,
		getLabel = fallbackLabel,
		option,
		trailing,
		footer,
		onreorder,
		placeholder = 'Select…',
		label,
		disabled = false,
		box = 'md',
		placement = 'bottom-start',
		open = $bindable(false),
		sound = true,
		movedMessage = (name, position, total) => `${name} moved to position ${position} of ${total}`,
		class: klass = '',
		style = '',
	}: Props = $props();

	const uid = Math.random().toString(36).slice(2, 8);
	const listId = `rs-list-${uid}`;
	const optionId = (i: number) => `rs-opt-${uid}-${i}`;

	let root = $state<HTMLDivElement | null>(null);
	let active = $state(-1);
	let announcement = $state('');
	let triggerWidth = $state(0);
	let dragFrom = $state(-1);
	let dragTo = $state(-1);
	let dragDy = $state(0);
	let dragHeight = 0;

	const selectedIndex = $derived(options.findIndex((o) => getKey(o) === value));
	const selectedOption = $derived(selectedIndex >= 0 ? options[selectedIndex] : undefined);
	const typeahead = createTypeahead();

	const triggerEl = () => root?.querySelector<HTMLElement>('.rs-trigger') ?? null;
	const rowEls = () => [...(root?.querySelectorAll<HTMLElement>('.rs-row') ?? [])];

	$effect(() => {
		const el = triggerEl();
		if (!el || typeof ResizeObserver === 'undefined') return;
		const ro = new ResizeObserver(() => (triggerWidth = el.offsetWidth));
		ro.observe(el);
		return () => ro.disconnect();
	});

	$effect(() => {
		triggerEl()?.setAttribute('role', 'combobox');
	});

	$effect(() => {
		if (!open) return;
		if (active < 0 || active >= options.length) active = selectedIndex >= 0 ? selectedIndex : 0;
	});

	$effect(() => {
		if (open && active >= 0) revealActive();
	});

	// Scrolls the listbox only: `scrollIntoView` on a top-layer panel also
	// scrolls the document in Chromium.
	function revealActive() {
		const list = root?.querySelector<HTMLElement>('.rs-list');
		const row = rowEls()[active];
		if (!list || !row) return;
		const top = row.offsetTop;
		const bottom = top + row.offsetHeight;
		if (top < list.scrollTop) list.scrollTop = top;
		else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
	}

	function close() {
		open = false;
	}

	function focusTrigger() {
		triggerEl()?.focus();
	}

	function choose(index: number, closeAfter: boolean) {
		const next = options[index];
		if (next === undefined) return;
		const key = getKey(next);
		active = index;
		if (key !== value) {
			value = key;
			onchange?.(key, next);
			playSound(closeAfter ? 'click' : 'tick', sound);
		}
		if (closeAfter) {
			close();
			focusTrigger();
		}
	}

	function reorder(from: number, to: number) {
		if (!onreorder || from === to) return;
		const moved = options[from];
		onreorder(from, to);
		active = to;
		if (moved !== undefined) announcement = movedMessage(getLabel(moved), to + 1, options.length);
		playSound('tick', sound);
	}

	function trailingFocusables(index: number) {
		const row = rowEls()[index];
		return [
			...(row?.querySelectorAll<HTMLElement>(
				'.rs-trailing :is(button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])):not(:disabled)'
			) ?? []),
		];
	}

	function onTriggerKey(e: KeyboardEvent) {
		const action = richSelectAction(e, {
			open,
			count: options.length,
			index: open ? active : selectedIndex,
			reorder: onreorder !== undefined,
			trailing: open && active >= 0 && trailingFocusables(active).length > 0,
		});
		if (!action) return;
		if (action.type === 'close' && e.key === 'Tab') {
			close();
			return;
		}
		e.preventDefault();
		e.stopPropagation();
		switch (action.type) {
			case 'open':
				active = selectedIndex >= 0 ? selectedIndex : 0;
				open = true;
				break;
			case 'close':
				close();
				focusTrigger();
				break;
			case 'select':
				choose(active, true);
				break;
			case 'move':
				active = action.index;
				break;
			case 'change':
				choose(action.index, false);
				break;
			case 'reorder':
				reorder(action.from, action.to);
				break;
			case 'trailing':
				trailingFocusables(active)[0]?.focus();
				break;
			case 'type': {
				const from = open ? active : selectedIndex;
				const hit = typeaheadIndex(options.map(getLabel), typeahead.push(action.char), from);
				if (hit === undefined) break;
				if (open) active = hit;
				else choose(hit, false);
				break;
			}
		}
	}

	function onPanelKey(e: KeyboardEvent, target: HTMLElement) {
		if (!target.closest('.rs-trailing')) {
			if (e.key === 'Escape') {
				e.preventDefault();
				e.stopPropagation();
				close();
				focusTrigger();
			}
			return;
		}
		const row = target.closest<HTMLElement>('.rs-row');
		const index = row ? rowEls().indexOf(row) : -1;
		const items = index >= 0 ? trailingFocusables(index) : [];
		const at = items.indexOf(target);
		const back = e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey && at <= 0);
		if (e.key === 'Escape' || back || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
			e.preventDefault();
			e.stopPropagation();
			if (e.key === 'ArrowLeft' && at > 0) {
				items[at - 1].focus();
				return;
			}
			if (e.key === 'Escape') close();
			else if (e.key === 'ArrowUp') active = Math.max(index - 1, 0);
			else if (e.key === 'ArrowDown') active = Math.min(index + 1, options.length - 1);
			focusTrigger();
			return;
		}
		if (e.key === 'ArrowRight' && at >= 0 && at < items.length - 1) {
			e.preventDefault();
			e.stopPropagation();
			items[at + 1].focus();
		}
	}

	function onKeydownCapture(e: KeyboardEvent) {
		if (disabled) return;
		const target = e.target as HTMLElement;
		if (target === triggerEl()) onTriggerKey(e);
		else if (target.closest('.rs-panel')) onPanelKey(e, target);
	}

	function onGripDown(e: PointerEvent, index: number) {
		if (!onreorder || e.button !== 0) return;
		e.preventDefault();
		const grip = e.currentTarget as HTMLElement;
		grip.setPointerCapture?.(e.pointerId);
		const rows = rowEls();
		const startY = e.clientY;
		const top = (rows[index]?.offsetTop ?? 0) - (rows[0]?.offsetTop ?? 0);
		const others = rows.filter((_, i) => i !== index).map((r) => r.offsetHeight);
		dragHeight = rows[index]?.offsetHeight ?? 0;
		dragFrom = index;
		dragTo = index;
		dragDy = 0;
		active = index;
		const move = (ev: PointerEvent) => {
			dragDy = ev.clientY - startY;
			dragTo = slotForTop(top + dragDy, others);
		};
		const end = (ev: PointerEvent) => {
			grip.removeEventListener('pointermove', move);
			grip.removeEventListener('pointerup', end);
			grip.removeEventListener('pointercancel', end);
			const from = dragFrom;
			const to = dragTo;
			dragFrom = -1;
			dragTo = -1;
			dragDy = 0;
			if (ev.type === 'pointerup') reorder(from, to);
		};
		grip.addEventListener('pointermove', move);
		grip.addEventListener('pointerup', end);
		grip.addEventListener('pointercancel', end);
	}

	function shiftFor(i: number) {
		if (dragFrom < 0) return undefined;
		if (i === dragFrom) return `0 ${dragDy}px`;
		if (dragFrom < i && i <= dragTo) return `0 ${-dragHeight}px`;
		if (dragTo <= i && i < dragFrom) return `0 ${dragHeight}px`;
		return undefined;
	}

	async function onOpen() {
		typeahead.reset();
		await tick();
		if (active >= 0) revealActive();
	}

	function onClose() {
		typeahead.reset();
		dragFrom = -1;
	}

	const panelStyle = $derived(
		triggerWidth > 0
			? `min-width: max(10rem, ${triggerWidth}px); max-width: min(max(22rem, ${triggerWidth}px), calc(100vw - 2 * var(--sp-3)))`
			: ''
	);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={root}
	data-tsu="RichSelect"
	class="rich-select box-{box} {klass}"
	class:is-disabled={disabled}
	class:is-dragging={dragFrom >= 0}
	class:is-open={open}
	{style}
	onkeydowncapture={onKeydownCapture}
>
	<Popover
		bind:open
		bare
		{label}
		{placement}
		{disabled}
		{sound}
		role="group"
		haspopup="listbox"
		triggerClass="rs-trigger"
		panelClass="rs-panel"
		{panelStyle}
		onopen={onOpen}
		onclose={onClose}
		aria-controls={listId}
		aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
	>
		{#snippet trigger()}
			<span class="rs-value">
				{#if selectedOption !== undefined}
					{@render option({ option: selectedOption, index: selectedIndex, selected: true, active: false, inTrigger: true })}
				{:else if typeof placeholder === 'string'}
					<span class="rs-placeholder">{placeholder}</span>
				{:else}
					{@render placeholder()}
				{/if}
			</span>
			<span class="rs-chevron" aria-hidden="true"><Icon name="chevron-down" /></span>
		{/snippet}
		<div class="rs-list" role="listbox" id={listId} aria-label={label}>
			{#each options as opt, i (getKey(opt))}
				{@const selected = i === selectedIndex}
				<div
					class="rs-row"
					role="presentation"
					data-active={i === active ? '' : undefined}
					data-selected={selected ? '' : undefined}
					data-dragging={i === dragFrom ? '' : undefined}
					style:translate={shiftFor(i)}
				>
					{#if onreorder}
						<span class="rs-grip" aria-hidden="true" onpointerdown={(e) => onGripDown(e, i)}></span>
					{/if}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="rs-option"
						role="option"
						id={optionId(i)}
						aria-selected={selected}
						tabindex="-1"
						onclick={() => choose(i, true)}
						onmousedown={(e) => e.preventDefault()}
						onpointermove={() => {
							if (dragFrom < 0) active = i;
						}}
					>
						{@render option({ option: opt, index: i, selected, active: i === active, inTrigger: false })}
					</div>
					{#if trailing}
						<div class="rs-trailing">{@render trailing({ option: opt, index: i, close })}</div>
					{/if}
				</div>
			{/each}
		</div>
		{#if footer}
			<div class="rs-footer">{@render footer({ close })}</div>
		{/if}
	</Popover>
	<span class="sr-only" aria-live="polite">{announcement}</span>
</div>

<style>
	.rich-select {
		display: block;
		min-width: 0;
		--rs-height: var(--control-md);
	}
	.rich-select.box-sm {
		--rs-height: var(--control-sm);
	}
	.rich-select.box-lg {
		--rs-height: var(--control-lg);
	}
	.rich-select :global(.pop-trigger.rs-trigger) {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		box-sizing: border-box;
		width: 100%;
		min-width: 0;
		min-height: var(--rs-height);
		padding: var(--sp-1) var(--sp-2) var(--sp-1) var(--sp-1);
		border: 1px solid var(--border-strong);
		border-radius: var(--r-md);
		background: var(--surface);
		color: var(--text);
		text-align: start;
		cursor: pointer;
		transition:
			border-color var(--dur-fast) var(--ease),
			scale var(--dur-fast) var(--ease-out);
	}
	.rich-select :global(.pop-trigger.rs-trigger:focus-visible) {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
	}
	.rich-select :global(.pop-trigger.rs-trigger:active:not(:disabled)) {
		scale: var(--press-scale-lg);
		transition-duration: var(--dur-press);
	}
	.rich-select :global(.pop-trigger.rs-trigger[aria-expanded='true']) {
		border-color: var(--accent);
	}
	.rich-select :global(.pop-trigger.rs-trigger:disabled) {
		opacity: var(--disabled-opacity);
		cursor: not-allowed;
	}
	@media (hover: hover) and (pointer: fine) {
		.rich-select :global(.pop-trigger.rs-trigger:hover:not(:disabled)) {
			border-color: var(--accent);
		}
	}
	.rs-value {
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
	}
	.rs-placeholder {
		display: block;
		color: var(--text-muted);
		font-size: var(--control-fs-md);
		line-height: var(--lh-tight);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.rs-chevron {
		display: inline-flex;
		flex: none;
		color: var(--text-muted);
		--icon-size: var(--control-icon-md);
		transition: rotate var(--dur-fast) var(--ease-out);
	}
	.rich-select.is-open .rs-chevron {
		rotate: 180deg;
	}
	.rich-select :global(.pop-panel.rs-panel) {
		display: flex;
		flex-direction: column;
		gap: var(--sp-1);
		box-sizing: border-box;
		max-height: min(70vh, 28rem);
		padding: var(--sp-1);
	}
	.rs-list {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--sp-0-5);
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
	}
	.rs-row {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--sp-1);
		min-height: var(--control-sm);
		border-radius: var(--r-sm);
		transition:
			background-color var(--dur-fast) var(--ease),
			translate var(--dur-fast) var(--ease-out);
	}
	.rs-row[data-active] {
		background: var(--bg-elevated-2);
		transition-duration: var(--dur-instant), var(--dur-fast);
	}
	.rs-row[data-selected] {
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}
	.rs-row[data-selected][data-active] {
		background: color-mix(in srgb, var(--accent) 18%, var(--bg-elevated-2));
	}
	.rs-row[data-selected]::before {
		content: '';
		position: absolute;
		inset-block: var(--sp-1);
		inset-inline-start: 0;
		width: 3px;
		border-radius: var(--r-pill);
		background: var(--accent);
	}
	.rs-row[data-dragging] {
		z-index: 1;
		box-shadow: var(--shadow-md);
		background: var(--bg-elevated);
		transition: none;
	}
	.rs-option {
		flex: 1 1 auto;
		min-width: 0;
		padding: var(--sp-1);
		border-radius: var(--r-sm);
		cursor: pointer;
		outline: none;
	}
	.rs-trailing {
		display: flex;
		flex: none;
		align-items: center;
		gap: var(--sp-1);
		padding-inline-end: var(--sp-1);
	}
	.rs-grip {
		flex: none;
		align-self: stretch;
		width: 24px;
		min-height: 24px;
		margin-inline-start: var(--sp-0-5);
		border-radius: var(--r-sm);
		display: grid;
		place-items: center;
		color: var(--text-muted);
		cursor: grab;
		touch-action: none;
		opacity: 0.6;
		transition: opacity var(--dur-fast) var(--ease);
	}
	.rs-grip::before {
		content: '';
		width: 10px;
		height: 16px;
		background: radial-gradient(circle, currentColor 1.5px, transparent 1.75px) 0 0 / 5px 5.333px;
	}
	@media (hover: hover) and (pointer: fine) {
		.rs-grip:hover {
			opacity: 1;
		}
	}
	.is-dragging .rs-grip {
		cursor: grabbing;
	}
	.rs-footer {
		flex: none;
		display: flex;
		flex-direction: column;
		padding-top: var(--sp-1);
		border-top: 1px solid var(--border);
	}
</style>
