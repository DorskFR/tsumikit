<script module>
	export const meta = {
		title: 'States',
		caption: 'disabled, no current value, a custom groups catalogue with its own searchLabel and emptyLabel, and columns={4}.',
		layout: 'row'
	};
</script>

<script lang="ts">
	import { EmojiPicker, Text } from '@dorsk/tsumikit';
	import { statusGroups } from './data';

	let status = $state('');
</script>

<EmojiPicker disabled label="Reactions are off in this channel" onselect={() => {}} />
<EmojiPicker label="No icon yet" onselect={() => {}} />
<EmojiPicker
	value={status}
	label="Set a status"
	groups={statusGroups}
	columns={4}
	searchLabel="Search statuses…"
	emptyLabel="No status matches."
	onselect={(e) => (status = e)}
/>
<Text size="sm" tone="muted">{status ? `Status: ${status}` : 'Pick a status from the custom catalogue.'}</Text>
