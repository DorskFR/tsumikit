<script module>
	export const meta = {
		title: 'Without the bell',
		caption: 'bell={false} renders no trigger: bind:open opens the panel as a side Drawer (the bottom sheet on narrow screens), here from a menu row.',
		layout: 'row'
	};
</script>

<script lang="ts">
	import { Icon, Menu, NotificationCenter, type MenuItem } from '@dorsk/tsumikit';
	import { seed } from './data';

	const items = seed();
	let open = $state(false);
	const account: MenuItem[] = [
		{ label: 'Notifications', icon: 'bell', onselect: () => (open = true) },
		{ label: 'Settings', icon: 'settings', onselect: () => {} }
	];
</script>

<Menu label="Account" items={account}>
	{#snippet trigger()}<Icon name="user" size={16} />{/snippet}
</Menu>
<NotificationCenter bell={false} bind:open {items} />
