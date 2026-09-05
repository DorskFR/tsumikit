<script lang="ts">
	// Vertical layout: children stacked in a column with a consistent gap.
	// `gap`/`align`/`justify` accept any CSS length/value; `gap` defaults to a
	// spacing token. Polymorphic via `as`. The one-dimensional layout every app
	// rebuilds, in one intention-revealing component.
	import type { Snippet } from 'svelte';

	let {
		as = 'div',
		gap = 'var(--sp-3)',
		align,
		justify,
		grow = false,
		shrink = true,
		fill = false,
		push,
		class: klass = '',
		children,
		...rest
	}: {
		as?: 'div' | 'section' | 'ul' | 'ol' | 'li' | 'form' | 'nav';
		gap?: string;
		align?: string;
		justify?: string;
		/** `flex: 1 1 0` inside a parent row/column. */
		grow?: boolean;
		/** `false` pins the stack (`flex: none`). */
		shrink?: boolean;
		/** `height: 100%` to fill a flex parent. */
		fill?: boolean;
		/** Auto margin pushing the stack to the start/end of its parent. */
		push?: 'start' | 'end';
		class?: string;
		style?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<svelte:element
	this={as}
	data-tsu="Stack"
	class="stack-c {klass}"
	class:grow
	class:no-shrink={!shrink}
	class:fill
	class:push-start={push === 'start'}
	class:push-end={push === 'end'}
	style:gap
	style:align-items={align}
	style:justify-content={justify}
	{...rest}
>
	{@render children?.()}
</svelte:element>

<style>
	.stack-c {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.stack-c > :global([data-grow]) {
		flex: 1 1 0;
		min-height: 0;
	}
	.stack-c > :global([data-shrink='false']) {
		flex: none;
	}
	.grow {
		flex: 1 1 0;
		min-height: 0;
	}
	.no-shrink {
		flex: none;
	}
	.fill {
		height: 100%;
	}
	.push-start {
		margin-block-end: auto;
	}
	.push-end {
		margin-block-start: auto;
	}
</style>
