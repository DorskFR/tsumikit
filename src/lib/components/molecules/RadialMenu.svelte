<script lang="ts" module>
	export interface RadialArc {
		/** Degrees, 0 = right, counter-clockwise. */
		from: number;
		to: number;
	}
</script>

<script lang="ts">
	// A round FAB that fans its MenuItems out as petals on an arc, in a top-layer
	// panel over a scrim. Tap toggles; press-and-slide arms the petal under the
	// pointer and fires it on release. The panel holds an inert copy of the FAB
	// so the button still reads as the close control over the scrim.
	import { tick, untrack, type Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Icon, { type IconName } from '$lib/components/atoms/Icon.svelte';
	import Scrim from '$lib/components/atoms/Scrim.svelte';
	import type { MenuItem } from '$lib/components/molecules/Menu.svelte';
	import { menuItemCloses, menuItemGlyphs } from '$lib/components/molecules/menu-item';
	import { type Bounds, fanLayout, type Point } from '$lib/floating';
	import { slideSelect } from '$lib/slide-select';
	import { canonicalTone, type Tone } from '$lib/tone';

	type Own = {
		items: MenuItem[];
		/** Accessible name of the trigger and the menu. */
		label: string;
		open?: boolean;
		onopen?: () => void;
		onclose?: () => void;
		/** Replaces the default FAB content. */
		trigger?: Snippet<[{ open: boolean }]>;
		icon?: IconName;
		closeIcon?: IconName;
		/** Small line under the FAB glyph ("● bot"). */
		caption?: Snippet | string;
		/** Colour of the FAB ring. */
		tone?: Tone;
		arc?: RadialArc;
		/** Preferred arc radius; defaults to `--radial-radius`, else 8.5rem. */
		radius?: string;
		/** Petal diameter; defaults to `--radial-petal-size`, else 3.5rem. */
		petalSize?: string;
		scrim?: boolean;
		/** A line centred above the arc while open. */
		status?: Snippet;
		class?: string;
		style?: string;
	};

	let {
		items,
		label,
		open = $bindable(false),
		onopen,
		onclose,
		trigger,
		icon = 'plus',
		closeIcon = 'x',
		caption,
		tone = 'accent',
		arc = { from: 200, to: -20 },
		radius,
		petalSize,
		scrim = true,
		status,
		class: klass = '',
		style: styleProp = '',
		...rest
	}: Omit<HTMLButtonAttributes, keyof Own> & Own = $props();

	const uid = $props.id();
	const menuId = `${uid}-menu`;
	const EDGE = 8;
	const TAP_TAIL_MS = 400;
	const SLACK = 8;

	let triggerEl = $state<HTMLButtonElement>();
	let panel = $state<HTMLDivElement>();
	let statusEl = $state<HTMLDivElement>();
	let points = $state<Point[]>([]);
	let fab = $state<{ left: number; top: number; width: number; height: number } | null>(null);
	let statusAt = $state<Point | null>(null);
	let armed = $state(-1);
	let active = $state(0);
	let petalPx = 0;
	let shown = false;
	let focusOnOpen = false;
	let pressedOpen = false;
	let swallowClick = false;
	let releasedAt = Number.NEGATIVE_INFINITY;

	const petals = $derived(items.filter((item) => !item.control));
	const ring = $derived(tone === 'neutral' ? 'var(--border-strong)' : `var(--${canonicalTone(tone)})`);
	const forward = $derived(points.length < 2 || points[points.length - 1].x >= points[0].x);

	function toPx(length: string, el: Element): number {
		const n = Number.parseFloat(length);
		if (Number.isNaN(n)) return 0;
		const font = (node: Element) => Number.parseFloat(getComputedStyle(node).fontSize) || 16;
		if (length.endsWith('rem')) return n * font(document.documentElement);
		if (length.endsWith('em')) return n * font(el);
		if (length.endsWith('vw')) return (n * document.documentElement.clientWidth) / 100;
		if (length.endsWith('vh')) return (n * document.documentElement.clientHeight) / 100;
		return n;
	}

	function length(el: Element, prop: string | undefined, name: string, fallback: string): number {
		const value = prop ?? (getComputedStyle(el).getPropertyValue(name).trim() || fallback);
		return toPx(value, el) || toPx(fallback, el);
	}

	function bounds(): Bounds {
		const { clientWidth: vw, clientHeight: vh } = document.documentElement;
		const pad = panel ? getComputedStyle(panel) : null;
		const inset = (side: 'Top' | 'Right' | 'Bottom' | 'Left') =>
			(Number.parseFloat(pad?.[`padding${side}`] ?? '') || 0) + EDGE;
		return { left: inset('Left'), top: inset('Top'), right: vw - inset('Right'), bottom: vh - inset('Bottom') };
	}

	function position() {
		if (!triggerEl) return;
		const r = triggerEl.getBoundingClientRect();
		const touch = length(triggerEl, undefined, '--touch-target', '44px');
		petalPx = Math.max(length(triggerEl, petalSize, '--radial-petal-size', '3.5rem'), touch);
		const center = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
		const layout = fanLayout({
			center,
			count: petals.length,
			from: arc.from,
			to: arc.to,
			radius: length(triggerEl, radius, '--radial-reach', '8.5rem'),
			petal: petalPx,
			minRadius: Math.max(r.width, r.height) / 2 + petalPx / 2,
			bounds: bounds(),
		});
		points = layout.points;
		fab = { left: r.left, top: r.top, width: r.width, height: r.height };
		if (!points.length) {
			statusAt = null;
			return;
		}
		const xs = points.map((p) => p.x);
		const top = Math.min(...points.map((p) => p.y), center.y - r.height / 2) - petalPx / 2 - EDGE;
		statusAt = { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: top };
		tick().then(clampStatus);
	}

	function clampStatus() {
		if (!statusEl || !statusAt) return;
		const w = statusEl.getBoundingClientRect().width;
		const b = bounds();
		const x = Math.max(b.left + w / 2, Math.min(statusAt.x, b.right - w / 2));
		if (x !== statusAt.x) statusAt = { x, y: statusAt.y };
	}

	function petalEls(): HTMLButtonElement[] {
		return Array.from(panel?.querySelectorAll<HTMLButtonElement>('.radial-petal') ?? []);
	}

	function enabled(): number[] {
		return petals.flatMap((item, i) => (item.disabled ? [] : [i]));
	}

	function focusPetal(i: number) {
		if (i < 0) return;
		active = i;
		petalEls()[i]?.focus();
	}

	function step(by: number) {
		const order = enabled();
		if (!order.length) return;
		const at = order.indexOf(active);
		focusPetal(order[(at + by + order.length) % order.length] ?? order[0]);
	}

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

	function openMenu(fromKeyboard: boolean) {
		focusOnOpen = fromKeyboard;
		open = true;
	}

	function close(refocus = false) {
		if (!open) return;
		const inside = !!panel?.contains(document.activeElement);
		open = false;
		if (refocus || inside) triggerEl?.focus();
	}

	function activate(item: MenuItem) {
		if (item.disabled) return;
		if (menuItemCloses(item, true)) close(true);
		item.onselect?.();
	}

	$effect(() => {
		const want = open;
		if (!panel || want === shown) return;
		shown = want;
		untrack(() => {
			if (want) {
				show();
				position();
				active = enabled()[0] ?? 0;
				if (focusOnOpen) tick().then(() => focusPetal(enabled()[0] ?? -1));
				focusOnOpen = false;
				onopen?.();
			} else {
				hide();
				armed = -1;
				onclose?.();
			}
		});
	});

	$effect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return;
			e.preventDefault();
			close(true);
		};
		const onDown = (e: PointerEvent) => {
			const t = e.target as Node;
			if (!panel?.querySelector('[role="menu"]')?.contains(t) && !triggerEl?.contains(t)) close();
		};
		const reflow = () => position();
		document.addEventListener('keydown', onKey);
		if (!scrim) document.addEventListener('pointerdown', onDown, true);
		addEventListener('resize', reflow);
		addEventListener('scroll', reflow, true);
		return () => {
			document.removeEventListener('keydown', onKey);
			document.removeEventListener('pointerdown', onDown, true);
			removeEventListener('resize', reflow);
			removeEventListener('scroll', reflow, true);
		};
	});

	const slide = slideSelect({
		pick: ({ x, y }) => {
			const reach = petalPx / 2 + SLACK;
			let best = -1;
			let bestD = reach;
			points.forEach((p, i) => {
				const d = Math.hypot(x - p.x, y - p.y);
				if (d <= bestD && !petals[i]?.disabled) {
					best = i;
					bestD = d;
				}
			});
			return best;
		},
		onarm: (i) => (armed = i),
	});

	function onpointerdown(e: PointerEvent) {
		if (e.button !== 0 || rest.disabled) return;
		swallowClick = true;
		pressedOpen = open;
		slide.down(e, triggerEl);
		if (!open) openMenu(false);
	}

	function onpointerup() {
		if (!slide.active) return;
		releasedAt = performance.now();
		const slid = slide.slid;
		const i = slide.up();
		if (i >= 0) activate(petals[i]);
		else if (!slid && pressedOpen) close();
	}

	// A touch tap's click is hit-tested after the scrim has appeared over the FAB.
	function onscrim() {
		if (performance.now() - releasedAt < TAP_TAIL_MS) return;
		close();
	}

	function onclick(e: MouseEvent) {
		if (swallowClick && e.detail !== 0) {
			swallowClick = false;
			return;
		}
		swallowClick = false;
		if (open) close(true);
		else openMenu(true);
	}

	function ontriggerkey(e: KeyboardEvent) {
		if (e.key === 'Tab' && open) {
			close();
			return;
		}
		if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
		e.preventDefault();
		if (open) focusPetal(enabled()[0] ?? -1);
		else openMenu(true);
	}

	function onpetalkey(e: KeyboardEvent) {
		const order = enabled();
		const keys: Record<string, () => void> = {
			ArrowRight: () => step(forward ? 1 : -1),
			ArrowLeft: () => step(forward ? -1 : 1),
			ArrowDown: () => step(1),
			ArrowUp: () => step(-1),
			Home: () => focusPetal(order[0] ?? -1),
			End: () => focusPetal(order[order.length - 1] ?? -1),
			Tab: () => close(true),
		};
		const run = keys[e.key];
		if (!run) return;
		e.preventDefault();
		run();
	}
</script>

{#snippet face()}
	{#if trigger}
		{@render trigger({ open })}
	{:else}
		<Icon name={open ? closeIcon : icon} size={20} />
		{#if caption}
			<span class="radial-caption">
				{#if typeof caption === 'string'}{caption}{:else}{@render caption()}{/if}
			</span>
		{/if}
	{/if}
{/snippet}

<button
	type="button"
	{...rest}
	bind:this={triggerEl}
	data-tsu="RadialMenu"
	class="radial-fab {klass}"
	style={styleProp}
	style:--radial-ring={ring}
	aria-label={label}
	aria-haspopup="menu"
	aria-expanded={open}
	aria-controls={menuId}
	data-open={open || undefined}
	{onclick}
	{onpointerdown}
	onpointermove={(e) => slide.move(e)}
	{onpointerup}
	onpointercancel={() => slide.cancel()}
	onkeydown={ontriggerkey}
>
	{@render face()}
</button>

<div bind:this={panel} popover="manual" class="radial-panel" data-radial-panel>
	{#if open}
		{#if scrim}
			<Scrim onclose={onscrim} z={0} label="Close {label}" />
		{/if}
		{#if fab}
			<span
				class="radial-fab radial-ghost"
				aria-hidden="true"
				style:--radial-ring={ring}
				style:left="{fab.left}px"
				style:top="{fab.top}px"
				style:width="{fab.width}px"
				style:height="{fab.height}px"
			>
				{@render face()}
			</span>
		{/if}
		{#if status && statusAt}
			<div bind:this={statusEl} class="radial-status" style:left="{statusAt.x}px" style:top="{statusAt.y}px">
				{@render status()}
			</div>
		{/if}
	{/if}
	<div id={menuId} role="menu" aria-label={label} class="radial-menu">
		{#if open}
			{#each petals as item, i (item.id ?? `${i}:${item.label}`)}
				{@const p = points[i]}
				{#if p}
					{@const glyphs = menuItemGlyphs(item)}
					<button
						type="button"
						{...item.attrs}
						role={item.pressed === undefined ? 'menuitem' : 'menuitemcheckbox'}
						aria-checked={item.pressed === undefined ? undefined : item.pressed}
						class="radial-petal"
						class:danger={item.danger}
						class:on={item.pressed}
						class:armed={armed === i}
						data-armed={armed === i || undefined}
						disabled={item.disabled}
						tabindex={i === active ? 0 : -1}
						style:left="{p.x}px"
						style:top="{p.y}px"
						style:--radial-i={i}
						onclick={() => activate(item)}
						onkeydown={onpetalkey}
						onfocus={() => (active = i)}
					>
						{#if item.content}
							{@render item.content(item)}
						{:else}
							<span class="radial-glyph" aria-hidden="true">
								{#if glyphs.leading === 'icon' && item.icon}
									<Icon name={item.icon} size={16} />
								{:else if glyphs.leading === 'check'}
									<Icon name={item.pressed ? 'check' : 'minus'} size={16} />
								{/if}
							</span>
							<span class="radial-label">{item.label}</span>
						{/if}
					</button>
				{/if}
			{/each}
		{/if}
	</div>
</div>

<style>
	.radial-fab {
		--radial-reach: var(--radial-radius, 8.5rem);
		position: relative;
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1px;
		flex: none;
		width: var(--radial-fab-size, 3.75rem);
		height: var(--radial-fab-size, 3.75rem);
		min-width: var(--touch-target);
		min-height: var(--touch-target);
		padding: 0;
		border: 2px solid var(--radial-ring, var(--accent));
		border-radius: 50%;
		background: var(--bg-elevated-2);
		color: var(--text);
		box-shadow: var(--shadow-lg);
		cursor: pointer;
		touch-action: none;
		user-select: none;
		-webkit-touch-callout: none;
	}
	.radial-fab:focus-visible {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
	}
	.radial-fab:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.radial-caption {
		font-size: var(--fs-xs);
		line-height: 1;
		color: var(--text-muted);
		white-space: nowrap;
	}
	.radial-panel {
		position: fixed;
		inset: 0;
		width: auto;
		height: auto;
		max-width: none;
		max-height: none;
		margin: 0;
		padding: var(--safe-top) var(--safe-right) var(--safe-bottom) var(--safe-left);
		border: 0;
		background: transparent;
		color: var(--text);
		overflow: visible;
		z-index: var(--z-modal);
	}
	.radial-ghost {
		position: fixed;
		pointer-events: none;
		min-width: 0;
		min-height: 0;
	}
	.radial-status {
		position: fixed;
		max-width: calc(100vw - 2 * var(--sp-2));
		transform: translate(-50%, -100%);
		font-size: var(--fs-sm);
		color: var(--text-muted);
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		pointer-events: none;
	}
	.radial-menu {
		position: fixed;
		inset: 0;
		pointer-events: none;
	}
	.radial-petal {
		position: fixed;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		width: max(var(--radial-petal-size, 3.5rem), var(--touch-target));
		height: max(var(--radial-petal-size, 3.5rem), var(--touch-target));
		padding: 0 2px;
		border: 1px solid var(--border-strong);
		border-radius: 50%;
		background: var(--bg-elevated);
		color: var(--text);
		box-shadow: var(--shadow-md);
		font-size: var(--fs-xs);
		line-height: 1.1;
		translate: -50% -50%;
		pointer-events: auto;
		cursor: pointer;
		animation: radial-in 0.16s var(--ease) both;
		animation-delay: calc(var(--radial-i, 0) * 18ms);
	}
	@keyframes radial-in {
		from {
			opacity: 0;
			scale: 0.4;
		}
	}
	.radial-glyph {
		display: inline-flex;
		color: var(--text-muted);
	}
	.radial-label {
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.radial-petal:hover:not(:disabled),
	.radial-petal.armed {
		background: var(--bg-elevated-2);
		border-color: var(--accent);
	}
	.radial-petal:focus-visible {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
	}
	.radial-petal.on {
		border-color: var(--accent);
	}
	.radial-petal.danger,
	.radial-petal.danger .radial-glyph {
		color: var(--danger);
	}
	.radial-petal.danger {
		border-color: var(--danger);
	}
	.radial-petal:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	@media (prefers-reduced-motion: reduce) {
		.radial-petal {
			animation: none;
		}
	}
</style>
