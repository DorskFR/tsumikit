<script module>
	export const meta = {
		title: 'Default and compact rhythm',
		caption: 'compact tightens the vertical rhythm for chat bubbles and dense panels.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Prose, renderMarkdown, Text } from '@dorsk/tsumikit';

	const source = `### Incident 0412\n\n**cache-01** ran out of memory at 08:39.\n\n- 502s on api-gateway for 4 minutes\n- no data loss\n\nFollow-up: raise \`maxmemory\`.`;
	const html = renderMarkdown(source);
</script>

<div>
	<Text size="xs" tone="muted">Default</Text>
	<Prose {html} />
</div>
<div>
	<Text size="xs" tone="muted">compact</Text>
	<Prose {html} compact />
</div>
