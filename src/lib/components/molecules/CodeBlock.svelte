<script lang="ts">
	// Code block — dependency-free chrome around your code. It does NOT bundle a
	// highlighter (that would break the zero-dep promise and bloat the bundle).
	// Three ways to feed it, cheapest first:
	//   • plain `code` (no highlighting, fully escaped);
	//   • a `highlight` callback (code, lang) => HTML string you provide;
	//   • pre-rendered `html` (e.g. from a server/build step).
	// Class-based highlighters (highlight.js, Prism) are auto-themed: their token
	// classes are mapped to the --syn-* theme tokens globally (see app.css), so
	// the colors track every theme. Provides a language label, copy button,
	// optional line numbers and soft-wrap toggle.
	import CopyButton from '$lib/components/molecules/CopyButton.svelte';

	let {
		code,
		lang,
		html,
		highlight,
		filename,
		showLineNumbers = false,
		wrap = false,
		copy = true,
		class: klass = ''
	}: {
		code: string;
		/** Language label (and hint passed to `highlight`). */
		lang?: string;
		/** Pre-highlighted HTML (overrides `highlight`). */
		html?: string;
		/** Highlighter callback returning HTML for `code`. */
		highlight?: (code: string, lang?: string) => string;
		filename?: string;
		showLineNumbers?: boolean;
		wrap?: boolean;
		copy?: boolean;
		class?: string;
	} = $props();

	const rendered = $derived(html ?? (highlight ? highlight(code, lang) : null));
	const lines = $derived(showLineNumbers ? code.replace(/\n$/, '').split('\n').length : 0);
	const hasHeader = $derived(!!(filename || lang || copy));
</script>

<figure class="codeblock {klass}" data-tsu="CodeBlock">
	{#if hasHeader}
		<figcaption class="cb-head">
			<span class="cb-name">{filename ?? lang ?? ''}</span>
			<div class="spacer"></div>
			{#if copy}<CopyButton text={code} showLabel={false} />{/if}
		</figcaption>
	{/if}
	<div class="cb-body" class:wrap class:numbered={showLineNumbers}>
		{#if showLineNumbers}
			<span class="cb-gutter" aria-hidden="true">
				{#each { length: lines } as _, i (i)}<span>{i + 1}</span>{/each}
			</span>
		{/if}
		<pre class="cb-pre"><code class="cb-code" class:hljs={!!rendered}
				>{#if rendered}{@html rendered}{:else}{code}{/if}</code
			></pre>
	</div>
</figure>

<style>
	.codeblock {
		margin: 0;
		border: 1px solid var(--border);
		border-radius: var(--r-lg);
		background: var(--bg);
		overflow: hidden;
	}
	.cb-head {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		padding: var(--sp-1) var(--sp-1) var(--sp-1) var(--sp-3);
		background: var(--bg-elevated-2);
		border-bottom: 1px solid var(--border);
		font-size: var(--fs-xs);
		font-family: var(--font-mono);
		color: var(--text-muted);
	}
	.cb-body {
		display: flex;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}
	.cb-gutter {
		flex: none;
		display: flex;
		flex-direction: column;
		padding: var(--sp-3) var(--sp-2);
		text-align: right;
		color: var(--text-faint);
		background: var(--bg-elevated);
		border-right: 1px solid var(--border);
		user-select: none;
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		line-height: 1.5;
	}
	.cb-pre {
		margin: 0;
		padding: var(--sp-3);
		flex: 1;
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		line-height: 1.5;
		color: var(--md-text, var(--text));
		tab-size: 2;
	}
	.cb-body.wrap .cb-pre {
		white-space: pre-wrap;
		word-break: break-word;
	}
	.cb-body.numbered .cb-pre {
		white-space: pre; /* keep lines aligned with the gutter */
	}
</style>
