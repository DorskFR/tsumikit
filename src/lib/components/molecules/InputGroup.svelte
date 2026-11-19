<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { HTMLAttributes } from 'svelte/elements';
	import { setInputGroupContext } from '$lib/input-group-context';
	import type { ControlSize } from '$lib/size';

	type Own = {
		/** Overlaid at the inline start of the field, e.g. an icon-only FileButton. */
		leading?: Snippet;
		/** The field: an Input or Textarea, optionally wrapped by the consumer. */
		children: Snippet;
		/** Overlaid at the inline end of the field, e.g. a Button or SplitButton. */
		trailing?: Snippet;
		/** `end` pins the adornments to the bottom edge as a textarea grows;
		 *  `center` is for a single-line Input. */
		align?: 'end' | 'center';
		size?: ControlSize;
		disabled?: boolean;
		error?: boolean;
		class?: string;
		style?: string;
	};

	let {
		leading,
		children,
		trailing,
		align = 'end',
		size = 'md',
		disabled = false,
		error = false,
		class: klass = '',
		style: styleProp = '',
		...rest
	}: Omit<HTMLAttributes<HTMLDivElement>, keyof Own> & Own = $props();

	setInputGroupContext({
		get size() {
			return size;
		},
		get disabled() {
			return disabled;
		},
		get invalid() {
			return error;
		},
		get leadingW() {
			return leadingW;
		},
		get trailingW() {
			return trailingW;
		},
		get bar() {
			return bar;
		},
		setBar(next) {
			bar = next && !!(leading || trailing);
		}
	});

	let leadingW = $state(0);
	let trailingW = $state(0);
	let bar = $state(false);

	function measure(set: (width: number) => void): Attachment {
		return (node) => {
			if (typeof ResizeObserver === 'undefined') return;
			const ro = new ResizeObserver((entries) => {
				for (const entry of entries)
					set(entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width);
			});
			ro.observe(node);
			return () => {
				ro.disconnect();
				set(0);
			};
		};
	}
	const measureLeading = measure((w) => (leadingW = w));
	const measureTrailing = measure((w) => (trailingW = w));
</script>

<div
	{...rest}
	data-tsu="InputGroup"
	class="ig {klass}"
	class:ig-center={align === 'center'}
	class:ig-bar={bar}
	class:ig-sm={size === 'sm'}
	class:ig-lg={size === 'lg'}
	class:disabled
	style={styleProp}
>
	{#if leading}
		<div class="ig-adorn ig-leading" {@attach measureLeading}>{@render leading()}</div>
	{/if}
	<div class="ig-field">{@render children()}</div>
	{#if trailing}
		<div class="ig-adorn ig-trailing" {@attach measureTrailing}>{@render trailing()}</div>
	{/if}
</div>

<style>
	/* The field's own border box spans the whole group: Gecko zooms to the
	   focused element's rect on mobile, so the adornments must overlay it, never
	   sit beside a narrower field. The field reads the measured adornment widths
	   from the group context to keep its text clear of them. Once a textarea is taller
	   than one row it reports `bar`: the adornments then sit in a band under
	   the text (::before continues the field's border), so every line runs
	   full width and the scrollbar ends above the controls. */
	.ig {
		position: relative;
		display: flex;
		width: 100%;
	}
	.ig-field {
		width: 100%;
		min-width: 0;
	}
	/* The adornments fill the field inside its 1px border, their outer corners
	   following the field's; inner corners go square. In the bar they hug the
	   bottom and side borders, so only the bottom-outer corner is rounded. */
	.ig-adorn {
		position: absolute;
		top: var(--sp-px);
		bottom: var(--sp-px);
		z-index: 1;
		display: flex;
		align-items: center;
		gap: var(--sp-0-5);
		pointer-events: none;
	}
	.ig-leading {
		inset-inline-start: var(--sp-px);
	}
	.ig-trailing {
		inset-inline-end: var(--sp-px);
	}
	.ig-adorn > :global(*) {
		pointer-events: auto;
		align-self: stretch;
		border-radius: 0;
	}
	.ig .ig-adorn :global(:is(.btn, .btn-control, .pop-trigger)) {
		border-radius: 0;
	}
	.ig .ig-adorn :global(:is(.btn, .btn-control)) {
		min-height: 100%;
	}
	.ig .ig-adorn :global(.btn-control) {
		height: 100%;
	}
	.ig .ig-adorn :global(.btn-square) {
		width: 100%;
		min-width: 100%;
	}
	/* The doubled class outranks an adornment's own fixed box (e.g. FileButton `box`). */
	.ig.ig .ig-adorn > :global(*) {
		height: auto;
		min-height: 0;
	}
	.ig .ig-adorn > :global(:is(.btn-box, .btn-square, .btn-icon, .icon-only)) {
		width: auto;
		min-width: 0;
		aspect-ratio: 1;
	}
	.ig .ig-leading > :global(:first-child),
	.ig .ig-leading > :global(:first-child :is(.btn, .btn-control)) {
		border-radius: calc(var(--r-md) - var(--sp-px)) 0 0 calc(var(--r-md) - var(--sp-px));
	}
	.ig .ig-trailing > :global(:last-child),
	.ig .ig-trailing > :global(:last-child :is(.btn, .btn-control)) {
		border-radius: 0 calc(var(--r-md) - var(--sp-px)) calc(var(--r-md) - var(--sp-px)) 0;
	}
	.ig-adorn :global(.split-caret .pop-trigger) {
		height: 100%;
	}
	.ig .ig-trailing > :global(:last-child .split-caret .pop-trigger) {
		border-radius: 0 calc(var(--r-md) - var(--sp-px)) calc(var(--r-md) - var(--sp-px)) 0;
	}
	.ig-bar .ig-adorn {
		top: auto;
		height: calc(var(--control-height-default) - var(--sp-px));
	}
	.ig-sm.ig-bar .ig-adorn {
		height: calc(var(--control-height-compact) - var(--sp-px));
	}
	.ig-lg.ig-bar .ig-adorn {
		height: calc(var(--control-height-large) - var(--sp-px));
	}
	.ig-bar .ig-leading > :global(:first-child),
	.ig-bar .ig-leading > :global(:first-child :is(.btn, .btn-control)) {
		border-radius: 0 0 0 calc(var(--r-md) - var(--sp-px));
	}
	.ig-bar .ig-trailing > :global(:last-child),
	.ig-bar .ig-trailing > :global(:last-child :is(.btn, .btn-control)) {
		border-radius: 0 0 calc(var(--r-md) - var(--sp-px)) 0;
	}
	.ig-bar .ig-trailing > :global(:last-child .split-caret .pop-trigger) {
		border-radius: 0 0 calc(var(--r-md) - var(--sp-px)) 0;
	}
	.ig .ig-trailing > :global(:last-child .split-main :is(.btn, .btn-control)) {
		border-radius: 0;
	}
	.ig-bar .ig-field {
		padding-bottom: var(--control-height-default);
	}
	.ig-sm.ig-bar .ig-field {
		padding-bottom: var(--control-height-compact);
	}
	.ig-lg.ig-bar .ig-field {
		padding-bottom: var(--control-height-large);
	}
	.ig-bar::before {
		content: '';
		position: absolute;
		inset: auto 0 0 0;
		height: var(--control-height-default);
		background: var(--control-fill);
		border: var(--edge-width) solid var(--control-edge);
		border-top: 0;
		border-radius: 0 0 var(--r-md) var(--r-md);
		transition: border-color var(--dur-fast) ease;
		pointer-events: none;
	}
	.ig-sm.ig-bar::before {
		height: var(--control-height-compact);
	}
	.ig-lg.ig-bar::before {
		height: var(--control-height-large);
	}
	.ig-bar:has(.ig-field :global(:focus))::before {
		border-color: var(--accent);
	}
	.ig-bar:has(.ig-field :global([aria-invalid='true']))::before {
		border-color: var(--danger);
	}
	.ig:has(:global(:focus-visible))::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: var(--r-md);
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
		pointer-events: none;
	}
	.ig.disabled {
		opacity: var(--disabled-opacity);
		cursor: not-allowed;
	}
	.ig.disabled .ig-adorn > :global(:disabled) {
		opacity: 1;
	}
</style>
