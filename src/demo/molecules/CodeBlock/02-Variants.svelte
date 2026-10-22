<script module>
	export const meta = {
		title: 'Header and chrome',
		caption: 'Plain code with no header extras, a lang label, a filename, copy={false} for read-only output.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { CodeBlock } from '@dorsk/tsumikit';
	import { setup } from './data';
</script>

<CodeBlock code="npm install @dorsk/tsumikit" />
<CodeBlock code={setup} lang="sh" />
<CodeBlock code={setup} filename="setup.sh" showLineNumbers />
<CodeBlock code={'✓ 412 tests passed (3.2s)\n✓ build ok (dist/ 184 kB)'} lang="output" copy={false} />
