<script module>
	export const meta = {
		title: 'Notification preferences',
		caption: 'variant and count on the trigger; children receive { close } so a footer button can dismiss the panel.',
	};
</script>

<script lang="ts">
	import { Button, Icon, Popover, Switch, Text } from '@dorsk/tsumikit';

	let prefs = $state({ mentions: true, deploys: true, digest: false });
	const on = $derived(Object.values(prefs).filter(Boolean).length);
</script>

<Popover label="Notification preferences" variant="default" count={on} placement="bottom-start">
	{#snippet trigger()}<Icon name="bell" size={16} /> Notifications{/snippet}
	{#snippet children({ close })}
		<div class="panel">
			<Text weight="semibold" size="sm">Notify me about</Text>
			<Switch label="Mentions" bind:checked={prefs.mentions} />
			<Switch label="Deploys to production" bind:checked={prefs.deploys} />
			<Switch label="Weekly digest" bind:checked={prefs.digest} />
			<div class="foot">
				<Text size="xs" tone="muted">{on} of 3 on</Text>
				<Button size="sm" variant="primary" onclick={close}>Done</Button>
			</div>
		</div>
	{/snippet}
</Popover>

<style>
	.panel {
		display: grid;
		gap: var(--sp-2);
		min-width: 15rem;
		padding: var(--sp-3);
	}
	.foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: var(--sp-1);
	}
</style>
