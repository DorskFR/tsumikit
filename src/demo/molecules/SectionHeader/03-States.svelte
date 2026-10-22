<script module>
	export const meta = {
		title: 'Sticky and long titles',
		caption: 'sticky pins the header while its parent scrolls; a long title wraps, count accepts a string, subtitle and actions keep to the row.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, SectionHeader, Text } from '@dorsk/tsumikit';
	import { people } from '../../fixtures';

	const rows = Array.from({ length: 4 }, () => people).flat();
</script>

<div class="scroller">
	<SectionHeader title="Members" count="24+" sticky divider level={3} size="sm">
		{#snippet actions()}<Button size="sm">Invite</Button>{/snippet}
	</SectionHeader>
	{#each rows as p, i (i)}
		<Text size="sm" block>{p.name} · {p.role}</Text>
	{/each}
</div>
<SectionHeader
	title="A section title long enough to wrap onto a second line on a phone while the count and actions stay put"
	subtitle="updated 4 min ago"
	count={1203}
	level={3}
	size="sm"
	divider
>
	{#snippet actions()}<Button size="sm" variant="ghost">Export</Button>{/snippet}
</SectionHeader>

<style>
	.scroller {
		max-height: 10rem;
		overflow: auto;
		border: 1px solid var(--border);
		border-radius: var(--r-md);
		padding: 0 var(--sp-3) var(--sp-3);
		background: var(--bg-elevated);
	}
</style>
