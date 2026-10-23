<script module>
	export const meta = {
		title: 'Many items on a phone',
		caption: 'labels="fit" (default) shrinks stacked labels to one size, down to --navbar-label-min (10px), then wraps and only then truncates; "truncate" keeps one full-size line; "full" never clips and lets labels spill.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { NavBar, Stack, Text, type NavBarItem } from '@dorsk/tsumikit';

	const items: NavBarItem[] = [
		{ href: '#nav-bar', label: 'Today', icon: 'home', current: true },
		{ href: '#nav-bar', label: 'Practice', icon: 'check' },
		{ href: '#nav-bar', label: 'Lecture', icon: 'book' },
		{ href: '#nav-bar', label: 'Grammar', icon: 'edit' },
		{ href: '#nav-bar', label: 'Tasks', icon: 'list', badge: 3 },
		{ href: '#nav-bar', label: 'Progress', icon: 'flame' },
		{ href: '#nav-bar', label: 'Me', icon: 'user' }
	];
	const modes = ['fit', 'truncate'] as const;
</script>

{#each modes as labels (labels)}
	<Stack gap="var(--sp-1)">
		<Text size="xs" mono tone="muted">labels="{labels}"</Text>
		<div class="phone">
			<NavBar {items} {labels} label="Study, labels {labels}" />
		</div>
	</Stack>
{/each}

<style>
	.phone {
		max-width: 24.375rem;
	}
</style>
