<script lang="ts">
	// Elevated surface primitive — the canonical card/panel container. Owns its
	// background/border/radius/padding from theme tokens. `tap` adds the
	// interactive hover/active affordance for tappable list items (e.g. session
	// rows); `as` lets it be a button/anchor when the whole surface is clickable.
	// `padding` dials the inner spacing (none/sm/md/lg) for denser cards.
	//
	// `stacked` fakes a pile of cards by drawing two layers peeking out below
	// (and optionally to the right) via pseudo-elements. `stackTone` tints those
	// back layers with a semantic hue (e.g. `info` for a blue stack); `neutral`
	// keeps them on the plain border colour. `stackY`/`stackX` set the per-layer
	// vertical / horizontal offset in px (vertical spacing stays even across the
	// 3 borders); horizontal defaults to a tiny 2px peek.
	import type { Snippet } from 'svelte';

	type Tone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info';

	let {
		tap = false,
		as = 'div',
		padding = 'md',
		stacked = false,
		stackTone = 'neutral',
		stackY = 8,
		stackX = 2,
		class: klass = '',
		style = '',
		children,
		...rest
	}: {
		tap?: boolean;
		as?: 'div' | 'button' | 'a' | 'li' | 'section' | 'form';
		padding?: 'none' | 'sm' | 'md' | 'lg';
		stacked?: boolean;
		stackTone?: Tone;
		stackY?: number;
		stackX?: number;
		class?: string;
		style?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();

	let stackStyle = $derived(
		stacked ? `--stack-y:${stackY}px;--stack-x:${stackX}px;` : ''
	);
</script>

<svelte:element
	this={as}
	class="card {klass}"
	class:pad-none={padding === 'none'}
	class:pad-sm={padding === 'sm'}
	class:pad-lg={padding === 'lg'}
	class:card-tap={tap}
	class:card-stacked={stacked}
	class:stack-ok={stacked && stackTone === 'ok'}
	class:stack-warn={stacked && stackTone === 'warn'}
	class:stack-danger={stacked && stackTone === 'danger'}
	class:stack-info={stacked && stackTone === 'info'}
	style={`${stackStyle}${style}`}
	{...rest}
>
	{@render children?.()}
</svelte:element>

<style>
	.card {
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--r-lg);
		padding: var(--sp-4);
	}
	.pad-none {
		padding: 0;
	}
	.pad-sm {
		padding: var(--sp-2);
	}
	.pad-lg {
		padding: var(--sp-6);
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
