<script lang="ts">
	// Elevated surface primitive — the canonical card/panel container. Owns its
	// background/border/radius/padding from theme tokens. `tap` adds the
	// interactive hover/active affordance for tappable list items (e.g. session
	// rows); `as` lets it be a button/anchor when the whole surface is clickable.
	// `padding` dials the inner spacing (none/sm/md/lg) for denser cards.
	// `tone` tints the surface itself (border + faint background wash) with a
	// semantic hue for inline banners; `neutral` is the plain card.
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

	type Tone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info';

	let {
		tap = false,
		as = 'div',
		padding = 'md',
		surface = 'base',
		tone = 'neutral',
		stacked = false,
		stackTone = 'neutral',
		stackY = 8,
		stackX = 2,
		title,
		subtitle,
		gap,
		class: klass = '',
		style = '',
		header,
		footer,
		actions,
		children,
		...rest
	}: {
		tap?: boolean;
		as?: 'div' | 'button' | 'a' | 'li' | 'section' | 'form';
		padding?: 'none' | 'sm' | 'md' | 'lg';
		surface?: 'base' | 'raised' | 'sunken';
		tone?: Tone;
		stacked?: boolean;
		stackTone?: Tone;
		stackY?: number;
		stackX?: number;
		title?: string;
		subtitle?: string;
		gap?: string;
		class?: string;
		style?: string;
		header?: Snippet;
		footer?: Snippet;
		actions?: Snippet;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();

	let stackStyle = $derived(
		stacked ? `--stack-y:${stackY}px;--stack-x:${stackX}px;` : ''
	);
	const framed = $derived(!!(header || footer || title));
</script>

<svelte:element
	this={as}
	data-tsu="Card"
	class="card {klass}"
	class:pad-none={padding === 'none'}
	class:pad-sm={padding === 'sm'}
	class:pad-lg={padding === 'lg'}
	class:surface-raised={surface === 'raised'}
	class:surface-sunken={surface === 'sunken'}
	class:card-tap={tap}
	class:card-ok={tone === 'ok'}
	class:card-warn={tone === 'warn'}
	class:card-danger={tone === 'danger'}
	class:card-info={tone === 'info'}
	class:card-stacked={stacked}
	class:stack-ok={stacked && stackTone === 'ok'}
	class:stack-warn={stacked && stackTone === 'warn'}
	class:stack-danger={stacked && stackTone === 'danger'}
	class:stack-info={stacked && stackTone === 'info'}
	class:card-framed={framed}
	class:card-gap={!framed && gap !== undefined}
	style:--card-gap={gap}
	style={`${stackStyle}${style}`}
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
</svelte:element>

<style>
	.card {
		--card-pad: var(--sp-4);
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--r-lg);
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
		border-bottom: 1px solid var(--border);
	}
	.card-foot {
		border-top: 1px solid var(--border);
	}
	/* Theme-aware surface shade, selected by prop so it adapts across themes
	   instead of being overridden with app-level :global hacks. `base` is the
	   default (.card already paints --bg-elevated). */
	.surface-raised {
		background: var(--surface);
	}
	.surface-sunken {
		background: var(--bg-elevated-2);
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
			border-color 0.12s var(--ease),
			background 0.12s var(--ease);
	}
	.card-tap:active {
		background: var(--bg-elevated-2);
	}
	.card-tap:hover {
		border-color: var(--border-strong);
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
	.card-ok,
	.card-warn,
	.card-danger,
	.card-info {
		border-color: color-mix(in srgb, var(--card-tone) 55%, var(--border));
		background: color-mix(in srgb, var(--card-tone) 8%, var(--bg-elevated));
	}

	/* Stacked effect — two back layers peeking out bottom-right. The front
	   surface keeps its own background so the layers only show at the edges. */
	.card-stacked {
		position: relative;
		/* Defaults; overridden inline by the stackY/stackX props. */
		--stack-y: 8px;
		--stack-x: 2px;
		--stack-bg: var(--bg-elevated-2);
		--stack-border: var(--border);
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
		border: 1px solid var(--stack-border);
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
