<script module>
	export const meta = {
		title: 'Terminal sessions',
		caption: 'Drag the handle: ancestors abbreviate one at a time left to right, then only the leaf stays, then it ellipsises down to minLeaf characters. The full path is always the tooltip.',
		layout: 'stack',
		resizable: true
	};
</script>

<script lang="ts">
	import { Dot, Text, WorkingDir } from '@dorsk/tsumikit';

	const sessions = [
		{ name: 'build', cwd: '/home/amara/Documents/tsumikit/src/lib/components', status: 'active' },
		{ name: 'deploy', cwd: '/srv/app/releases/2026-09-05-a-really-long-release-name', status: 'stale' },
		{ name: 'notes', cwd: '~/projects/cctui', status: 'dead' }
	] as const;
</script>

<div class="list">
	{#each sessions as s (s.name)}
		<div class="row">
			<Dot status={s.status} label={s.status} />
			<Text size="sm" weight="medium" nowrap>{s.name}</Text>
			<WorkingDir path={s.cwd} />
		</div>
	{/each}
</div>

<style>
	.list {
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
