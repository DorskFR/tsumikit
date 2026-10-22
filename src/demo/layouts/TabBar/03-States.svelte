<script module>
	export const meta = {
		title: 'Links, long labels and silent taps',
		caption: 'href items make a nav with aria-current="page"; long labels truncate; sound={false} silences one bar; onselect reports the new id.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { TabBar, Text, type TabBarItem } from '@dorsk/tsumikit';

	const links: TabBarItem[] = [
		{ id: 'discover', label: 'Discover', icon: 'search', href: '#tab-bar' },
		{ id: 'library', label: 'Library', icon: 'book', href: '#tab-bar' },
		{ id: 'downloads', label: 'Downloads', icon: 'download', href: '#tab-bar', badge: 2 }
	];
	const long: TabBarItem[] = [
		{ id: 'recent', label: 'Recently played episodes', icon: 'clock' },
		{ id: 'subs', label: 'Subscriptions and channels', icon: 'star' },
		{ id: 'offline', label: 'Available offline', icon: 'download' }
	];
	const page = 'library';
	let picked = $state('recent');
	let last = $state('');
</script>

<TabBar items={links} value={page} placement="inline" label="Reader" />
<TabBar
	items={long}
	bind:value={picked}
	placement="inline"
	sound={false}
	label="Podcasts"
	onselect={(id) => (last = id)}
/>
<Text size="xs" tone="muted">onselect: {last || 'nothing yet'}</Text>
