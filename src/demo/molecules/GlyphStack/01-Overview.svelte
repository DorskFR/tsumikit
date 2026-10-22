<script module>
	export const meta = {
		title: 'Session list',
		caption: 'stack="auto" measures the nearest .cq container and folds below stackBelow (22rem here): drag the handle. DOM order is unchanged, so Tab still reaches the pin first.',
		layout: 'stack',
		resizable: true
	};
</script>

<script lang="ts">
	import { Avatar, Badge, Dot, GlyphStack, IconButton, Text } from '@dorsk/tsumikit';

	type Session = { id: number; title: string; machine: string; owner: string; status: 'active' | 'stale' | 'dead'; pinned: boolean; at: string };
	let sessions = $state<Session[]>([
		{ id: 1, title: 'Migrate demo examples for the media molecules', machine: 'devbox', owner: 'Amara Okafor', status: 'active', pinned: true, at: '2 min' },
		{ id: 2, title: 'Investigate cache-01 failover', machine: 'ci-runner', owner: 'Jun Tanaka', status: 'stale', pinned: false, at: '1 h' },
		{ id: 3, title: 'Draft release notes', machine: 'laptop', owner: 'Lena Fischer', status: 'dead', pinned: false, at: 'Mon' }
	]);
</script>

<div class="cq list">
	{#each sessions as s (s.id)}
		{#snippet pin()}<IconButton icon="star" size={14} box="xs" variant="ghost" label={s.pinned ? 'Unpin' : 'Pin'} pressed={s.pinned} onclick={() => (s.pinned = !s.pinned)} />{/snippet}
		{#snippet status()}<Dot status={s.status} label={s.status} />{/snippet}
		{#snippet machine()}<Badge size="xs" mono>{s.machine}</Badge>{/snippet}
		{#snippet machineTile()}<Avatar name={s.machine} shape="square" size={16} decorative />{/snippet}
		{#snippet owner()}<Avatar name={s.owner} size={16} />{/snippet}
		<div class="row">
			<GlyphStack stackBelow="22rem" items={[{ inline: pin }, { inline: status }, { inline: machine, stacked: machineTile }, { inline: owner }]} />
			<Text size="sm" truncate grow>{s.title}</Text>
			<Text size="xs" tone="muted" nowrap>{s.at}</Text>
		</div>
	{/each}
</div>

<style>
	.list {
		display: grid;
		border: 1px solid var(--border);
		border-radius: var(--r-md);
	}
	.row {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		min-width: 0;
		padding: var(--sp-2) var(--sp-3);
		border-bottom: 1px solid var(--border);
	}
</style>
