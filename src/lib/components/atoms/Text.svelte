<script lang="ts">
	import { canonicalTone, type Tone } from '$lib/tone';
	// Text primitive: the ONLY place body/label/caption/code text and its bearing
	// elements (<p>/<span>/<label>/<div> of pure text) are emitted. `variant` picks
	// a token preset; `tone`/`weight`/`size` override individual axes; bare <Text>
	// (no props) inherits the surrounding style like a plain <span> so it can wrap
	// inline glue text without changing rendering. All values come from tokens.
	import type { Snippet } from 'svelte';


	type Size = 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl';

	let {
		as = 'span',
		variant,
		tone = 'inherit',
		weight,
		size,
		numeric = false,
		truncate = false,
		italic = false,
		nowrap = false,
		wrap = 'normal',
		uppercase = false,
		leading,
		measure,
		grow = false,
		scale = true,
		block = false,
		class: klass = '',
		children,
		...rest
	}: {
		as?: 'span' | 'p' | 'div' | 'label';
		// body: default reading text · label: form-label · caption: small meta ·
		// code: monospace · eyebrow: small uppercase muted kicker. Omit for inline
		// glue that should inherit its parent.
		variant?: 'body' | 'label' | 'caption' | 'code' | 'eyebrow';
		// `ok` and `success` are aliases.
		tone?: 'inherit' | 'default' | 'muted' | 'faint' | Tone;
		weight?: 'normal' | 'medium' | 'semibold' | 'bold';
		size?: Size;
		// Tabular figures: digits share a fixed advance width so counts/percentages
		// don't jitter as they change. Use for counters, timers, metrics.
		numeric?: boolean;
		truncate?: boolean;
		italic?: boolean;
		nowrap?: boolean;
		wrap?: 'normal' | 'anywhere' | 'balance';
		uppercase?: boolean;
		leading?: 'tight' | 'normal' | 'none';
		// CSS max-width for the line measure, e.g. "60ch".
		measure?: string;
		grow?: boolean;
		// false pins the size to its unscaled px value, ignoring --fs-scale.
		scale?: boolean;
		block?: boolean;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();

	const toneClass = $derived(
		tone === 'neutral' ? 'default' : canonicalTone(tone) === 'ok' ? 'success' : canonicalTone(tone)
	);
	const styleAttr = $derived(measure ? `max-width: ${measure}` : undefined);
</script>

<svelte:element
	this={as}
	data-tsu="Text"
	class="text {variant ? `v-${variant}` : ''} tone-{toneClass} {weight ? `fw-${weight}` : ''} {size
		? `fs-${size}`
		: ''} {numeric ? 'numeric' : ''} {truncate ? 'truncate' : ''} {leading ? `lh-${leading}` : ''} {wrap !==
	'normal'
		? `wrap-${wrap}`
		: ''} {klass}"
	class:italic
	class:nowrap
	class:uppercase
	class:grow
	class:block
	class:noscale={!scale}
	style={styleAttr}
	{...rest}
>
	{@render children?.()}
</svelte:element>

<style>
	/* Base: inherit everything — a bare <Text> renders like a plain span. */
	.text {
		margin: 0;
	}
	/* Variants (presets) — listed before tone/weight/size so those override. */
	.v-body {
		font-size: var(--fs-base);
		line-height: var(--lh-normal);
		color: var(--text);
	}
	.v-label {
		font-size: var(--fs-sm);
		font-weight: var(--fw-medium);
		color: var(--text-muted);
	}
	.v-caption {
		font-size: var(--fs-xs);
		color: var(--text-faint);
	}
	.v-code {
		font-family: var(--font-mono);
		font-size: 0.92em;
	}
	.v-eyebrow {
		font-size: var(--fs-xs);
		color: var(--text-muted);
		font-weight: var(--fw-medium);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	/* Tone (colour) — overrides variant colour. */
	.tone-default {
		color: var(--text);
	}
	.tone-muted {
		color: var(--text-muted);
	}
	.tone-faint {
		color: var(--text-faint);
	}
	.tone-success {
		color: var(--ok);
	}
	.tone-warn {
		color: var(--warn);
	}
	.tone-danger {
		color: var(--danger);
	}
	.tone-info {
		color: var(--info);
	}
	.tone-accent {
		color: var(--accent);
	}
	/* Weight — overrides variant weight. */
	.fw-normal {
		font-weight: var(--fw-normal);
	}
	.fw-medium {
		font-weight: var(--fw-medium);
	}
	.fw-semibold {
		font-weight: var(--fw-semibold);
	}
	.fw-bold {
		font-weight: var(--fw-bold);
	}
	/* Size — overrides variant size (listed last so it wins). */
	.fs-xs {
		font-size: var(--fs-xs);
	}
	.fs-sm {
		font-size: var(--fs-sm);
	}
	.fs-base {
		font-size: var(--fs-base);
	}
	.fs-md {
		font-size: var(--fs-md);
	}
	.fs-lg {
		font-size: var(--fs-lg);
	}
	.fs-xl {
		font-size: var(--fs-xl);
	}
	.fs-2xl {
		font-size: var(--fs-2xl);
	}
	.noscale.fs-xs {
		font-size: 12px;
	}
	.noscale.fs-sm {
		font-size: 13px;
	}
	.noscale.fs-base {
		font-size: 15px;
	}
	.noscale.fs-md {
		font-size: 16px;
	}
	.noscale.fs-lg {
		font-size: 18px;
	}
	.noscale.fs-xl {
		font-size: 22px;
	}
	.noscale.fs-2xl {
		font-size: 28px;
	}
	.italic {
		font-style: italic;
	}
	.nowrap {
		white-space: nowrap;
	}
	.wrap-anywhere {
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.wrap-balance {
		text-wrap: balance;
	}
	.uppercase {
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.lh-tight {
		line-height: var(--lh-tight);
	}
	.lh-normal {
		line-height: var(--lh-normal);
	}
	.lh-none {
		line-height: 1;
	}
	.grow {
		flex: 1 1 0;
		min-width: 0;
	}
	.block {
		display: block;
	}
	.numeric {
		font-variant-numeric: tabular-nums;
		font-feature-settings: 'tnum';
	}
	/* `text-overflow: ellipsis` is a no-op on an inline box, so a truncated bare
	   <Text> (default as="span") would overrun its container instead of clipping.
	   inline-block gives it a block formatting context so the ellipsis applies,
	   while max-width keeps it from overflowing the parent; on block elements
	   (as="p"/"div") these are harmless. */
	.truncate {
		display: inline-block;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}
</style>
