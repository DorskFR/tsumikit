<script module>
	export const meta = {
		title: 'States',
		caption: 'read-only (no onremove), files without a size, look-alike names keeping their tail visible, and an empty list rendering nothing.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { AttachmentList, Text } from '@dorsk/tsumikit';
</script>

<Text size="xs" tone="muted">Read-only</Text>
<AttachmentList files={[{ name: 'invoice-2026-10.pdf', size: 120_404, type: 'application/pdf' }, { name: 'logo.svg', type: 'image/svg+xml' }]} />
<Text size="xs" tone="muted">Look-alike names: the head is clipped, the tail stays</Text>
<AttachmentList
	files={[
		{ name: 'screenshot-2026-10-21-at-09.14.02.png', size: 1_104_311, type: 'image/png' },
		{ name: 'screenshot-2026-10-21-at-09.14.37.png', size: 1_210_900, type: 'image/png' },
		{ name: 'screenshot-2026-10-21-at-09.15.11.png', size: 998_120, type: 'image/png' }
	]}
	onremove={() => {}}
/>
<Text size="xs" tone="muted">Empty list (renders nothing)</Text>
<AttachmentList files={[]} />
