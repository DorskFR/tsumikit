<script module>
	export const meta = {
		title: 'Links, badges and long labels',
		caption: 'href items render links with aria-current="page" from current; badges take numbers or text and hide at 0; emoji replaces icon; long labels truncate.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { NavBar, type NavBarItem } from '@dorsk/tsumikit';

	const links: NavBarItem[] = [
		{ href: '#nav-bar', label: 'Feed', icon: 'home', current: true },
		{ href: '#nav-bar', label: 'Mentions', icon: 'bell', badge: 128 },
		{ href: '#nav-bar', label: 'Drafts', icon: 'edit', badge: 0 },
		{ href: '#nav-bar', label: 'Bookmarks', icon: 'bookmark', badge: 'new' }
	];
	const glyphs: NavBarItem[] = [
		{ value: 'garden', label: 'Community garden plots', emoji: '🌱' },
		{ value: 'market', label: 'Saturday farmers market', emoji: '🧺', badge: 5 },
		{ value: 'repair', label: 'Repair café', emoji: '🔧' }
	];
	let place = $state('garden');
</script>

<NavBar items={links} label="Social" />
<NavBar items={glyphs} bind:value={place} label="Neighbourhood" />
