<script module>
	export const meta = {
		title: 'Activity feed',
		caption: 'state cycles idle → loading → idle as onload appends rows, then done once the source is exhausted.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { LoadMore, Text } from '@dorsk/tsumikit';
	import { messages } from '../../fixtures';

	const PAGE = 2;
	let shown = $state(messages.slice(0, PAGE));
	let status = $state<'idle' | 'loading' | 'error' | 'done'>('idle');

	async function load() {
		status = 'loading';
		await new Promise((r) => setTimeout(r, 700));
		shown = messages.slice(0, shown.length + PAGE);
		status = shown.length >= messages.length ? 'done' : 'idle';
	}
</script>

<ul class="feed">
	{#each shown as m (m.id)}
		<li>
			<Text size="xs" tone="muted" mono>{m.role}</Text>
			<Text size="sm" truncate>{m.text.split('\n')[0]}</Text>
		</li>
	{/each}
</ul>
<LoadMore state={status} onload={load} label="Load older" />

<style>
	.feed {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--sp-1);
		max-width: 32rem;
	}
	li {
		display: grid;
		grid-template-columns: 5rem 1fr;
		gap: var(--sp-2);
		align-items: baseline;
		min-width: 0;
	}
</style>
