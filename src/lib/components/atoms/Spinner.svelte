<script lang="ts">
	// Inline loading spinner — a spinning `loader` glyph. Tracks the surrounding
	// text size by default (1em), or pass an explicit pixel `size`. The spin
	// animation is owned by Icon and is halted under prefers-reduced-motion, so
	// motion-sensitive users see a static glyph instead.
	import Icon from './Icon.svelte';

	let {
		size,
		label = 'Loading',
		...rest
	}: {
		/** Explicit pixel size. Omit to track the surrounding text (1em). */
		size?: number;
		/** AT label announcing the busy state. Set to undefined to make the
		 *  spinner decorative when an ancestor already conveys the loading state. */
		label?: string;
		[key: string]: unknown;
	} = $props();
</script>

<Icon name="loader" spin {size} {label} data-tsu="Spinner" {...rest} />
