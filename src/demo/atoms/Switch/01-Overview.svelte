<script module>
	export const meta = {
		title: 'Notification preferences',
		caption: 'each row is a label and description beside a Switch with bind:checked; label names the switch for assistive tech.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Divider, Stack, Switch, Text } from '@dorsk/tsumikit';

	let prefs = $state({ push: true, digest: false, mentions: true, sounds: false });
	const rows = [
		{ key: 'push', label: 'Push notifications', hint: 'Delivered to this device even when the tab is closed.' },
		{ key: 'digest', label: 'Daily digest', hint: 'One email at 08:00 in your timezone.' },
		{ key: 'mentions', label: 'Only when mentioned', hint: 'Mute channel chatter, keep direct mentions.' },
		{ key: 'sounds', label: 'Sounds', hint: 'Play a chime for new messages.' },
	] as const;
</script>

<Stack gap="var(--sp-3)" style="max-width: 28rem">
	{#each rows as r, i (r.key)}
		{#if i > 0}<Divider />{/if}
		<div class="row">
			<div>
				<Text as="p" weight="medium">{r.label}</Text>
				<Text as="p" size="sm" tone="muted">{r.hint}</Text>
			</div>
			<Switch bind:checked={prefs[r.key]} label={r.label} disabled={r.key === 'sounds' && !prefs.push} />
		</div>
	{/each}
</Stack>

<style>
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-4);
	}
</style>
