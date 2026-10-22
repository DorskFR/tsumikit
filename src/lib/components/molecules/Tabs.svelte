<script lang="ts" module>
	export interface TabItem {
		id: string;
		label: string;
		icon?: import('$lib/components/atoms/Icon.svelte').IconName;
		/** Greyed out, not selectable, skipped by keyboard navigation. */
		disabled?: boolean;
		/** Trailing count badge. */
		count?: number | string;
		/** Hover text for the whole tab — the full document name behind a truncated label. */
		title?: string;
		/** Per-tab override of the strip's `closable` (pin one tab open). */
		closable?: boolean;
		/**
		 * Extra attributes for this tab's button — `data-*`, `title`…
		 * The tab's own semantics (`role`, `aria-*`, `id`, `class`, `disabled`,
		 * `tabindex`, `onclick`) are applied after and win.
		 */
		attrs?: import('svelte/elements').HTMLButtonAttributes;
	}
</script>

<script lang="ts">
	import Badge from '$lib/components/atoms/Badge.svelte';
	// WAI-ARIA tabs. A `tablist` of `tab`s controlling a single `tabpanel`.
	// Follows the automatic-activation pattern: ←/→ (and Home/End) move selection
	// and reveal the panel in one step; roving tabindex keeps exactly one tab in
	// the Tab order. `value` is bindable; `panel` is a snippet that receives the
	// active id so the caller renders the matching content.
	//
	// Without `panel` the tablist stands alone as a document strip: `closable`
	// tabs gain a close control, Delete and middle-click close the focused tab,
	// `leading` decorates each tab and `actions` trails the strip.
	import { tick } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import IconButton from '$lib/components/molecules/IconButton.svelte';
	import { playSound } from '$lib/sound';

	let {
		tabs,
		value = $bindable(),
		label = 'Tabs',
		panel,
		closable = false,
		onclose,
		closeLabel = 'Close tab',
		leading,
		actions,
		class: klass = '',
		style: styleProp = '',
		panelClass = '',
		panelPadding = 'md',
		sound = true,
		...rest
	}: Omit<HTMLAttributes<HTMLDivElement>, keyof Own> & Own = $props();

	type Own = {
		tabs: TabItem[];
		value?: string;
		label?: string;
		/** Content for the active tab. Omit it for a strip-only tablist. */
		panel?: Snippet<[string]>;
		/** Every tab gets a close control; Delete and middle-click close too. */
		closable?: boolean;
		/** Called with the tab id; the caller removes it from `tabs`. */
		onclose?: (id: string) => void;
		/** Accessible name of each close control. */
		closeLabel?: string;
		/** Rendered before the icon and label of every tab (a status dot, a number). */
		leading?: Snippet<[TabItem]>;
		/** Trailing controls after the strip (close all, new tab). */
		actions?: Snippet;
		class?: string;
		style?: string;
		panelClass?: string;
		panelPadding?: 'none' | 'sm' | 'md';
		/** Play UI sounds when enabled globally; false silences this instance. */
		sound?: boolean;
	};

	// Default to the first selectable tab when no value is supplied.
	$effect(() => {
		if (value === undefined) {
			const first = tabs.find((t) => !t.disabled);
			if (first) value = first.id;
		}
	});

	let listEl = $state<HTMLDivElement | null>(null);
	const baseId = `tabs-${Math.random().toString(36).slice(2, 8)}`;
	const panelId = $derived(panel ? `${baseId}-panel` : undefined);
	// The roving tab stop: the selected tab, or the first enabled one when the
	// selection is unknown or disabled, so the strip never drops out of the Tab order.
	const stop = $derived(
		tabs.find((t) => t.id === value && !t.disabled) ?? tabs.find((t) => !t.disabled)
	);
	const tabId = (id: string) => `${baseId}-tab-${id}`;

	function canClose(t: TabItem): boolean {
		return t.closable ?? closable;
	}

	// One indicator slides under the selected tab on translate/scale (never
	// width/left). It snaps on mount and on reflow, and only animates on a
	// selection change; until it is placed the selected tab draws its own line.
	let indicator = $state<HTMLSpanElement | null>(null);
	let placed = $state(false);
	let indLeft = 0;
	let indWidth = 0;
	function placeIndicator(animate: boolean) {
		const el = listEl?.querySelector<HTMLElement>('.tab.selected');
		const ind = indicator;
		if (!el || !ind) {
			placed = false;
			return;
		}
		const left = el.offsetLeft;
		const width = el.offsetWidth;
		const prevLeft = indLeft;
		const prevWidth = indWidth;
		indLeft = left;
		indWidth = width;
		ind.style.width = `${width}px`;
		const fx = getComputedStyle(ind).getPropertyValue('--tabs-fx').trim();
		const still = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
		if (!animate || !placed || width === 0 || still) {
			ind.style.transition = 'none';
			ind.style.translate = `${left}px 0`;
			ind.style.scale = '1 1';
			ind.getBoundingClientRect();
			ind.style.transition = '';
			placed = true;
			return;
		}
		if (fx === 'stretch' && typeof ind.animate === 'function') {
			const lo = Math.min(prevLeft, left);
			const hi = Math.max(prevLeft + prevWidth, left + width);
			const ease = (name: string) => getComputedStyle(ind).getPropertyValue(name).trim() || 'ease-out';
			ind.style.translate = `${left}px 0`;
			ind.style.scale = '1 1';
			ind.animate(
				[
					{ translate: `${prevLeft}px 0`, scale: `${prevWidth / width} 1`, easing: ease('--ease-out') },
					{ translate: `${lo}px 0`, scale: `${(hi - lo) / width} 1`, offset: 0.4, easing: ease('--ease-spring') },
					{ translate: `${left}px 0`, scale: '1 1' }
				],
				{ duration: 280 }
			);
			return;
		}
		ind.style.transition = 'none';
		ind.style.translate = `${prevLeft}px 0`;
		ind.style.scale = `${prevWidth / width} 1`;
		ind.getBoundingClientRect();
		ind.style.transition = '';
		ind.style.translate = `${left}px 0`;
		ind.style.scale = '1 1';
	}
	$effect(() => {
		value;
		tabs;
		tick().then(() => placeIndicator(true));
	});
	$effect(() => {
		if (!listEl || typeof ResizeObserver === 'undefined') return;
		const ro = new ResizeObserver(() => placeIndicator(false));
		ro.observe(listEl);
		return () => ro.disconnect();
	});

	function inkFrom(e: MouseEvent) {
		const el = e.currentTarget as HTMLElement;
		const r = el.getBoundingClientRect();
		const pointer = e.detail > 0;
		el.style.setProperty('--ink-x', pointer ? `${e.clientX - r.left}px` : '50%');
		el.style.setProperty('--ink-y', pointer ? `${e.clientY - r.top}px` : '50%');
	}

	function select(id: string, focus = false) {
		if (tabs.find((t) => t.id === id)?.disabled) return;
		if (value !== id) playSound('click', sound);
		value = id;
		queueMicrotask(() => {
			const el = listEl?.ownerDocument.getElementById(tabId(id));
			// The list scrolls when it is too narrow, so keyboard selection has to
			// bring the tab back into view or it moves somewhere unseen.
			el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
			if (focus) {
				el?.style.removeProperty('--ink-x');
				el?.style.removeProperty('--ink-y');
				el?.focus();
			}
		});
	}
	// Step to the next non-disabled tab in a direction, wrapping around.
	function step(from: number, dir: 1 | -1): number {
		for (let n = 1; n <= tabs.length; n++) {
			const j = (from + dir * n + tabs.length * n) % tabs.length;
			if (!tabs[j].disabled) return j;
		}
		return from;
	}
	// Closing the selected tab hands selection to a neighbour first, so the
	// caller's removal never leaves the strip without a tabbable tab.
	function close(id: string, focus = false) {
		const i = tabs.findIndex((t) => t.id === id);
		if (i < 0 || !canClose(tabs[i])) return;
		if (value === id) {
			const others = tabs.filter((t) => t.id !== id && !t.disabled);
			const next = others.find((t) => tabs.indexOf(t) > i) ?? others.at(-1);
			if (next) select(next.id, focus);
			else value = undefined;
		}
		onclose?.(id);
	}
	function onauxclick(e: MouseEvent, id: string) {
		if (e.button !== 1) return;
		e.preventDefault();
		close(id);
	}
	function onkeydown(e: KeyboardEvent) {
		const i = stop ? tabs.indexOf(stop) : -1;
		if (i < 0) return;
		if (e.key === 'Delete') {
			if (!canClose(tabs[i])) return;
			e.preventDefault();
			close(tabs[i].id, true);
			return;
		}
		let next = i;
		if (e.key === 'ArrowRight') next = step(i, 1);
		else if (e.key === 'ArrowLeft') next = step(i, -1);
		else if (e.key === 'Home') next = tabs.findIndex((t) => !t.disabled);
		else if (e.key === 'End') next = tabs.length - 1 - [...tabs].reverse().findIndex((t) => !t.disabled);
		else return;
		e.preventDefault();
		select(tabs[next].id, true);
	}
</script>

{#snippet body(t: TabItem)}
	{#if leading}{@render leading(t)}{/if}
	{#if t.icon}<Icon name={t.icon} />{/if}
	<span class="label">{t.label}</span>
	{#if t.count !== undefined}<Badge size="sm" tone={value === t.id ? 'accent' : 'neutral'}>{t.count}</Badge>{/if}
{/snippet}

<div {...rest} class="tabs {klass}" style={styleProp} data-tsu="Tabs">
	<div class="strip">
		<div bind:this={listEl} role="tablist" aria-label={label} tabindex="-1" class="tablist" class:placed {onkeydown}>
				<span bind:this={indicator} class="indicator" aria-hidden="true"></span>
			{#each tabs as t (t.id)}
				{#if canClose(t)}
					<!-- A close control cannot nest inside a <button>, so a closable tab is a div. -->
					<div
						{...t.attrs as HTMLAttributes<HTMLDivElement>}
						role="tab"
						id="{baseId}-tab-{t.id}"
						title={t.title ?? t.attrs?.title}
						aria-selected={value === t.id}
						aria-controls={panelId}
						aria-disabled={t.disabled || undefined}
						tabindex={stop?.id === t.id ? 0 : -1}
						class="tab closable"
						class:selected={value === t.id}
						class:disabled={t.disabled}
						onclick={(e) => {
							inkFrom(e);
							select(t.id);
						}}
						onauxclick={(e) => onauxclick(e, t.id)}
					>
						{@render body(t)}
						<IconButton
							icon="x"
							label={closeLabel}
							inline
							hoverDanger
							size={14}
							hitArea="compact"
							tabindex={-1}
							disabled={t.disabled}
							onclick={(e) => {
								e.stopPropagation();
								close(t.id);
							}}
						/>
					</div>
				{:else}
					<button
						type="button"
						{...t.attrs}
						role="tab"
						id="{baseId}-tab-{t.id}"
						title={t.title ?? t.attrs?.title}
						aria-selected={value === t.id}
						aria-controls={panelId}
						disabled={t.disabled}
						tabindex={stop?.id === t.id ? 0 : -1}
						class="tab"
						class:selected={value === t.id}
						onclick={(e) => {
							inkFrom(e);
							select(t.id);
						}}
					>
						{@render body(t)}
					</button>
				{/if}
			{/each}
		</div>
		{#if actions}
			<div class="actions">{@render actions()}</div>
		{/if}
	</div>
	{#if panel}
		<div role="tabpanel" id={panelId} aria-labelledby={value === undefined ? undefined : tabId(value)} tabindex="0" class="tabpanel {panelClass}" class:pad-none={panelPadding === 'none'} class:pad-sm={panelPadding === 'sm'}>
			{#if value !== undefined}{@render panel(value)}{/if}
		</div>
	{/if}
</div>

<style>
	.strip {
		display: flex;
		align-items: stretch;
	}
	.tablist {
		position: relative;
		display: flex;
		flex: 1 1 auto;
		min-width: 0;
		gap: var(--sp-1);
		border-bottom: var(--edge-width) solid var(--surface-edge);
		overflow-x: auto;
		overflow-y: hidden;
		scrollbar-width: thin;
	}
	.indicator {
		position: absolute;
		left: 0;
		bottom: 0;
		width: 0;
		height: 2px;
		background: var(--accent);
		transform-origin: left center;
		pointer-events: none;
		transition:
			translate var(--dur-spring) var(--ease-spring),
			scale var(--dur-spring) var(--ease-spring);
	}
	.tab {
		display: inline-flex;
		flex: 0 0 auto;
		white-space: nowrap;
		align-items: center;
		gap: var(--sp-2);
		min-height: var(--control-md);
		padding: 0 var(--control-px-md);
		border: none;
		background: none;
		color: var(--text-muted);
		font-size: var(--control-fs-md);
		font-weight: var(--fw-medium);
		--icon-size: var(--control-icon-md);
		border-bottom: 2px solid transparent;
		margin-bottom: calc(-1 * var(--edge-width));
		max-width: var(--tab-max-width, none);
		transition:
			color var(--dur-fast) var(--ease),
			border-color var(--dur-fast) var(--ease);
	}
	.tab.closable {
		cursor: pointer;
		padding-inline-end: var(--sp-2);
		user-select: none;
	}
	@media (hover: hover) and (pointer: fine) {
		.tab:hover:not(:disabled, .disabled) {
			color: var(--text);
		}
	}
	.tab:disabled,
	.tab.disabled {
		opacity: var(--disabled-opacity);
		cursor: not-allowed;
	}
	.tab.selected {
		color: var(--accent);
	}
	.tablist:not(.placed) .tab.selected {
		border-bottom-color: var(--accent);
	}
	/* The list clips its overflow, so the ring sits inside the tab. */
	.tab:focus-visible {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset-inset);
	}
	.label {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.actions {
		display: flex;
		flex: 0 0 auto;
		align-items: center;
		gap: var(--sp-1);
		padding-inline-start: var(--sp-2);
		border-bottom: var(--edge-width) solid var(--surface-edge);
	}
	.tabpanel {
		padding-top: var(--sp-4);
	}
	.tabpanel.pad-sm {
		padding-top: var(--sp-2);
	}
	.tabpanel.pad-none {
		padding-top: 0;
	}
	.tabpanel:focus-visible {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
		border-radius: var(--r-sm);
	}

	/* Sliding pill: a raised pill glides behind the selected tab with a slight overshoot. */
	.tabs:not(:global([data-fx-tabs]:not([data-fx-tabs='pill'])) *),
	:global([data-fx-tabs='pill']) .tabs:not(:global([data-fx-tabs='pill'] [data-fx-tabs]:not([data-fx-tabs='pill'])) *) {
		--tabs-fx: pill;
		& .tablist {
			isolation: isolate;
			flex: 0 1 auto;
			padding: 3px;
			border-bottom: 0;
			border-radius: var(--r-pill);
			background: var(--surface-fill-2);
			box-shadow: inset 0 0 0 var(--edge-width) var(--surface-edge);
		}
		& .actions {
			border-bottom: 0;
		}
		& .tab {
			min-height: calc(var(--control-md) - 6px);
			margin-bottom: 0;
			border-bottom: 0;
			border-radius: var(--r-pill);
		}
		& .tab.selected {
			color: var(--text);
		}
		& .tablist:not(.placed) .tab.selected {
			background: var(--surface);
		}
		& .tab.selected:focus-visible {
			outline: none;
		}
		& .indicator {
			top: 3px;
			bottom: 3px;
			z-index: -1;
			height: auto;
			border-radius: var(--r-pill);
			background: var(--surface);
			box-shadow:
				0 0 0 var(--edge-width) color-mix(in srgb, var(--accent) 35%, var(--surface-edge)),
				0 1px 3px color-mix(in srgb, var(--text) 14%, transparent);
			transition-timing-function: var(--ease-spring-bounce);
		}
		& .tablist:has(.tab.selected:focus-visible) .indicator {
			box-shadow:
				0 0 0 2px var(--accent),
				0 1px 3px color-mix(in srgb, var(--text) 14%, transparent);
		}
	}
	/* Stretch line: the script stretches the line across both tabs, then lets the tail catch up. */
	:global([data-fx-tabs='stretch']) .tabs:not(:global([data-fx-tabs='stretch'] [data-fx-tabs]:not([data-fx-tabs='stretch'])) *) {
		--tabs-fx: stretch;
	}
	/* Ink blot: a tint spreads from the click point and a short mark springs in under the label. */
	:global([data-fx-tabs='ink']) .tabs:not(:global([data-fx-tabs='ink'] [data-fx-tabs]:not([data-fx-tabs='ink'])) *) {
		--tabs-fx: ink;
		& .indicator {
			display: none;
		}
		& .tab {
			position: relative;
			isolation: isolate;
			overflow: hidden;
			border-radius: var(--r-md) var(--r-md) 0 0;
		}
		& .tab::before,
		& .tab::after {
			content: '';
			position: absolute;
			pointer-events: none;
		}
		& .tab::before {
			left: var(--ink-x, 50%);
			top: var(--ink-y, 50%);
			z-index: -1;
			width: 260%;
			aspect-ratio: 1;
			translate: -50% -50%;
			border-radius: var(--r-pill);
			background: radial-gradient(
				circle closest-side,
				color-mix(in srgb, var(--accent) 22%, transparent) 0 55%,
				color-mix(in srgb, var(--accent) 14%, transparent) 80%,
				transparent
			);
			scale: 0;
			opacity: 0;
			transition-property: opacity, scale;
			transition-duration: var(--dur-exit), var(--dur-instant);
			transition-delay: var(--dur-instant), var(--dur-exit);
			transition-timing-function: ease;
		}
		& .tab.selected::before {
			scale: 1;
			opacity: 1;
			transition-duration: var(--dur-fast), var(--dur-slow);
			transition-delay: var(--dur-instant);
			transition-timing-function: ease, var(--ease-out);
		}
		& .tab::after {
			inset: auto 30% 4px;
			height: 2px;
			border-radius: var(--r-xs);
			background: var(--accent);
			opacity: 0;
			scale: 0.2 1;
			transition-property: opacity, scale;
			transition-duration: var(--dur-exit-fast);
		}
		& .tab.selected::after {
			opacity: 1;
			scale: 1 1;
			transition-duration: var(--dur-fast), var(--dur-spring);
			transition-timing-function: ease, var(--ease-spring-bounce);
		}
	}
</style>
