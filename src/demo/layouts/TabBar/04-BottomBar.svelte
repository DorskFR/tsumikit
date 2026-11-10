<script module>
	export const meta = {
		title: 'Bottom bar and toasts',
		caption:
			'the default placement="bar" fixes the bar to the viewport bottom and publishes --tabbar-h (a CSS default holds it from the first frame); the Toaster stacks above it with no setup. The example moves the bar to <body> because the showcase cards are query containers, which re-anchor position: fixed.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Switch, TabBar, toasts, type TabBarItem } from '@dorsk/tsumikit';

	const items: TabBarItem[] = [
		{ id: 'home', label: 'Chats', icon: 'mail' },
		{ id: 'search', label: 'People', icon: 'users' },
		{ id: 'inbox', label: 'Alerts', icon: 'bell', badge: 3 },
		{ id: 'settings', label: 'Settings', icon: 'settings' }
	];
	let pinned = $state(false);
	const toBody = (node: HTMLElement) => {
		document.body.append(node);
		return () => node.remove();
	};
	let tab = $state('home');
</script>

<Cluster align="center">
	<Switch bind:checked={pinned} label="Pin a tab bar to this page" labelVisible />
	<Button size="sm" onclick={() => toasts.ok('Saved: the toast sits above the bar')}>Show a toast</Button>
</Cluster>
{#if pinned}
	<div {@attach toBody}>
		<TabBar {items} bind:value={tab} label="Demo bar" />
	</div>
{/if}
