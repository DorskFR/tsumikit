<script lang="ts">
	// Markdown style contract: headings, paragraphs, inline/block code, tables,
	// quotes, lists and images, driven by the --md-* tokens. Feed it rendered
	// `html` (already sanitised upstream) or children markup.
	import type { Snippet } from 'svelte';

	let {
		html,
		children,
		compact = false,
		class: klass = '',
		style: styleProp = ''
	}: {
		/** Pre-rendered, trusted HTML. */
		html?: string;
		children?: Snippet;
		/** Tighter vertical rhythm for chat bubbles. */
		compact?: boolean;
		class?: string;
		style?: string;
	} = $props();
</script>

<div data-tsu="Prose" class="prose {klass}" class:compact style={styleProp}>
	{#if html !== undefined}{@html html}{:else}{@render children?.()}{/if}
</div>

<style>
	.prose {
		color: var(--md-text, var(--text));
		font-size: var(--fs-sm);
		line-height: var(--lh-normal);
		overflow-wrap: anywhere;
		--prose-gap: var(--sp-3);
	}
	.prose.compact {
		--prose-gap: var(--sp-2);
	}
	.prose :global(> * + *) {
		margin-top: var(--prose-gap);
	}
	.prose :global(p) {
		margin: 0;
	}
	.prose :global(h1),
	.prose :global(h2),
	.prose :global(h3),
	.prose :global(h4) {
		margin: 0;
		color: var(--md-heading, var(--text));
		font-weight: var(--fw-semibold);
		line-height: var(--lh-tight);
	}
	.prose :global(h1) {
		font-size: var(--fs-xl);
	}
	.prose :global(h2) {
		font-size: var(--fs-lg);
	}
	.prose :global(h3) {
		font-size: var(--fs-md);
	}
	.prose :global(h4) {
		font-size: var(--fs-base);
	}
	.prose :global(strong) {
		color: var(--md-strong, var(--text));
		font-weight: var(--fw-semibold);
	}
	.prose :global(a) {
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}
	.prose :global(code) {
		font-family: var(--font-mono);
		font-size: 0.92em;
		color: var(--md-code, var(--text));
		background: var(--md-code-bg, var(--bg-elevated-2));
		padding: 0.1em 0.35em;
		border-radius: var(--r-sm);
	}
	.prose :global(pre) {
		margin: 0;
		padding: var(--sp-3);
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--r-md);
		overflow-x: auto;
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		line-height: 1.5;
	}
	.prose :global(pre code) {
		padding: 0;
		background: none;
		color: inherit;
		font-size: inherit;
	}
	.prose :global(blockquote) {
		margin: 0;
		padding-inline-start: var(--sp-3);
		border-inline-start: 3px solid var(--border-strong);
		color: var(--text-muted);
	}
	.prose :global(ul),
	.prose :global(ol) {
		margin: 0;
		padding-inline-start: 1.4em;
	}
	.prose :global(li + li) {
		margin-top: var(--sp-1);
	}
	.prose :global(table) {
		border-collapse: collapse;
		width: 100%;
		font-size: var(--fs-xs);
	}
	.prose :global(th),
	.prose :global(td) {
		padding: var(--sp-1) var(--sp-2);
		border: 1px solid var(--border);
		text-align: left;
		vertical-align: top;
	}
	.prose :global(th) {
		background: var(--bg-elevated-2);
		color: var(--text-muted);
		font-weight: var(--fw-semibold);
	}
	.prose :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: var(--r-md);
	}
	.prose :global(hr) {
		border: 0;
		border-top: 1px solid var(--border);
	}
</style>
