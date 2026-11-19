<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { ControlSize } from '$lib/size';
	// Colour-swatch primitive: a filled chip that shows a colour. With a `label`
	// it is an image (role=img + aria-label); without one it is decorative
	// (aria-hidden). `interactive` renders a <button> so a palette picker can
	// build a row of swatches with `selected` mirrored to aria-pressed. The
	// hairline token border keeps pale colours visible on light themes.

	type Own = {
		/** Any CSS colour (or var()). */
		color: string;
		size?: ControlSize;
		shape?: 'circle' | 'square';
		/** Accessible name; without it the swatch is hidden from assistive tech. */
		label?: string;
		/** Draws the selection ring; `aria-pressed` when interactive. */
		selected?: boolean;
		/** Renders a `<button>` and wires `onclick`. */
		interactive?: boolean;
		onclick?: (e: MouseEvent) => void;
		class?: string;
		/** Optional glyph drawn over the colour (e.g. an "A" for auto). */
		children?: Snippet;
	};
	let {
		color,
		size = 'md',
		shape = 'circle',
		label,
		selected = false,
		interactive = false,
		onclick,
		class: klass = '',
		children,
		...rest
	}: Omit<HTMLAttributes<HTMLElement>, keyof Own> & Own = $props();
</script>

<svelte:element
	this={interactive ? 'button' : 'span'}
	type={interactive ? 'button' : undefined}
	data-tsu="Swatch"
	class="swatch {klass}"
	class:sm={size === 'sm'}
	class:lg={size === 'lg'}
	class:square={shape === 'square'}
	class:selected
	class:interactive
	style:background={color}
	role={!interactive && label ? 'img' : undefined}
	aria-label={interactive ? (label ?? color) : label}
	aria-hidden={!interactive && !label ? 'true' : undefined}
	aria-pressed={interactive ? selected : undefined}
	onclick={interactive ? onclick : undefined}
	{...rest}
>
	{@render children?.()}
</svelte:element>

<style>
	.swatch {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: 1rem;
		height: 1rem;
		padding: 0;
		margin: 0;
		border: var(--edge-width) solid var(--border);
		border-radius: var(--r-pill);
		color: var(--text);
		font: inherit;
		font-size: 0.6rem;
		line-height: var(--lh-none);
		vertical-align: middle;
		box-sizing: border-box;
	}
	.sm {
		width: 0.75rem;
		height: 0.75rem;
		font-size: 0.45rem;
	}
	.lg {
		width: 1.5rem;
		height: 1.5rem;
		font-size: 0.9rem;
	}
	.square {
		border-radius: var(--r-sm);
	}
	.sm.square {
		border-radius: var(--r-xs);
	}
	.selected {
		border-color: var(--text);
		box-shadow:
			0 0 0 2px var(--bg),
			0 0 0 3px var(--text);
	}
	.interactive {
		cursor: pointer;
		transition:
			scale var(--dur-fast) var(--ease-out),
			border-color var(--dur-fast) ease,
			box-shadow var(--dur-fast) ease;
	}
	.interactive:active {
		transition:
			scale var(--dur-press) var(--ease-out),
			border-color var(--dur-fast) ease,
			box-shadow var(--dur-fast) ease;
		scale: var(--press-scale-sm);
	}
	.interactive:focus-visible {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
	}
	@media (hover: hover) and (pointer: fine) {
		.interactive:hover {
			scale: 1.15;
		}
		.interactive:hover:active {
			scale: calc(1.15 * var(--press-scale-sm));
		}
	}
	@media (pointer: coarse) {
		.interactive {
			position: relative;
		}
		.interactive::before {
			content: '';
			position: absolute;
			inset-block: var(--touch-slab);
			inset-inline-start: var(--touch-slab);
			inset-inline-end: 0;
		}
	}
</style>
