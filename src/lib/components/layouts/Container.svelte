<script lang="ts">
	// Max-width content column with token gutters that respect safe-area insets.
	// Self-contained: does not depend on the global `.container` utility. A child
	// bleeds to the column edge with a negative `margin-inline` of the gutter.
	import type { Snippet } from 'svelte';
	import { browser } from '$lib/env';

	let {
		as = 'div',
		size,
		gutter,
		align = 'center',
		pad = false,
		fullWidth = false,
		inset,
		class: klass = '',
		children,
		...rest
	}: {
		as?: 'div' | 'main' | 'section' | 'article';
		/** Max width (any CSS length), or `'none'` to fill the parent. Defaults to --content-max. Ignored when `fullWidth`. */
		size?: string | 'none';
		/** Inline gutter (any CSS length). Defaults to --sp-4; safe-area insets still win when larger. */
		gutter?: string;
		/** `'center'` (margin-inline auto) or `'start'` (flush with the parent's start edge). */
		align?: 'center' | 'start';
		pad?: boolean;
		/** Break out to the full *viewport* width, ignoring `size`/--content-max and any
		 *  centered ancestor. Inside a sidebar layout prefer `size="none"` (fills the column). */
		fullWidth?: boolean;
		/** Space reserved at the viewport edges when `fullWidth` (`'left right'` or one value
		 *  for both), e.g. `"var(--dock-left-w) var(--dock-right-w)"` for docked panels. */
		inset?: string;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();

	// `100vw` includes the reserved scrollbar gutter (`scrollbar-gutter: stable`).
	let scrollbarW = $state(0);
	$effect(() => {
		if (!browser || !fullWidth) return;
		const sync = () => {
			scrollbarW = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
		};
		sync();
		window.addEventListener('resize', sync);
		const ro = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(sync);
		ro?.observe(document.documentElement);
		return () => {
			window.removeEventListener('resize', sync);
			ro?.disconnect();
		};
	});

	const style = $derived.by(() => {
		const decls: string[] = [];
		if (!fullWidth && size && size !== 'none') decls.push(`max-width: ${size}`);
		if (gutter) {
			decls.push(`padding-inline: max(${gutter}, var(--safe-left)) max(${gutter}, var(--safe-right))`);
		}
		if (fullWidth && (scrollbarW || inset)) {
			const vw = scrollbarW ? `(100vw - ${scrollbarW}px)` : '100vw';
			const [left, right = left] = (inset ?? '0px').trim().split(/\s+/);
			decls.push(
				`width: calc(${vw} - ${left} - ${right})`,
				`margin-inline: calc(50% - ${vw} / 2 + ${left}) calc(50% - ${vw} / 2 + ${right})`
			);
		}
		return decls.length ? decls.join('; ') : undefined;
	});
</script>

<svelte:element
	this={as}
	data-tsu="Container"
	class="container ct {klass}"
	class:pad
	class:none={size === 'none'}
	class:start={align === 'start'}
	class:full={fullWidth}
	{style}
	{...rest}
>
	{@render children?.()}
</svelte:element>

<style>
	.ct {
		width: 100%;
		max-width: var(--content-max);
		margin-inline: auto;
		padding-inline: max(var(--sp-4), var(--safe-left)) max(var(--sp-4), var(--safe-right));
	}

	.ct.none {
		max-width: none;
	}

	.ct.start {
		margin-inline: 0;
	}

	.ct.pad {
		padding-top: var(--sp-6);
		padding-bottom: var(--sp-12);
	}

	/* Break out of any centered ancestor to span the viewport (minus `inset`).
	   `margin-inline: calc(50% - 50vw)` pulls each edge out to the viewport,
	   keeping the element in normal flow (no transform/overflow side-effects).
	   The measured scrollbar gutter and `inset` are taken out inline. */
	.ct.full {
		max-width: none;
		width: 100vw;
		margin-inline: calc(50% - 50vw);
	}
</style>
