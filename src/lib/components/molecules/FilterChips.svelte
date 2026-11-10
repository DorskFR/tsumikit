<script lang="ts" module>
	export interface FilterChipOption {
		id: string;
		label: string;
		/** Shown after the label with thousands separators; `0` is shown, `undefined` hides it. */
		count?: number;
		icon?: import('$lib/components/atoms/Icon.svelte').IconName;
		/** Greyed out, not selectable, skipped by keyboard navigation. */
		disabled?: boolean;
		/** Render this chip as a real link; overrides the component's `href`. */
		href?: string;
	}
</script>

<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import { playSound } from '$lib/sound';
	import { isModifiedClick } from '$lib/url-state.svelte';
	import Menu, { type MenuItem } from './Menu.svelte';
	import Toggle from './Toggle.svelte';
	import { fadeEdges, revealDelta, selectedIds, toggleId } from './filter-chips';
	import { formatSegmentCount } from './segmented-control-count.js';
	import { nextEnabledSegment } from './segmented-control-keyboard.js';

	type Own = {
		options: FilterChipOption[];
		/** The selected id, or the selected ids with `multiple`. */
		value?: string | string[];
		multiple?: boolean;
		/** Accessible name of the group. */
		label: string;
		size?: 'sm' | 'md';
		/** Fires after a selection (click, keyboard or menu). */
		onchange?: (value: string | string[]) => void;
		/** Chips become real links (`<a aria-current>`): middle-click opens the chip's URL in a new tab. */
		href?: (id: string) => string;
		/** `auto` swaps the row for one dropdown chip when the chips do not fit; `never` scrolls the row instead. */
		collapse?: 'auto' | 'never' | 'always';
		/** Play UI sounds when enabled globally; false silences this instance. */
		sound?: boolean;
		class?: string;
	};

	let {
		options,
		value = $bindable(),
		multiple = false,
		label,
		size = 'sm',
		onchange,
		href,
		collapse = 'auto',
		sound = true,
		class: klass = '',
		...rest
	}: Omit<HTMLAttributes<HTMLDivElement>, keyof Own> & Own = $props();

	const selected = $derived(selectedIds(value));
	const linkTo = (o: FilterChipOption) => (o.disabled ? undefined : (o.href ?? href?.(o.id)));
	const radio = $derived(!multiple && !options.some((o) => linkTo(o) !== undefined));
	const stop = $derived(
		options.find((o) => o.id === selected[0] && !o.disabled) ?? options.find((o) => !o.disabled)
	);

	let rowEl = $state<HTMLDivElement | null>(null);
	let measureEl = $state<HTMLDivElement | null>(null);
	let fits = $state(true);
	let overflowing = $state(false);
	let edges = $state({ start: false, end: false });
	const collapsed = $derived(collapse === 'always' || (collapse === 'auto' && !fits));

	function chipEl(id: string): HTMLElement | undefined {
		return [...(rowEl?.querySelectorAll<HTMLElement>('[data-chip]') ?? [])].find((el) => el.dataset.chip === id);
	}

	function measureRow() {
		if (!rowEl) return;
		overflowing = rowEl.scrollWidth - rowEl.clientWidth > 1;
		edges = fadeEdges(rowEl.scrollLeft, rowEl.scrollWidth, rowEl.clientWidth);
	}

	$effect(() => {
		void options;
		if (!measureEl) {
			fits = true;
			return;
		}
		const node = measureEl;
		const check = () => {
			fits = node.scrollWidth - node.clientWidth <= 1;
		};
		check();
		if (typeof ResizeObserver === 'undefined') return;
		const ro = new ResizeObserver(check);
		ro.observe(node);
		return () => ro.disconnect();
	});

	$effect(() => {
		void options;
		if (!rowEl) return;
		measureRow();
		if (typeof ResizeObserver === 'undefined') return;
		const ro = new ResizeObserver(measureRow);
		ro.observe(rowEl);
		return () => ro.disconnect();
	});

	$effect(() => {
		const id = selected[0];
		if (multiple || id === undefined || !rowEl || !overflowing) return;
		const chip = chipEl(id);
		if (!chip) return;
		const pad = Number.parseFloat(getComputedStyle(rowEl).scrollPaddingLeft) || 0;
		const first = chip === rowEl.firstElementChild;
		const last = chip === rowEl.lastElementChild;
		const delta = revealDelta(rowEl.getBoundingClientRect(), chip.getBoundingClientRect(), first || last ? 0 : pad);
		if (delta !== 0) rowEl.scrollLeft += delta;
		measureRow();
	});

	function pick(id: string, opts: { focus?: boolean; quiet?: boolean } = {}) {
		if (options.find((o) => o.id === id)?.disabled) return;
		const next = multiple ? toggleId(selected, id) : id;
		if (!opts.quiet && (multiple || value !== id)) playSound('click', sound);
		value = next;
		onchange?.(next);
		if (opts.focus) queueMicrotask(() => chipEl(id)?.focus());
	}

	function onkeydown(e: KeyboardEvent) {
		if (!radio) return;
		const from = stop ? options.indexOf(stop) : -1;
		const next = nextEnabledSegment(options, from, e.key);
		if (next === undefined) return;
		e.preventDefault();
		pick(options[next].id, { focus: true });
	}

	const single = $derived(multiple ? undefined : options.find((o) => o.id === selected[0]));
	const picked = $derived(options.filter((o) => selected.includes(o.id)));
	const menuLabel = $derived(picked.length ? `${label}: ${picked.map((o) => o.label).join(', ')}` : label);
	const items = $derived<MenuItem[]>(
		options.map((o) => ({
			id: o.id,
			label: o.label,
			icon: o.icon,
			disabled: o.disabled,
			tag: o.count === undefined ? undefined : String(formatSegmentCount(o.count)),
			pressed: selected.includes(o.id),
			keepOpen: multiple,
			onselect: () => pick(o.id, { quiet: true })
		}))
	);
</script>

{#snippet content(o: FilterChipOption)}
	{#if o.icon}<Icon name={o.icon} />{/if}
	<span>{o.label}</span>
	{#if o.count !== undefined}<span class="count">{formatSegmentCount(o.count)}</span>{/if}
{/snippet}

<div {...rest} class="fc fc-{size} {klass}" data-tsu="FilterChips" data-form={collapsed ? 'menu' : 'row'}>
	{#if collapsed}
		<div class="menu">
			<Menu label={menuLabel} {items} {size} {sound} variant="toggle" pressed={selected.length > 0}>
				{#snippet trigger()}
					{#if single}
						{@render content(single)}
					{:else}
						<span>{label}</span>
						{#if picked.length}<span class="count">{formatSegmentCount(picked.length)}</span>{/if}
					{/if}
					<Icon name="chevron-down" />
				{/snippet}
			</Menu>
		</div>
	{:else}
		<div
			bind:this={rowEl}
			role={radio ? 'radiogroup' : 'group'}
			aria-label={label}
			tabindex="-1"
			class="row"
			data-overflow={overflowing || undefined}
			data-fade-start={edges.start || undefined}
			data-fade-end={edges.end || undefined}
			{onkeydown}
			onscroll={measureRow}
		>
			{#each options as o (o.id)}
				{@const on = selected.includes(o.id)}
				{@const link = linkTo(o)}
				{#if link !== undefined}
					<a
						href={link}
						data-chip={o.id}
						aria-current={on ? (multiple ? 'true' : 'page') : undefined}
						class="chip"
						class:on
						onclick={(e) => {
							if (!isModifiedClick(e)) pick(o.id);
						}}
					>
						{@render content(o)}
					</a>
				{:else if radio}
					<button
						type="button"
						role="radio"
						data-chip={o.id}
						aria-checked={on}
						tabindex={stop?.id === o.id ? 0 : -1}
						disabled={o.disabled}
						class="chip"
						class:on
						onclick={() => pick(o.id)}
					>
						{@render content(o)}
					</button>
				{:else}
					<Toggle
						{size}
						pressed={on}
						shrink={false}
						sound={false}
						disabled={o.disabled}
						data-chip={o.id}
						onclick={() => pick(o.id)}
					>
						{@render content(o)}
					</Toggle>
				{/if}
			{/each}
		</div>
	{/if}
	{#if collapse === 'auto'}
		<div bind:this={measureEl} class="measure" aria-hidden="true" inert>
			{#each options as o (o.id)}
				<span class="chip">{@render content(o)}</span>
			{/each}
		</div>
	{/if}
</div>

<style>
	.fc {
		--fc-h: var(--control-sm);
		--fc-px: var(--control-px-sm);
		--fc-fs: var(--control-fs-sm);
		--fc-icon: var(--control-icon-sm);
		--fc-fade: var(--sp-6);
		--fc-bleed: var(--sp-2);
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		align-items: center;
		min-width: 0;
		max-width: 100%;
		height: var(--fc-h);
	}
	.fc-md {
		--fc-h: var(--control-md);
		--fc-px: var(--control-px-md);
		--fc-fs: var(--control-fs-md);
		--fc-icon: var(--control-icon-md);
	}
	.menu,
	.row,
	.measure {
		grid-area: 1 / 1;
		display: flex;
		align-items: center;
		gap: var(--sp-1);
		min-width: 0;
	}
	.measure {
		height: 0;
		overflow: hidden;
		visibility: hidden;
		pointer-events: none;
	}
	/* Clipping starts only on overflow, and the block padding keeps the coarse-pointer slab inside the clip. */
	.row[data-overflow] {
		--fc-fade-start: 0px;
		--fc-fade-end: 0px;
		overflow-x: auto;
		overflow-y: hidden;
		padding-block: var(--fc-bleed);
		margin-block: calc(-1 * var(--fc-bleed));
		scroll-padding-inline: var(--fc-fade);
		scrollbar-width: none;
		-webkit-overflow-scrolling: touch;
		mask-image: linear-gradient(
			to right,
			transparent,
			black var(--fc-fade-start),
			black calc(100% - var(--fc-fade-end)),
			transparent
		);
	}
	.row[data-overflow]:dir(rtl) {
		mask-image: linear-gradient(
			to left,
			transparent,
			black var(--fc-fade-start),
			black calc(100% - var(--fc-fade-end)),
			transparent
		);
	}
	.row[data-overflow]::-webkit-scrollbar {
		display: none;
	}
	.row[data-fade-start] {
		--fc-fade-start: var(--fc-fade);
	}
	.row[data-fade-end] {
		--fc-fade-end: var(--fc-fade);
	}
	.row[data-overflow] :global(:is(.chip, .toggle):focus-visible) {
		outline-offset: var(--focus-ring-offset-inset);
	}

	.chip {
		position: relative;
		flex: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--sp-1);
		box-sizing: border-box;
		height: var(--toggle-size, var(--fc-h));
		padding: 0 var(--fc-px);
		border: var(--edge-width) solid var(--surface-edge);
		border-radius: var(--r-sm);
		background: var(--surface-fill-2);
		color: var(--text-muted);
		font-size: var(--fc-fs);
		font-weight: var(--fw-medium);
		line-height: var(--lh-none);
		--icon-size: var(--fc-icon);
		white-space: nowrap;
		text-decoration: none;
		user-select: none;
		cursor: pointer;
		transition:
			background var(--dur-fast) var(--ease),
			border-color var(--dur-fast) var(--ease),
			color var(--dur-fast) var(--ease),
			translate var(--dur-fast) var(--ease),
			scale var(--dur-fast) var(--ease-out);
	}
	.chip:disabled {
		opacity: var(--disabled-opacity);
		cursor: not-allowed;
	}
	@media (hover: hover) and (pointer: fine) {
		.chip:hover:not(:disabled) {
			border-color: var(--surface-edge-strong);
			translate: 0 calc(-1 * var(--hover-lift));
		}
	}
	.chip:active:not(:disabled) {
		scale: var(--press-scale);
		transition-duration: var(--dur-press);
	}
	.chip.on {
		--tc: var(--toggle-accent, var(--accent));
		color: var(--tc);
		border-color: color-mix(in srgb, var(--tc) 55%, transparent);
		background: color-mix(in srgb, var(--tc) 16%, transparent);
	}
	.count {
		color: color-mix(in srgb, currentColor 65%, transparent);
		font-variant-numeric: tabular-nums;
	}
	@media (pointer: coarse) {
		.chip::before {
			content: '';
			position: absolute;
			inset-block: var(--touch-slab);
			inset-inline-start: var(--touch-slab);
			inset-inline-end: 0;
		}
	}
</style>
