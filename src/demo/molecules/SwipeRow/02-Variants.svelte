<script module>
	export const meta = {
		title: 'Tones, one side and custom panes',
		caption: 'tone colours the revealed pane; omit a side to lock that direction; leading/trailing snippets get (action, armed) to change the pane once it will fire.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Icon, SwipeRow, Text } from '@dorsk/tsumikit';

	let note = $state('');
	const tones = ['accent', 'info', 'warn', 'neutral'] as const;
</script>

<div class="list">
	{#each tones as tone (tone)}
		<SwipeRow trailingAction={{ label: `Snooze (${tone})`, icon: 'clock', tone, onaction: () => (note = `snoozed with ${tone}`) }}>
			<div class="body"><Text size="sm">Swipe left: tone="{tone}"</Text></div>
		</SwipeRow>
	{/each}
	<SwipeRow leadingAction={{ label: 'Pin', icon: 'pin', tone: 'accent', onaction: () => (note = 'pinned') }}>
		{#snippet leading(action, armed)}
			<Icon name={armed ? 'check' : 'pin'} />
			<span>{armed ? 'Release to pin' : `Keep pulling to ${action.label.toLowerCase()}`}</span>
		{/snippet}
		<div class="body"><Text size="sm">Swipe right: custom leading pane</Text></div>
	</SwipeRow>
</div>
<Text size="xs" tone="muted">{note || 'Nothing fired yet.'}</Text>

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
</style>
