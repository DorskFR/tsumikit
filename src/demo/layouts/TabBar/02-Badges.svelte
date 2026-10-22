<script module>
	export const meta = {
		title: 'Badges and item counts',
		caption: 'Numeric badges cap at 99+ and hide at 0; text badges render verbatim; three to five items share the width.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { TabBar, type TabBarItem } from '@dorsk/tsumikit';

	const three: TabBarItem[] = [
		{ id: 'today', label: 'Today', icon: 'calendar' },
		{ id: 'inbox', label: 'Inbox', icon: 'mail', badge: 0 },
		{ id: 'done', label: 'Done', icon: 'check-circle' }
	];
	const five: TabBarItem[] = [
		{ id: 'home', label: 'Home', icon: 'home' },
		{ id: 'alerts', label: 'Alerts', icon: 'bell', badge: 3 },
		{ id: 'queue', label: 'Queue', icon: 'list', badge: 1500 },
		{ id: 'beta', label: 'Labs', icon: 'zap', badge: 'new' },
		{ id: 'me', label: 'Me', icon: 'user' }
	];
	let a = $state('today');
	let b = $state('queue');
</script>

<TabBar items={three} bind:value={a} placement="inline" label="Tasks" />
<TabBar items={five} bind:value={b} placement="inline" label="Operations" />
