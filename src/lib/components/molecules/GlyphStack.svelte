<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface GlyphStackItem {
		/** Rendered in the inline run, and in the grid when `stacked` is unset. */
		inline: Snippet | string;
		/** Compact variant for a 1rem grid cell (e.g. a tinted initial tile for a full Badge). */
		stacked?: Snippet | string;
		/** Content of the enlarged tile when `expand` is on; defaults to `inline`. */
		expanded?: Snippet | string;
		/** Fired by a slide-release on this tile, instead of clicking its first control. */
		action?: () => void;
	}
</script>

<script lang="ts">
	// Up to four small glyphs (pin, status dot, entity tag, avatar) as an inline
	// run, folded into one 2×2 grid of 1rem cells when the row is tight. The grid
	// is purely visual: DOM order, focus order and reading order never change.
	import { tick } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { browser } from '$lib/env';
	import { slideSelect } from '$lib/slide-select';

	type Own = {
		/** Glyphs as `{ inline, stacked? }` pairs; alternative to `children`. */
		items?: GlyphStackItem[];
		/** Free-form run — each direct child becomes a cell. */
		children?: Snippet;
		/** `auto` folds below `stackBelow`, measured on the nearest query container
		 *  (any `.cq`, an AppShell region, or the ancestor named `container`). */
		stack?: 'never' | 'always' | 'auto';
		/** Container width (px/em/rem) under which `auto` folds. */
		stackBelow?: string;
		/** `container-name` of the ancestor to measure instead of the nearest one. */
		container?: string;
		/** While stacked (`items` only), a press opens the four glyphs as big tiles
		 *  over the stack. `tap` keeps them open to hover, click and read; `slide`
		 *  also lets you drag toward a corner and release to fire that tile. */
		expand?: 'none' | 'tap' | 'slide';
		/** Accessible name of the expanded panel. */
		expandLabel?: string;
		class?: string;
	};
	let {
		items,
		children,
		stack = 'auto',
		stackBelow = '30rem',
		container,
		expand = 'none',
		expandLabel = 'Details',
		class: klass = '',
		...rest
	}: Omit<HTMLAttributes<HTMLSpanElement>, keyof Own> & Own = $props();

	let root = $state<HTMLElement>();
	// Coarse pointers cannot hit 1rem cells, so a folded stack with items opens
	// its tiles on tap unless the caller chose an expand mode.
	let coarse = $state(false);
	const mode = $derived(expand !== 'none' ? expand : coarse ? 'tap' : 'none');
	let width = $state(Number.POSITIVE_INFINITY);
	let limit = $state(0);
	const stacked = $derived(stack === 'always' || (stack === 'auto' && width < limit));

	function toPx(length: string, el: HTMLElement): number {
		const n = Number.parseFloat(length);
		const fontSize = (node: Element) => Number.parseFloat(getComputedStyle(node).fontSize);
		if (length.endsWith('rem')) return n * fontSize(document.documentElement);
		if (length.endsWith('em')) return n * fontSize(el);
		return n;
	}

	function queryContainer(el: HTMLElement, name?: string): HTMLElement | null {
		for (let node = el.parentElement; node; node = node.parentElement) {
			const style = getComputedStyle(node);
			if (name) {
				if (style.containerName?.split(/\s+/).includes(name)) return node;
			} else if (style.containerType && style.containerType !== 'normal') {
				return node;
			}
		}
		return el.parentElement;
	}

	const CONTROL = 'button, a[href], input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])';

	const tiles = $derived(items?.slice(0, 4) ?? []);
	const expandable = $derived(mode !== 'none' && stacked && tiles.length > 0);
	let panel = $state<HTMLDivElement>();
	let open = $state(false);
	let armed = $state(-1);

	function show() {
		try {
			panel?.showPopover();
		} catch {}
	}

	function hide() {
		try {
			panel?.hidePopover();
		} catch {}
	}

	function nestedOpen(): boolean {
		try {
			return !!panel?.querySelector(':popover-open');
		} catch {
			return false;
		}
	}

	function position() {
		if (!root || !panel) return;
		const r = root.getBoundingClientRect();
		const p = panel.getBoundingClientRect();
		const { clientWidth: vw, clientHeight: vh } = document.documentElement;
		const clamp = (v: number, max: number) => Math.max(8, Math.min(v, max - 8));
		panel.style.left = `${clamp(r.left + r.width / 2 - p.width / 2, vw - p.width)}px`;
		panel.style.top = `${clamp(r.top + r.height / 2 - p.height / 2, vh - p.height)}px`;
	}

	async function onToggle(e: ToggleEvent) {
		open = e.newState === 'open';
		if (!open) {
			armed = -1;
			return;
		}
		await tick();
		position();
	}

	/** Tile under a drag from the press point: 0 top-left, 1 top-right, 2 bottom-left, 3 bottom-right. */
	const slide = slideSelect({
		pick: ({ dx, dy }) => {
			const i = (dy < 0 ? 0 : 2) + (dx < 0 ? 0 : 1);
			return i < tiles.length ? i : -1;
		},
		onarm: (i) => (armed = i),
	});

	async function activate(i: number) {
		const { action } = tiles[i];
		if (action) {
			action();
			hide();
			return;
		}
		const control = panel?.querySelectorAll('.tile')[i]?.querySelector<HTMLElement>(CONTROL);
		if (!control) return;
		control.click();
		await tick();
		if (!nestedOpen()) hide();
	}

	function onPointerDown(e: PointerEvent) {
		if (!expandable || mode !== 'slide' || e.button !== 0) return;
		e.preventDefault();
		e.stopPropagation();
		slide.down(e, root);
		show();
	}

	function onPointerMove(e: PointerEvent) {
		slide.move(e);
	}

	function onPointerUp() {
		const i = slide.up();
		if (i >= 0) activate(i);
	}

	function onPointerCancel() {
		slide.cancel();
	}

	// Pointer clicks on the folded cells open the panel instead of hitting the
	// 1rem targets; keyboard activation (`detail` 0) still reaches them directly.
	function onClickCapture(e: MouseEvent) {
		if (!expandable || e.detail === 0) return;
		e.preventDefault();
		e.stopPropagation();
		if (mode === 'tap') {
			if (open) hide();
			else show();
		}
	}

	$effect(() => {
		if (!browser || typeof matchMedia !== 'function') return;
		const mq = matchMedia('(pointer: coarse)');
		const sync = () => (coarse = mq.matches);
		sync();
		mq.addEventListener?.('change', sync);
		return () => mq.removeEventListener?.('change', sync);
	});

	$effect(() => {
		if (!expandable && open) hide();
	});

	$effect(() => {
		if (!open) return;
		const onDown = (e: PointerEvent) => {
			const t = e.target as Node;
			if (!panel?.contains(t) && !root?.contains(t)) hide();
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && !nestedOpen()) hide();
		};
		document.addEventListener('pointerdown', onDown, true);
		document.addEventListener('keydown', onKey);
		addEventListener('scroll', position, true);
		addEventListener('resize', position);
		return () => {
			document.removeEventListener('pointerdown', onDown, true);
			document.removeEventListener('keydown', onKey);
			removeEventListener('scroll', position, true);
			removeEventListener('resize', position);
		};
	});

	$effect(() => {
		if (!browser || !root || stack !== 'auto') return;
		const el = root;
		const target = queryContainer(el, container);
		if (!target) return;
		limit = toPx(stackBelow, el);
		const observer = new ResizeObserver(([entry]) => {
			width = entry.contentRect.width;
		});
		observer.observe(target);
		return () => observer.disconnect();
	});
</script>

<span
	bind:this={root}
	data-tsu="GlyphStack"
	class="glyph-stack {klass}"
	class:stacked
	data-stack={stack}
	data-stacked={stacked || undefined}
	data-expand={expandable ? mode : undefined}
	{...rest}
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onpointercancel={onPointerCancel}
	onclickcapture={onClickCapture}
>
	{#if items}
		{#each tiles as item, i (i)}
			{@const glyph = stacked && item.stacked !== undefined ? item.stacked : item.inline}
			<span class="cell">
				{#if typeof glyph === 'string'}{glyph}{:else}{@render glyph()}{/if}
			</span>
		{/each}
	{:else}
		{@render children?.()}
	{/if}
</span>

{#if mode !== 'none' && items}
	<!-- `manual`: an `auto` popover would light-dismiss on the captured slide release. -->
	<div
		bind:this={panel}
		popover="manual"
		class="expand-panel"
		data-expand-panel={mode}
		role="group"
		aria-label={expandLabel}
		ontoggle={onToggle}
	>
		{#if open}
			{#each tiles as item, i (i)}
				{@const glyph = item.expanded ?? item.inline}
				<span class="tile" class:armed={armed === i} data-armed={armed === i || undefined}>
					<span class="tile-body">
						{#if typeof glyph === 'string'}{glyph}{:else}{@render glyph()}{/if}
					</span>
				</span>
			{/each}
		{/if}
	</div>
{/if}

<style>
	.glyph-stack {
		display: inline-flex;
		align-items: center;
		gap: var(--glyph-stack-gap, var(--sp-1));
		flex: none;
		vertical-align: middle;
	}
	.cell {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
	}
	.stacked {
		display: inline-grid;
		grid-template-columns: repeat(2, 1rem);
		grid-auto-rows: 1rem;
		gap: var(--sp-px);
		place-items: center;
	}
	/* Cells clip, so any focus ring inside draws inset. */
	.stacked > :global(*) {
		--focus-ring-offset: var(--focus-ring-offset-inset);
		width: 1rem;
		height: 1rem;
		max-width: 1rem;
		max-height: 1rem;
		min-width: 0;
		min-height: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		font-size: var(--fs-xs);
		line-height: var(--lh-none);
	}
	/* Controls with a minimum box (e.g. a `box="xs"` IconButton) shrink to the cell instead of clipping. */
	.stacked > .cell > :global(*) {
		min-width: 0;
		min-height: 0;
		max-width: 1rem;
		max-height: 1rem;
	}
	/* A labelled Dot folds to its disc; the label stays in the accessibility tree. */
	.stacked :global(.dot-row > :not(.dot)) {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	.stacked > :global(*) :global(:focus-visible),
	.stacked > :global(:focus-visible) {
		outline-offset: var(--focus-ring-offset-inset);
	}
	.glyph-stack[data-expand] {
		cursor: pointer;
	}
	/* An expandable stack is one target: presses land on the stack, not on 1rem cells. */
	.glyph-stack[data-expand] > .cell {
		pointer-events: none;
	}
	.glyph-stack[data-expand='slide'] {
		touch-action: none;
		user-select: none;
		-webkit-touch-callout: none;
	}
	.expand-panel {
		position: fixed;
		inset: auto;
		margin: 0;
		padding: var(--sp-1);
		max-width: calc(100vw - 2 * var(--sp-2));
		background: var(--raised-fill);
		color: var(--text);
		border: var(--edge-width) solid var(--raised-edge);
		border-radius: var(--r-md);
		box-shadow: var(--raised-shadow);
		opacity: 0;
		scale: var(--enter-scale);
		transition:
			opacity var(--dur-base) var(--ease-out),
			scale var(--dur-base) var(--ease-out);
	}
	.expand-panel:popover-open {
		display: grid;
		grid-template-columns: repeat(2, minmax(var(--glyph-stack-tile, 3rem), 1fr));
		grid-auto-rows: minmax(var(--glyph-stack-tile, 3rem), 1fr);
		gap: var(--sp-1);
		opacity: 1;
		scale: 1;
	}
	@starting-style {
		.expand-panel:popover-open {
			opacity: 0;
			scale: var(--enter-scale);
		}
	}
	.tile {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--sp-1);
		border-radius: calc(var(--r-md) - var(--sp-1) - 1px);
		background: var(--surface);
		transition:
			background var(--dur-fast) var(--ease),
			box-shadow var(--dur-fast) var(--ease);
	}
	.tile.armed {
		background: color-mix(in srgb, var(--accent) 18%, var(--surface));
		box-shadow: inset 0 0 0 2px var(--accent);
		transition-duration: var(--dur-instant);
	}
	.tile-body {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		zoom: var(--glyph-stack-zoom, 1.75);
	}
</style>
