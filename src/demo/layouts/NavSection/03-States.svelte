<script module>
	export const meta = {
		title: 'Long labels and long groups',
		caption: 'A long label wraps instead of overflowing; a long group scrolls with its sidebar; an empty group keeps only its heading.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { NavItem, NavSection, Text } from '@dorsk/tsumikit';
	import { tracks } from '../../fixtures';
</script>

<nav aria-label="Projects" class="nav-section-box">
	<NavSection label="Projects shared with the platform reliability guild">
		<NavItem icon="folder" label="infra.dorsk.dev" />
		<NavItem icon="folder" label="tsumikit" active />
	</NavSection>
	<NavSection label="Archived">
		<Text size="xs" tone="faint" style="padding-inline: var(--sp-3)">Nothing archived yet</Text>
	</NavSection>
</nav>
<nav aria-label="Playlists" class="nav-section-box" style="max-height: 12rem; overflow-y: auto">
	<NavSection label="Playlists">
		{#each [...tracks, ...tracks] as track, i (i)}
			<NavItem icon="music" label="{track.album} · {track.artist}" />
		{/each}
	</NavSection>
</nav>

<style>
	:global(.nav-section-box) {
		padding: var(--sp-2);
		border: 1px solid var(--border);
		border-radius: var(--r-md);
		background: var(--bg-elevated);
	}
</style>
