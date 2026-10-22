<script lang="ts" module>
	export interface SegmentOption {
		value: string;
		/** Visible text. Optional in `icon` mode where the icon carries the meaning. */
		label?: string;
		/** Optional count badge rendered after the label (filter-pill use). Numbers
		 *  get thousands separators (`11178` → `11,178`, fixed en-US so SSR and
		 *  hydration agree); strings render verbatim (`'99+'`, another locale). */
		count?: number | string;
		/** Icon glyph — required for icon-toggle mode, optional alongside a label. */
		icon?: import('$lib/components/atoms/Icon.svelte').IconName;
		/** Greyed out, not selectable, skipped by keyboard navigation. */
		disabled?: boolean;
	}
</script>

<script lang="ts">
	import type { ControlSize } from '$lib/size';
	// Single-select segmented control. One token-driven row of options covering
	// the two repeated redesign controls:
	//   • filter pills  — label + optional count badge ("All 742 / Missing 120")
	//   • view toggle   — compact icon-only buttons (grid / list)
	// Implemented with `radiogroup`/`radio` semantics + roving tabindex so the
	// browser-free keyboard model matches Tabs: ←/→ and Home/End move selection,
	// Space/Enter (or click) activate. `value` is bindable.
	import { tick } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import { playSound } from '$lib/sound';
	import { formatSegmentCount } from './segmented-control-count.js';
	import { nextEnabledSegment } from './segmented-control-keyboard.js';

	let {
		options,
		value = $bindable(),
		onchange,
		justify,
		wrap = false,
		// `icon` packs the segments into compact square buttons (label hidden as an
		// accessible name only); `pill` keeps the labelled filter-pill layout.
		variant = 'pill',
		size = 'md',
		control = false,
		box = false,
		label = 'Options',
		// `mobile` hides segment labels below the mobile breakpoint, collapsing
		// labelled segments to centered icon-only squares (aria-label preserved).
		// `container` does the same when the nearest size container is at most
		// 35rem wide (the breakpoint is fixed: `@container` cannot read a var).
		collapseLabels = 'never',
		scroll = false,
		block = false,
		sound = true,
		class: klass = '',
		// Custom rendering per option (overrides the built-in label/count/icon).
		option: optionSnippet
	}: {
		options: SegmentOption[];
		value?: string;
		/** Fires after a selection (click or keyboard). */
		onchange?: (value: string) => void;
		/** Pin the control to the start/end of a flex row. */
		justify?: 'start' | 'end';
		/** Allow segments to wrap onto multiple lines. */
		wrap?: boolean;
		variant?: 'pill' | 'icon';
		size?: ControlSize;
		/** Adopt the shared `--control-height` toolbar contract (like Popover/Button
		 *  `control`) so the whole segmented control height-matches its siblings. */
		control?: boolean;
		/** Adopt `--control-height-default` so an icon toggle lines up with
		 *  `Button square` / `box` siblings. */
		box?: boolean;
		label?: string;
		collapseLabels?: 'never' | 'mobile' | 'container';
		/** Single non-wrapping row that scrolls horizontally (scrollbar hidden). */
		scroll?: boolean;
		/** Fill the parent width, sharing it equally between segments. */
		block?: boolean;
		/** Play UI sounds when enabled globally; false silences this instance. */
		sound?: boolean;
		class?: string;
		option?: Snippet<[SegmentOption, boolean]>;
	} = $props();

	// Default to the first selectable option when no value is supplied.
	$effect(() => {
		if (value === undefined) {
			const first = options.find((o) => !o.disabled);
			if (first) value = first.value;
		}
	});

	let listEl = $state<HTMLDivElement | null>(null);
	const baseId = `seg-${Math.random().toString(36).slice(2, 8)}`;
	// The roving tab stop: the selected option, or the first enabled one when the
	// selection is unknown or disabled, so the group never drops out of the Tab order.
	const stop = $derived(
		options.find((o) => o.value === value && !o.disabled) ?? options.find((o) => !o.disabled)
	);
	const segId = (val: string) => `${baseId}-${val}`;

	// A pill wider than its container falls back to the `scroll` layout; the
	// class is dropped again once the row fits so the touch slab stays unclipped.
	let overflowing = $state(false);
	const watchOverflow: Attachment<HTMLElement> = (node) => {
		if (wrap || typeof ResizeObserver === 'undefined') {
			overflowing = false;
			return;
		}
		const check = () => {
			overflowing = node.scrollWidth - node.clientWidth > 1;
		};
		const ro = new ResizeObserver(check);
		ro.observe(node);
		check();
		return () => {
			ro.disconnect();
			overflowing = false;
		};
	};

	// A thumb slides under the selected segment on translate/scale (never
	// width/left): the size snaps, the old-to-new width ratio is inverted and
	// released (FLIP). It snaps on mount and reflow; until placed the selected
	// segment paints its own fill.
	let thumb = $state<HTMLSpanElement | null>(null);
	let placed = $state(false);
	let rect = { x: 0, y: 0, w: 0, h: 0 };
	function placeThumb(animate: boolean) {
		const el = listEl?.querySelector<HTMLElement>('.seg-item.selected');
		const th = thumb;
		if (!el || !th) {
			placed = false;
			return;
		}
		const prev = rect;
		rect = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
		th.style.width = `${rect.w}px`;
		th.style.height = `${rect.h}px`;
		th.style.transition = 'none';
		if (!animate || !placed || rect.w === 0) {
			th.style.translate = `${rect.x}px ${rect.y}px`;
			th.style.scale = '1 1';
			th.getBoundingClientRect();
			th.style.transition = '';
			placed = true;
			return;
		}
		th.style.translate = `${prev.x}px ${prev.y}px`;
		th.style.scale = `${prev.w / rect.w} ${prev.h / rect.h}`;
		th.getBoundingClientRect();
		th.style.transition = '';
		th.style.translate = `${rect.x}px ${rect.y}px`;
		th.style.scale = '1 1';
	}
	$effect(() => {
		value;
		options;
		tick().then(() => placeThumb(true));
	});
	$effect(() => {
		if (!listEl || typeof ResizeObserver === 'undefined') return;
		const ro = new ResizeObserver(() => placeThumb(false));
		ro.observe(listEl);
		return () => ro.disconnect();
	});

	function select(val: string, focus = false) {
		if (options.find((o) => o.value === val)?.disabled) return;
		if (value !== val) playSound('click', sound);
		value = val;
		onchange?.(val);
		if (focus) {
			queueMicrotask(() => listEl?.ownerDocument.getElementById(segId(val))?.focus());
		}
	}
	function onkeydown(e: KeyboardEvent) {
		const i = stop ? options.indexOf(stop) : -1;
		const next = nextEnabledSegment(options, i, e.key);
		if (next === undefined) return;
		e.preventDefault();
		select(options[next].value, true);
	}
</script>

<div
	bind:this={listEl}
	role="radiogroup"
	aria-label={label}
	tabindex="-1"
	class="seg seg-{variant} seg-{size} {klass}"
	class:seg-control={control}
	class:seg-box={box}
	class:seg-wrap={wrap}
	class:justify-start={justify === 'start'}
	class:justify-end={justify === 'end'}
	class:seg-collapse-mobile={collapseLabels === 'mobile'}
	class:collapse-container={collapseLabels === 'container'}
	class:seg-scroll={scroll}
	class:seg-block={block}
	class:seg-overflow={overflowing}
	class:placed
	data-tsu="SegmentedControl"
	{onkeydown}
	{@attach watchOverflow}
>
	<span bind:this={thumb} class="seg-thumb" aria-hidden="true"></span>
	{#each options as o (o.value)}
		{@const selected = value === o.value}
		<button
			type="button"
			id={segId(o.value)}
			role="radio"
			aria-checked={selected}
			aria-label={variant === 'icon' && !o.label ? o.value : o.label}
			tabindex={stop?.value === o.value ? 0 : -1}
			class="seg-item"
			class:has-label={!!o.label}
			class:selected
			disabled={o.disabled}
			onclick={() => select(o.value)}
		>
			{#if optionSnippet}
				{@render optionSnippet(o, selected)}
			{:else}
				{#if o.icon}<Icon name={o.icon} />{/if}
				{#if o.label}<span class="seg-label">{o.label}</span>{/if}
				{#if o.count !== undefined}<span class="seg-count">{formatSegmentCount(o.count)}</span>{/if}
			{/if}
		</button>
	{/each}
</div>

<style>
	/* Every size pins the track height (sm 32 / md 40 / control 44 / box 40);
	   items fill the inside, which is the height minus border and padding. */
	.seg {
		--seg-h: var(--control-md);
		--seg-inset: calc(var(--sp-0-5) + var(--edge-width));
		--seg-item-h: calc(var(--seg-h) - 2 * var(--seg-inset));
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
		height: var(--seg-h);
		min-height: var(--seg-h);
		padding: var(--sp-0-5);
		background: var(--track-fill);
		border: var(--edge-width) solid var(--track-edge);
		border-radius: var(--r-pill);
		max-width: 100%;
		min-width: 0;
	}
	.seg-icon {
		border-radius: var(--r-md);
	}
	.seg-sm {
		--seg-h: var(--control-sm);
	}
	.seg-control {
		--seg-h: var(--control-height);
		height: var(--control-height);
	}
	.seg-box {
		--seg-h: var(--control-height-default);
	}
	.seg-wrap {
		flex-wrap: wrap;
		height: auto;
	}
	.justify-start {
		margin-inline-end: auto;
	}
	.justify-end {
		margin-inline-start: auto;
	}
	.seg-scroll {
		flex: 1 0 100%;
		flex-wrap: nowrap;
		max-width: 100%;
		overflow-x: auto;
		overflow-y: hidden;
		scrollbar-width: none;
		-webkit-overflow-scrolling: touch;
	}
	.seg-scroll::-webkit-scrollbar {
		display: none;
	}
	.seg-scroll .seg-item {
		flex: none;
	}
	.seg-overflow {
		flex-wrap: nowrap;
		overflow-x: auto;
		overflow-y: hidden;
		scrollbar-width: none;
		-webkit-overflow-scrolling: touch;
	}
	.seg-overflow::-webkit-scrollbar {
		display: none;
	}
	.seg-overflow .seg-item {
		flex: none;
	}
	.seg-block {
		display: flex;
		width: 100%;
	}
	.seg-block .seg-item {
		flex: 1 1 0;
		justify-content: center;
		min-width: 0;
	}
	.seg-block .seg-label {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.seg-thumb {
		position: absolute;
		top: 0;
		left: 0;
		width: 0;
		height: 0;
		border-radius: var(--r-pill);
		background: var(--thumb-fill);
		box-shadow: var(--thumb-shadow);
		transform-origin: top left;
		pointer-events: none;
		transition:
			translate var(--dur-spring) var(--ease-spring),
			scale var(--dur-spring) var(--ease-spring);
	}
	.seg:not(.placed) .seg-thumb {
		display: none;
	}
	.seg-item {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--sp-2);
		height: 100%;
		padding: 0 var(--control-px-md);
		border: 0;
		border-radius: var(--r-pill);
		background: transparent;
		color: var(--text-muted);
		font-size: var(--control-fs-md);
		font-weight: var(--fw-medium);
		line-height: var(--lh-none);
		--icon-size: var(--control-icon-md);
		white-space: nowrap;
		cursor: pointer;
		transition:
			background var(--dur-fast) var(--ease),
			color var(--dur-fast) var(--ease);
	}
	.seg-sm .seg-item {
		padding: 0 var(--control-px-sm);
		font-size: var(--control-fs-sm);
		--icon-size: var(--control-icon-sm);
	}
	.seg-wrap .seg-item {
		height: auto;
		min-height: var(--seg-item-h);
	}
	/* Capped at half a row: one row stays a pill, extra rows square the corners. */
	.seg-wrap:not(.seg-icon) {
		border-radius: calc(var(--seg-h) / 2);
	}
	/* Icon-only segments are squares; corners stay concentric with the track. */
	.seg-icon .seg-item,
	.seg-icon .seg-thumb {
		border-radius: calc(var(--r-md) - var(--seg-inset));
	}
	.seg-icon .seg-item {
		gap: 0;
		padding: 0;
		width: var(--seg-item-h);
		font-size: var(--control-icon-md);
	}
	.seg-icon.seg-sm .seg-item {
		font-size: var(--control-icon-sm);
	}
	/* A labelled icon segment renders <icon><label>, so it must keep the normal
	   icon/label gap and the roomier pill padding — only true icon-only segments
	   collapse to the square layout above. */
	.seg-icon .seg-item.has-label {
		gap: var(--sp-2);
		width: auto;
		padding: 0 var(--control-px-md);
	}
	.seg-icon.seg-sm .seg-item.has-label {
		padding: 0 var(--control-px-sm);
	}

	/* collapseLabels='mobile': below the breakpoint, drop the label text and
	   tighten labelled segments back to a square icon button. The aria-label on
	   the button preserves the accessible name. */
	@media (max-width: 47.999rem) {
		.seg-collapse-mobile .seg-item.has-label .seg-label {
			display: none;
		}
		.seg-collapse-mobile .seg-item.has-label {
			gap: 0;
			padding: 0;
			width: var(--seg-item-h);
		}
	}
	@container (max-width: 35rem) {
		.collapse-container .seg-item.has-label .seg-label {
			display: none;
		}
		.collapse-container .seg-item.has-label {
			gap: 0;
			padding: 0;
			width: var(--seg-item-h);
		}
	}

	@media (hover: hover) and (pointer: fine) {
		.seg-item:hover:not(:disabled):not(.selected) {
			color: var(--text);
			background: var(--bg-elevated);
		}
	}
	.seg-item.selected {
		color: var(--text);
		background: var(--thumb-fill);
		box-shadow: var(--thumb-shadow);
	}
	.seg.placed .seg-item.selected {
		background: transparent;
		box-shadow: none;
	}
	.seg-item:disabled {
		opacity: var(--disabled-opacity);
		cursor: not-allowed;
	}
	/* Scrolling tracks clip their overflow, so the ring sits inside the item. */
	.seg-item:focus-visible {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset-inset);
	}

	.seg-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--sp-5);
		padding: 0 var(--sp-1-5);
		border-radius: var(--r-pill);
		background: var(--bg-elevated-2);
		color: var(--text-faint);
		font-size: var(--fs-xs);
		font-weight: var(--fw-semibold);
		font-variant-numeric: tabular-nums;
		transition:
			background var(--dur-fast) var(--ease),
			color var(--dur-fast) var(--ease);
	}
	@media (pointer: coarse) {
		.seg-item::before {
			content: '';
			position: absolute;
			inset-block: var(--touch-slab);
			inset-inline: calc(var(--sp-1) / -2);
		}
	}
	.seg-item.selected .seg-count {
		background: color-mix(in srgb, var(--accent) 18%, transparent);
		color: var(--accent);
	}
</style>
