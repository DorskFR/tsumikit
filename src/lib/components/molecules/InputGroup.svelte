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
	style:--ig-leading-w="{leadingW}px"
	style:--ig-trailing-w="{trailingW}px"
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
	   sit beside a narrower field. The field reads --ig-leading-w /
	   --ig-trailing-w to keep its text clear of them. Once a textarea is taller
	   than one row it reports `bar`: the adornments then sit in a band under
	   the text (::before continues the field's border), so every line runs
	   full width and the scrollbar ends above the controls. */
	.ig {
		--ig-h: var(--control-height-default);
		--ig-pad-x: var(--sp-3);
		--ig-gap: var(--sp-2);
		--ig-inset: 2px;
		--ig-radius: var(--r-md);
		position: relative;
		display: flex;
		width: 100%;
	}
	.ig-sm {
		--ig-h: var(--control-height-compact);
		--ig-pad-x: var(--sp-2);
		--ig-gap: var(--sp-1);
	}
	.ig-lg {
		--ig-h: var(--control-height-large);
		--ig-pad-x: var(--sp-4);
	}
	.ig-field {
		width: 100%;
		min-width: 0;
	}
	/* The adornments fill the field inside its 1px border, their outer corners
	   following the field's; inner corners go square. In the bar they hug the
	   bottom and side borders, so only the bottom-outer corner is rounded. */
	.ig-adorn {
		--ig-fuse-r: calc(var(--ig-radius) - 1px);
		position: absolute;
		top: 1px;
		bottom: 1px;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: var(--ig-inset);
		pointer-events: none;
	}
	.ig-leading {
		inset-inline-start: 1px;
	}
	.ig-trailing {
		inset-inline-end: 1px;
	}
	.ig-adorn > :global(*) {
		pointer-events: auto;
		align-self: stretch;
		height: auto;
		min-height: 0;
		--btn-size: 100%;
		--btn-radius: 0;
		--pop-trigger-radius: 0;
		border-radius: 0;
	}
	.ig-adorn > :global(:is(.btn-box, .btn-square, .btn-icon, .icon-only)) {
		width: auto;
		min-width: 0;
		aspect-ratio: 1;
	}
	.ig-leading > :global(:first-child) {
		--btn-radius: var(--ig-fuse-r) 0 0 var(--ig-fuse-r);
		border-radius: var(--ig-fuse-r) 0 0 var(--ig-fuse-r);
	}
	.ig-trailing > :global(:last-child) {
		--btn-radius: 0 var(--ig-fuse-r) var(--ig-fuse-r) 0;
		border-radius: 0 var(--ig-fuse-r) var(--ig-fuse-r) 0;
	}
	.ig-adorn :global(.split-main) {
		--btn-radius: 0;
	}
	.ig-adorn :global(.split-caret) {
		--pop-trigger-radius: 0;
	}
	.ig-adorn :global(.split-caret .pop-trigger) {
		height: 100%;
	}
	.ig-leading > :global(:first-child .split-main) {
		--btn-radius: var(--ig-fuse-r) 0 0 var(--ig-fuse-r);
	}
	.ig-trailing > :global(:last-child .split-caret) {
		--pop-trigger-radius: 0 var(--ig-fuse-r) var(--ig-fuse-r) 0;
	}
	.ig-bar .ig-adorn {
		top: auto;
		height: calc(var(--ig-h) - 1px);
	}
	.ig-bar .ig-leading > :global(:first-child) {
		--btn-radius: 0 0 0 var(--ig-fuse-r);
		border-radius: 0 0 0 var(--ig-fuse-r);
	}
	.ig-bar .ig-trailing > :global(:last-child) {
		--btn-radius: 0 0 var(--ig-fuse-r) 0;
		border-radius: 0 0 var(--ig-fuse-r) 0;
	}
	.ig-bar .ig-leading > :global(:first-child .split-main) {
		--btn-radius: 0 0 0 var(--ig-fuse-r);
	}
	.ig-bar .ig-trailing > :global(:last-child .split-caret) {
		--pop-trigger-radius: 0 0 var(--ig-fuse-r) 0;
	}
	.ig-bar .ig-field {
		padding-bottom: var(--ig-h);
	}
	.ig-bar::before {
		content: '';
		position: absolute;
		inset: auto 0 0 0;
		height: var(--ig-h);
		background: var(--textarea-bg, var(--bg));
		border: 1px solid var(--textarea-border, var(--border-strong));
		border-top: 0;
		border-radius: 0 0 var(--ig-radius) var(--ig-radius);
		transition: border-color 0.12s var(--ease);
		pointer-events: none;
	}
	.ig-bar:has(.ig-field :global(:focus))::before {
		border-color: var(--accent);
	}
	.ig-bar:has(.ig-field :global([aria-invalid='true']))::before {
		border-color: var(--danger);
	}
	.ig:has(:focus-visible)::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: var(--ig-radius);
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
		pointer-events: none;
	}
	.ig.disabled {
		opacity: 0.45;
	}
	.ig.disabled .ig-adorn > :global(:disabled) {
		opacity: 1;
	}
</style>
