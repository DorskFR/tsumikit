<script module>
	export const meta = {
		title: 'Bring your own highlighter',
		caption: 'Three inputs, cheapest first: plain code (escaped), a highlight callback, or pre-rendered html from a build step (html wins; code stays the copy source).',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { CodeBlock } from '@dorsk/tsumikit';
	import { highlight } from './highlight';

	const code = `const ready = await probe('api-gateway', { timeout: 3000 });\nif (!ready) return null;`;
	const html = `<span class="hljs-keyword">const</span> ready = <span class="hljs-keyword">await</span> <span class="hljs-title">probe</span>(<span class="hljs-string">'api-gateway'</span>, { <span class="hljs-attr">timeout</span>: <span class="hljs-number">3000</span> });\n<span class="hljs-keyword">if</span> (!ready) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;`;
</script>

<CodeBlock {code} lang="plain" />
<CodeBlock {code} lang="highlight()" {highlight} />
<CodeBlock {code} lang="html" {html} />
