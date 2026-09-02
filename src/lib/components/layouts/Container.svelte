<script lang="ts">
	// Max-width content column with token gutters that respect safe-area insets.
	// Self-contained: does not depend on the global `.container` utility. Exposes
	// `--container-gutter` so children can bleed to the column edge with
	// `margin-inline: calc(-1 * var(--container-gutter))`.
	import type { Snippet } from 'svelte';

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

	const style = $derived.by(() => {
		const vars: string[] = [];
		if (!fullWidth && size && size !== 'none') vars.push(`--ct-max: ${size}`);
		if (gutter) vars.push(`--container-gutter: ${gutter}`);
		if (fullWidth && inset) {
			const [left, right = left] = inset.trim().split(/\s+/);
			vars.push(`--ct-inset-l: ${left}`, `--ct-inset-r: ${right}`);
		}
		return vars.length ? vars.join('; ') : undefined;
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
		--container-gutter: var(--sp-4);
		width: 100%;
		max-width: var(--ct-max, var(--content-max));
		margin-inline: auto;
		padding-inline: max(var(--container-gutter), var(--safe-left))
			max(var(--container-gutter), var(--safe-right));
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
	   keeping the element in normal flow (no transform/overflow side-effects). */
	.ct.full {
		--ct-inset-l: 0px;
		--ct-inset-r: 0px;
		max-width: none;
		width: calc(100vw - var(--ct-inset-l) - var(--ct-inset-r));
		margin-inline: calc(50% - 50vw + var(--ct-inset-l)) calc(50% - 50vw + var(--ct-inset-r));
	}
</style>
