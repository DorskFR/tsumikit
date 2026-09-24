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
	style:--swatch-color={color}
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
		--swatch-size: 1rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: var(--swatch-size);
		height: var(--swatch-size);
		padding: 0;
		margin: 0;
		border: 1px solid var(--border);
		border-radius: var(--r-pill);
		background: var(--swatch-color);
		color: var(--text);
		font: inherit;
		font-size: calc(var(--swatch-size) * 0.6);
		line-height: 1;
		vertical-align: middle;
		box-sizing: border-box;
	}
	.sm {
		--swatch-size: 0.75rem;
	}
	.lg {
		--swatch-size: 1.5rem;
	}
	.square {
		border-radius: var(--r-sm);
	}
	.sm.square {
		border-radius: 3px;
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
			transform 0.1s var(--ease),
			box-shadow 0.12s var(--ease);
	}
	.interactive:hover {
		transform: scale(1.15);
	}
	.interactive:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
	}
</style>
