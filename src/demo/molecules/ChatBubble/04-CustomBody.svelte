<script module>
	export const meta = {
		title: 'Custom body and meta',
		caption: 'children replaces markdown (here Prose with renderMarkdown and an attachment row); meta adds to the pill row.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { AttachmentList, Badge, ChatBubble, Prose, renderMarkdown } from '@dorsk/tsumikit';
	import { files } from '../../fixtures';
</script>

<ChatBubble role="assistant" timestamp={Date.UTC(2026, 9, 21, 9, 12)}>
	{#snippet meta()}
		<Badge size="xs" tone="accent">opus 5.5</Badge>
	{/snippet}
	<Prose compact html={renderMarkdown('Here is the **quarterly report** and the raw export. ~~Draft~~ final version.')} />
	<AttachmentList files={files.slice(1, 4)} />
	{#snippet footer()}<span>0.8s</span><span>3 files</span>{/snippet}
</ChatBubble>
