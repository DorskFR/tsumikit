<script module>
	export const meta = {
		title: 'States',
		caption: 'disabled ignores the gesture and disables the hidden buttons; threshold sets the fraction of the width that arms the action; a row with no action is plain content.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, SwipeRow, Text } from '@dorsk/tsumikit';

	let fired = $state(0);
	const del = { label: 'Delete', icon: 'trash', tone: 'danger', onaction: () => fired++ } as const;
</script>

<div class="list">
	<SwipeRow disabled trailingAction={del}>
		<div class="body split"><Text size="sm">Billing receipt</Text><Badge size="xs">locked</Badge></div>
	</SwipeRow>
	<SwipeRow threshold={0.15} trailingAction={del}>
		<div class="body"><Text size="sm">threshold 0.15: a short flick deletes</Text></div>
	</SwipeRow>
	<SwipeRow threshold={0.7} trailingAction={del}>
		<div class="body"><Text size="sm">threshold 0.7: drag most of the way</Text></div>
	</SwipeRow>
	<SwipeRow trailingAction={del}>
		<div class="body">
			<Text size="sm">
				A long notification body wraps inside the row while the swipe still reveals the pane behind it:
				deployment of media-transcode to eu-west-1 finished with two warnings about deprecated codecs.
			</Text>
		</div>
	</SwipeRow>
	<SwipeRow><div class="body"><Text size="sm">No actions: not swipeable</Text></div></SwipeRow>
</div>
<Text size="xs" tone="muted">Fired {fired} times.</Text>

<style>
	.list {
		border: 1px solid var(--border);
		border-radius: var(--r-md);
		overflow: hidden;
	}
	.body {
		padding: var(--sp-3);
		border-bottom: 1px solid var(--border);
	}
	.split {
		display: flex;
		justify-content: space-between;
		gap: var(--sp-2);
	}
</style>
