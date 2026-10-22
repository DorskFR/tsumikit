<script module>
	export const meta = {
		title: 'Attachments on a draft',
		caption: 'files, onremove and onopen; tiles="auto" switches to tiles at 30rem, so drag the handle to watch the chips collapse.',
		layout: 'stack',
		resizable: true
	};
</script>

<script lang="ts">
	import { AttachmentList, Button, Text, toasts } from '@dorsk/tsumikit';
	import { files as seed } from '../../fixtures';

	let files = $state([...seed]);
</script>

<Text size="sm" tone="muted">Draft reply · {files.length} attachment{files.length === 1 ? '' : 's'}</Text>
<AttachmentList {files} onremove={(i) => (files = files.filter((_, j) => j !== i))} onopen={(i) => toasts.show(`Opening ${files[i].name}`)} />
{#if !files.length}
	<Button size="sm" onclick={() => (files = [...seed])}>Restore attachments</Button>
{/if}
