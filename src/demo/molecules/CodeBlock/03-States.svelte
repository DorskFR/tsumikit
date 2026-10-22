<script module>
	export const meta = {
		title: 'Long content',
		caption: 'A long line scrolls inside the block by default or soft-wraps with wrap; breakAll splits unbroken secrets; maxHeight caps the body and collapsible turns the cap into a Show more toggle.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { CodeBlock } from '@dorsk/tsumikit';
	import { config, longLine, secret } from './data';
</script>

<CodeBlock code={longLine} lang="sh" />
<CodeBlock code={longLine} lang="sh" wrap />
<CodeBlock code={`GITHUB_TOKEN=${secret}`} filename=".env" breakAll />
<CodeBlock code={`export const fleet = {\n${config}\n};`} lang="ts" maxHeight="8rem" showLineNumbers />
<CodeBlock code={`export const fleet = {\n${config}\n};`} lang="ts" maxHeight="8rem" collapsible expandLabel="Show all 26 lines" />
