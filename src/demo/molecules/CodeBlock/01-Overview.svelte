<script module>
	export const meta = {
		title: 'Route loader',
		caption: 'highlight is your function (code, lang) => HTML; class-based output (hljs-*, Prism) is themed by the --syn-* tokens. filename titles the block, showLineNumbers adds the gutter.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { CodeBlock } from '@dorsk/tsumikit';
	import { highlight } from './highlight';
	import { loader } from './data';
</script>

<CodeBlock code={loader} lang="ts" filename="src/routes/services/[name]/+page.server.ts" {highlight} showLineNumbers />
