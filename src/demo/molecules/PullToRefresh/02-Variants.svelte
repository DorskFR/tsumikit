<script module>
	export const meta = {
		title: 'Threshold and labels',
		caption: 'threshold is the damped pull distance in px that arms the refresh; pullLabel, releaseLabel and label are the live-region announcements, shown here as they change.'
	};
</script>

<script lang="ts">
	import { PullToRefresh, Text } from '@dorsk/tsumikit';

	const wait = () => new Promise<void>((r) => setTimeout(r, 900));
	const panes = [
		{ threshold: 48, title: 'threshold 48: quick' },
		{ threshold: 72, title: 'threshold 72: default' },
		{ threshold: 120, title: 'threshold 120: deliberate' }
	];
</script>

{#each panes as p (p.threshold)}
	<div class="frame">
		<PullToRefresh
			style="height: 100%"
			threshold={p.threshold}
			onrefresh={wait}
			pullLabel="Pull to check for new orders"
			releaseLabel="Release to check for new orders"
			label="Checking for new orders…"
		>
			<div class="pane">
				<Text size="sm" weight="semibold">{p.title}</Text>
				<Text size="xs" tone="muted">Pull this pane down.</Text>
			</div>
		</PullToRefresh>
	</div>
{/each}

<style>
	.frame {
		flex: 1 1 10rem;
		height: 8rem;
		border: 1px solid var(--border);
		border-radius: var(--r-md);
		overflow: hidden;
	}
	.pane {
		display: grid;
		gap: var(--sp-1);
		padding: var(--sp-3);
		min-height: 9rem;
	}
</style>
