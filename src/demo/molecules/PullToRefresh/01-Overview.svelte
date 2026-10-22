<script module>
	export const meta = {
		title: 'Activity feed',
		caption: 'Wrap a scroll container; with touch or a pen, pull down from the top past threshold and release: onrefresh is awaited while the spinner holds the slot.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { PullToRefresh, Text } from '@dorsk/tsumikit';
	import { feed, incoming } from './data';

	let events = $state([...feed]);
	let next = 0;
	async function refresh() {
		await new Promise((r) => setTimeout(r, 1200));
		const e = incoming[next++ % incoming.length];
		events = [{ ...e, id: Date.now(), when: 'now' }, ...events];
	}
</script>

<div class="frame">
	<PullToRefresh style="height: 100%" onrefresh={refresh} label="Fetching activity…">
		{#each events as e (e.id)}
			<div class="event">
				<Text size="sm" truncate grow><Text weight="semibold">{e.who}</Text> {e.what}</Text>
				<Text size="xs" tone="muted" nowrap>{e.when}</Text>
			</div>
		{/each}
	</PullToRefresh>
</div>
<Text size="xs" tone="muted">The gesture ignores mouse drags; open this page on a phone or in device emulation.</Text>

<style>
	.frame {
		height: 16rem;
		border: 1px solid var(--border);
		border-radius: var(--r-md);
		overflow: hidden;
	}
	.event {
		display: flex;
		align-items: baseline;
		gap: var(--sp-2);
		padding: var(--sp-2) var(--sp-3);
		border-bottom: 1px solid var(--border);
	}
</style>
