<script module>
	export const meta = {
		title: 'Chips, tiles and numbering',
		caption: 'tiles forces the tile form (images show a thumbnail); numbered badges each position to match [#N] markers in a prompt.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { AttachmentList, Text } from '@dorsk/tsumikit';
	import { files } from '../../fixtures';
</script>

<Text size="xs" tone="muted">Chips</Text>
<AttachmentList tiles={false} {files} />
<Text size="xs" tone="muted">Tiles</Text>
<AttachmentList tiles {files} />
<Text size="xs" tone="muted">Numbered, with an open action</Text>
<AttachmentList numbered {files} onopen={() => {}} />
<AttachmentList numbered tiles {files} onopen={() => {}} />
