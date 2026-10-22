<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	// Inline text link — accent text with no button chrome. Renders an <a> when
	// `href` is given, otherwise a <button> (for in-page actions that read as
	// links, e.g. "Open ChatGPT again").
	// Underline: the default `hover` is for navigation, lists and entity titles;
	// use `always` for links inside running prose.
	import type { Snippet } from 'svelte';

	type Own = {
		href?: string;
		target?: string;
		rel?: string;
		download?: string | boolean;
		tone?: 'accent' | 'info' | 'muted' | 'inherit';
		underline?: 'always' | 'hover' | 'none';
		// Text alignment of the <button> form; multi-line titles want `start`.
		align?: 'start' | 'center';
		class?: string;
		children?: Snippet;
	};
	let {
		href,
		tone = 'accent',
		underline = 'hover',
		align = 'start',
		class: klass = '',
		children,
		...rest
	}: Omit<HTMLAttributes<HTMLElement>, keyof Own> & Own = $props();
</script>

{#if href}
	<a
		{href}
		class="link tone-{tone} underline-{underline} align-{align} {klass}"
		data-tsu="Link"
		{...rest}>{@render children?.()}</a
	>
{:else}
	<button
		class="link tone-{tone} underline-{underline} align-{align} {klass}"
		data-tsu="Link"
		{...rest}
		type="button">{@render children?.()}</button
	>
{/if}

<style>
	.link {
		background: none;
		border: none;
		padding: 0;
		color: var(--accent, var(--text));
		cursor: pointer;
		text-decoration: underline;
		font: inherit;
		text-align: start;
		transition:
			color var(--dur-fast) ease,
			text-decoration-color var(--dur-fast) ease;
	}
	.tone-info {
		color: var(--info);
	}
	.tone-muted {
		color: var(--text-muted);
	}
	.tone-inherit {
		color: inherit;
	}
	.underline-hover,
	.underline-none {
		text-decoration: none;
	}
	@media (hover: hover) and (pointer: fine) {
		.underline-hover:hover {
			text-decoration: underline;
		}
	}
	.align-center {
		text-align: center;
	}
	@media (pointer: coarse) {
		.link {
			position: relative;
		}
		.link::before {
			content: '';
			position: absolute;
			inset-block: var(--touch-slab);
			inset-inline-start: var(--touch-slab);
			inset-inline-end: 0;
		}
	}
</style>
