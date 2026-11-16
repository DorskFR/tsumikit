<script module>
	export const meta = {
		title: 'Filters and the mobile sheet',
		caption: 'filters adds All / Unread / Needs action chips; sheet forces the bottom Drawer that sheet="auto" picks on touch and narrow screens; onvisible reports unread items as they scroll into view.',
		layout: 'row'
	};
</script>

<script lang="ts">
	import { NotificationCenter, Text, type NotificationData } from '@dorsk/tsumikit';
	import { seed } from './data';

	let items = $state<NotificationData[]>(seed());
	let seen = $state<string[]>([]);
</script>

<NotificationCenter {items} filters onvisible={(id) => (seen = [...seen, id])} />
<NotificationCenter {items} filters sheet title="Notifications (sheet)" />
<Text size="xs" tone="muted">Seen: {seen.join(', ') || 'none yet'}</Text>
