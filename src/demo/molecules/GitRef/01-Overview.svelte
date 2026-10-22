<script module>
	export const meta = {
		title: 'Review queue',
		caption: 'branch, pr and diff are each optional; the PR state sets the tone (open ok, merged accent, closed danger, draft muted). collapse="auto" drops chip text under 18rem of the .cq container: drag the handle.',
		layout: 'stack',
		resizable: true
	};
</script>

<script lang="ts">
	import { GitRef, Text } from '@dorsk/tsumikit';
	import { changes } from './data';
</script>

<div class="list">
	{#each changes as c (c.branch)}
		<div class="cq row">
			<Text size="sm" weight="medium" truncate block>{c.title}</Text>
			<GitRef branch={c.branch} pr={c.pr} diff={c.diff} />
		</div>
	{/each}
</div>

<style>
	.list {
		border: 1px solid var(--border);
		border-radius: var(--r-md);
	}
	.row {
		display: grid;
		gap: var(--sp-1);
		padding: var(--sp-2) var(--sp-3);
		border-bottom: 1px solid var(--border);
	}
</style>
