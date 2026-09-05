<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	// Inline text link — underlined accent text with no button chrome. Renders an
	// <a> when `href` is given, otherwise a <button> (for in-page actions that
	// read as links, e.g. "Open ChatGPT again").
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
		underline = 'always',
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
	.underline-hover:hover {
		text-decoration: underline;
	}
	.align-center {
		text-align: center;
	}
</style>
