<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { canonicalTone, type Tone as SharedTone } from '$lib/tone';
	// Elevated surface primitive — the canonical card/panel container. Owns its
	// background/border/radius/padding from theme tokens. `tap` adds the
	// interactive hover/active affordance for tappable list items (e.g. session
	// rows); `as` lets it be a button/anchor when the whole surface is clickable.
	// `padding` dials the inner spacing (none/sm/md/lg) for denser cards.
	// `tone` tints the surface itself (border + faint background wash) with a
	// semantic hue for inline banners; `neutral` is the plain card; `attention`
	// adds a left bar for needs-input rows.
	//
	// `interactive` makes a non-button/anchor card keyboard-operable
	// (role=button, tabindex, Enter/Space) and ignores clicks originating from
	// nested interactive elements so inner buttons/links keep working.
	//
	// `stacked` fakes a pile of cards by drawing two layers peeking out below
	// (and optionally to the right) via pseudo-elements. `stackTone` tints those
	// back layers with a semantic hue (e.g. `info` for a blue stack); `neutral`
	// keeps them on the plain border colour. `stackY`/`stackX` set the per-layer
	// vertical / horizontal offset in px (vertical spacing stays even across the
	// 3 borders); horizontal defaults to a tiny 2px peek.
	//
	// `header`/`footer` snippets (or the `title`/`subtitle`/`actions` sugar,
	// which renders a SectionHeader) sit outside the padded body behind a
	// divider; `gap` stacks children as a flex column without a wrapper.
	import type { Snippet } from 'svelte';
	import SectionHeader from '../molecules/SectionHeader.svelte';

	type Tone = SharedTone | 'attention';

	type Own = {
		/** Polymorphic attributes for `as="a"` / `as="button"`. */
		href?: string;
		target?: string;
		rel?: string;
		type?: 'button' | 'submit' | 'reset';
		tap?: boolean;
		interactive?: boolean;
		as?: 'div' | 'button' | 'a' | 'li' | 'section' | 'form';
		padding?: 'none' | 'sm' | 'md' | 'lg';
		surface?: 'base' | 'raised' | 'sunken';
		/** Frame border style; `none` drops the frame. Applies to the stacked layers too. */
		border?: 'solid' | 'dashed' | 'none';
		tone?: Tone;
		stacked?: boolean;
		stackTone?: Tone;
		stackY?: number;
		stackX?: number;
		title?: string;
		subtitle?: string;
		gap?: string;
		/** `hidden` clips children to the rounded box. */
		overflow?: 'visible' | 'hidden';
		maxWidth?: string;
		onclick?: (e: MouseEvent | KeyboardEvent) => void;
		class?: string;
		style?: string;
		header?: Snippet;
		footer?: Snippet;
		actions?: Snippet;
		children?: Snippet;
	};
	let {
		tap = false,
		interactive = false,
		as = 'div',
		type = 'button',
		padding = 'md',
		surface = 'base',
		border = 'solid',
		tone = 'neutral',
		stacked = false,
		stackTone = 'neutral',
		stackY = 8,
		stackX = 2,
		title,
		subtitle,
		gap,
		overflow,
		maxWidth,
		onclick,
		class: klass = '',
		style = '',
		header,
		footer,
		actions,
		children,
		...rest
	}: Omit<HTMLAttributes<HTMLElement>, keyof Own> & Own = $props();
	const t = $derived(canonicalTone(tone));

	let stackStyle = $derived(
		stacked ? `--stack-y:${stackY}px;--stack-x:${stackX}px;` : ''
	);
	const framed = $derived(!!(header || footer || title));
	const native = $derived(as === 'button' || as === 'a');

	let el = $state<HTMLElement>();
	const lit = $derived(tap || interactive);

	// The spotlight follows the pointer itself unless the app already runs trackPointer().
	$effect(() => {
		const node = el;
		if (!node || !lit) return;
		let frame = 0;
		let x = 0;
		let y = 0;
		const flush = () => {
			frame = 0;
			const r = node.getBoundingClientRect();
			node.style.setProperty('--pointer-x', `${x - r.left}px`);
			node.style.setProperty('--pointer-y', `${y - r.top}px`);
		};
		const move = (e: PointerEvent) => {
			if (e.pointerType !== 'mouse') return;
			x = e.clientX;
			y = e.clientY;
			if (!frame) frame = requestAnimationFrame(flush);
		};
		const enter = (e: PointerEvent) => {
			if (e.pointerType !== 'mouse' || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
			if (getComputedStyle(node).getPropertyValue('--card-fx').trim() !== 'spotlight') return;
			move(e);
			node.addEventListener('pointermove', move, { passive: true });
		};
		const leave = () => node.removeEventListener('pointermove', move);
		node.addEventListener('pointerenter', enter, { passive: true });
		node.addEventListener('pointerleave', leave, { passive: true });
		return () => {
			leave();
			node.removeEventListener('pointerenter', enter);
			node.removeEventListener('pointerleave', leave);
			if (frame) cancelAnimationFrame(frame);
		};
	});

	const NESTED = 'button,a,input,select,textarea,[role=button],[contenteditable],[contenteditable=true]';
	function fromNested(e: Event): boolean {
		const target = e.target as Element | null;
		const hit = target?.closest?.(NESTED);
		return !!hit && hit !== e.currentTarget;
	}
	function handleClick(e: MouseEvent) {
		if (!onclick) return;
		if (interactive && fromNested(e)) return;
		onclick(e);
	}
	function handleKeydown(e: KeyboardEvent) {
		if (!interactive || native || !onclick) return;
		if (e.key !== 'Enter' && e.key !== ' ') return;
		if (fromNested(e)) return;
		if (e.key === ' ') e.preventDefault();
		onclick(e);
	}
</script>

<svelte:element
	this={as}
	bind:this={el}
	data-tsu="Card"
	class="card {klass}"
	class:pad-none={padding === 'none'}
	class:pad-sm={padding === 'sm'}
	class:pad-lg={padding === 'lg'}
	class:surface-raised={surface === 'raised'}
	class:surface-sunken={surface === 'sunken'}
	class:border-dashed={border === 'dashed'}
	class:border-none={border === 'none'}
	class:card-tap={tap || interactive}
	class:card-max={maxWidth !== undefined}
	class:card-ok={t === 'ok'}
	class:card-warn={t === 'warn'}
	class:card-danger={t === 'danger'}
	class:card-info={t === 'info'}
	class:card-attention={t === 'attention'}
	class:card-accent={t === 'accent'}
	class:card-stacked={stacked}
	class:stack-ok={stacked && stackTone === 'ok'}
	class:stack-warn={stacked && stackTone === 'warn'}
	class:stack-danger={stacked && stackTone === 'danger'}
	class:stack-info={stacked && stackTone === 'info'}
	class:card-framed={framed}
	class:card-gap={!framed && gap !== undefined}
	style:--card-gap={gap}
	style:max-width={maxWidth}
	style:overflow={overflow}
	style={`${stackStyle}${style}`}
	role={interactive && !native ? 'button' : undefined}
	tabindex={interactive && !native ? 0 : undefined}
	type={as === 'button' ? type : undefined}
	onclick={handleClick}
	onkeydown={handleKeydown}
	{...rest}
>
	{#if framed}
		{#if title}
			<div class="card-head">
				<SectionHeader {title} {subtitle} {actions} level={3} size="md" />
			</div>
		{:else if header}
			<div class="card-head">{@render header()}</div>
		{/if}
		<div class="card-body" class:card-gap={gap !== undefined}>{@render children?.()}</div>
		{#if footer}
			<div class="card-foot">{@render footer()}</div>
		{/if}
	{:else}
		{@render children?.()}
	{/if}
	{#if lit}<span class="card-fx" aria-hidden="true"></span>{/if}
</svelte:element>

<style>
	.card {
		--card-pad: var(--sp-4);
		min-width: 0;
		background: var(--surface-fill);
		--card-border-style: solid;
		border: var(--edge-width) var(--card-border-style) var(--surface-edge);
		border-radius: var(--r-lg);
		--card-shadow-rest: var(--surface-shadow);
		box-shadow: var(--card-shadow-rest);
		padding: var(--card-pad);
	}
	.card-gap {
		display: flex;
		flex-direction: column;
		gap: var(--card-gap);
	}
	.card-framed {
		padding: 0;
	}
	.card-head,
	.card-body,
	.card-foot {
		padding: var(--card-pad);
	}
	.card-head {
		border-bottom: var(--edge-width) solid var(--surface-edge);
	}
	.card-foot {
		border-top: var(--edge-width) solid var(--surface-edge);
	}
	/* Theme-aware surface shade, selected by prop so it adapts across themes
	   instead of being overridden with app-level :global hacks. `base` is the
	   default (.card already paints --bg-elevated). */
	.surface-raised {
		background: var(--surface);
	}
	.surface-sunken {
		background: var(--surface-fill-2);
	}
	.border-dashed {
		--card-border-style: dashed;
	}
	.border-none {
		--card-border-style: none;
	}
	.pad-none {
		--card-pad: 0;
		padding: 0;
	}
	.pad-sm {
		--card-pad: var(--sp-2);
		padding: var(--sp-2);
	}
	.pad-lg {
		--card-pad: var(--sp-6);
		padding: var(--sp-6);
	}
	.card-framed.pad-none,
	.card-framed.pad-sm,
	.card-framed.pad-lg {
		padding: 0;
	}
	.card-tap {
		cursor: pointer;
		transition:
			border-color var(--dur-fast) var(--ease),
			background var(--dur-fast) var(--ease),
			box-shadow var(--dur-fast) var(--ease),
			translate var(--dur-fast) var(--ease-out),
			scale var(--dur-fast) var(--ease-out);
	}
	.card-tap:active {
		background: var(--surface-fill-2);
		scale: var(--press-scale-lg);
		transition-duration: var(--dur-press);
	}
	@media (hover: hover) and (pointer: fine) {
		.card-tap:hover {
			border-color: var(--surface-edge-strong);
			translate: 0 calc(-1 * var(--hover-lift));
			--card-shadow-rest: var(--surface-shadow-hover);
			--card-glow: 100%;
			--card-lit: 1;
			--card-fade: var(--dur-fast);
			--card-spin: var(--card-orbit-spin);
		}
	}
	.card-tap:focus-visible {
		--card-glow: 100%;
		--card-lit: 1;
		--card-fade: var(--dur-fast);
		--card-spin: var(--card-orbit-spin);
	}

	@media (hover: hover) and (pointer: fine) {
		.card-tap:hover > .card-fx {
			--card-orbit: 360deg;
		}
	}
	.card-tap:focus-visible > .card-fx {
		--card-orbit: 360deg;
	}

	/* Hover light for tappable cards: a wash on the surface plus a ring on the edge. */
	.card-tap {
		position: relative;
	}
	.card-fx {
		position: absolute;
		inset: calc(-1 * var(--edge-width));
		padding: 1.5px;
		border-radius: inherit;
		pointer-events: none;
		opacity: var(--card-lit, 0);
		mask:
			linear-gradient(var(--text), var(--text)) content-box exclude,
			linear-gradient(var(--text), var(--text));
		transition:
			opacity var(--card-fade, var(--dur-exit)) ease,
			--card-orbit var(--card-spin, var(--dur-instant)) var(--ease-out);
	}
	.card-tap:not(:global([data-fx-card='none']) *),
	:global(:is([data-fx-card='spotlight'], [data-fx-card='orbit'])) .card-tap:not(:global(:is([data-fx-card='spotlight'], [data-fx-card='orbit']) [data-fx-card='none']) *) {
		transition:
			border-color var(--dur-fast) var(--ease),
			background var(--dur-fast) var(--ease),
			box-shadow var(--dur-fast) var(--ease),
			translate var(--dur-fast) var(--ease-out),
			scale var(--dur-fast) var(--ease-out),
			--card-glow var(--card-fade, var(--dur-exit)) ease;
	}

	/* Spotlight: a soft light follows the pointer and lights the nearest edge. */
	.card-tap:not(:global([data-fx-card]:not([data-fx-card='spotlight'])) *),
	:global([data-fx-card='spotlight']) .card-tap:not(:global([data-fx-card='spotlight'] [data-fx-card]:not([data-fx-card='spotlight'])) *) {
		--card-fx: spotlight;
		background-image: radial-gradient(
			circle 11rem at var(--card-spot-x) var(--card-spot-y),
			color-mix(in srgb, var(--accent) calc(var(--card-glow) * 0.2), transparent),
			transparent 70%
		);
		--card-spot-x: var(--pointer-x, 50%);
		--card-spot-y: var(--pointer-y, 33%);
		& .card-fx {
			background: radial-gradient(
				circle 7rem at calc(var(--card-spot-x) + var(--edge-width)) calc(var(--card-spot-y) + var(--edge-width)),
				var(--accent) 15%,
				transparent
			);
		}
	}

	/* Border orbit: on hover-enter a comet makes exactly one revolution of the edge, then rests. */
	:global([data-fx-card='orbit']) .card-tap:not(:global([data-fx-card='orbit'] [data-fx-card]:not([data-fx-card='orbit'])) *) {
		--card-fx: orbit;
		background-image: linear-gradient(
			160deg,
			color-mix(in srgb, var(--accent) calc(var(--card-glow) * 0.09), transparent),
			transparent 55%
		);
		--card-orbit-spin: calc(var(--dur-slow) * 4);
		& .card-fx {
			background:
				conic-gradient(
					from var(--card-orbit),
					transparent 0 62%,
					color-mix(in srgb, var(--accent) 40%, transparent) 80%,
					var(--accent) 92%,
					color-mix(in srgb, var(--text) 85%, var(--accent)) 96%,
					transparent 100%
				),
				linear-gradient(color-mix(in srgb, var(--accent) 22%, transparent), color-mix(in srgb, var(--accent) 22%, transparent));
		}
	}
	@property --card-glow {
		syntax: '<percentage>';
		inherits: false;
		initial-value: 0%;
	}
	@property --card-orbit {
		syntax: '<angle>';
		inherits: false;
		initial-value: 0deg;
	}
	.card-max {
		width: 100%;
	}

	.card-ok {
		--card-tone: var(--ok);
	}
	.card-warn {
		--card-tone: var(--warn);
	}
	.card-danger {
		--card-tone: var(--danger);
	}
	.card-info {
		--card-tone: var(--info);
	}
	.card-attention {
		--card-tone: var(--attention-bar);
	}
	.card-accent {
		--card-tone: var(--accent);
	}
	.card-ok,
	.card-warn,
	.card-danger,
	.card-info,
	.card-accent,
	.card-attention {
		border-color: color-mix(in srgb, var(--card-tone) 55%, var(--surface-edge));
		background: color-mix(in srgb, var(--card-tone) 8%, var(--surface-fill));
	}
	.card-attention {
		background: var(--attention-bg);
		box-shadow: inset 3px 0 0 var(--attention-bar);
	}

	/* Stacked effect — two back layers peeking out bottom-right. The front
	   surface keeps its own background so the layers only show at the edges. */
	.card-stacked {
		position: relative;
		/* Defaults; overridden inline by the stackY/stackX props. */
		--stack-y: 8px;
		--stack-x: 2px;
		--stack-bg: var(--surface-fill-2);
		--stack-border: var(--surface-edge);
		/* Reserve room for the two peeking layers so they aren't clipped. */
		margin-right: calc(var(--stack-x) * 2);
		margin-bottom: calc(var(--stack-y) * 2);
	}
	.card-stacked::before,
	.card-stacked::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		/* Opaque fill so each layer fully hides the one behind it — only the
		   bottom-right peek (and its single border line) stays visible. */
		background: var(--stack-bg);
		border: var(--edge-width) var(--card-border-style) var(--stack-border);
	}
	/* Nearest back layer — sits just under the front surface. */
	.card-stacked::before {
		z-index: -1;
		transform: translate(var(--stack-x), var(--stack-y));
	}
	/* Furthest back layer — behind the nearest one. */
	.card-stacked::after {
		z-index: -2;
		transform: translate(
			calc(var(--stack-x) * 2),
			calc(var(--stack-y) * 2)
		);
	}

	.stack-ok {
		--stack-border: color-mix(in srgb, var(--ok) 45%, transparent);
		--stack-bg: color-mix(in srgb, var(--ok) 12%, var(--bg-elevated));
	}
	.stack-warn {
		--stack-border: color-mix(in srgb, var(--warn) 45%, transparent);
		--stack-bg: color-mix(in srgb, var(--warn) 12%, var(--bg-elevated));
	}
	.stack-danger {
		--stack-border: color-mix(in srgb, var(--danger) 45%, transparent);
		--stack-bg: color-mix(in srgb, var(--danger) 12%, var(--bg-elevated));
	}
	.stack-info {
		--stack-border: color-mix(in srgb, var(--info) 45%, transparent);
		--stack-bg: color-mix(in srgb, var(--info) 12%, var(--bg-elevated));
	}
</style>
