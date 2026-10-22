<script module>
	export const meta = {
		title: 'States',
		caption: 'disabled stops both segments; menuDisabled keeps the primary; loading busies it; primaryProps carries title and aria-describedby; placement flips the menu.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, SplitButton, Text, toasts, type MenuItem } from '@dorsk/tsumikit';

	const items: MenuItem[] = [
		{ label: 'Later today', icon: 'clock', onselect: () => toasts.show('Scheduled') },
		{ label: 'Custom time…', icon: 'calendar', onselect: () => toasts.show('Pick a time') }
	];
	let open = $state(false);
</script>

<Cluster align="center">
	<SplitButton variant="primary" disabled label="Send options" {items}>Disabled</SplitButton>
	<SplitButton variant="primary" menuDisabled label="Send options" {items} onclick={() => toasts.ok('Sent')}>
		Menu disabled
	</SplitButton>
	<SplitButton variant="primary" loading label="Send options" {items}>Sending</SplitButton>
	<SplitButton
		variant="primary"
		disabled
		label="Send options"
		{items}
		primaryProps={{ title: 'Pick a recipient first', 'aria-describedby': 'split-why' }}
	>
		Needs a recipient
	</SplitButton>
	<span id="split-why" class="sr-only">Pick a recipient first</span>
</Cluster>
<Cluster align="center">
	<SplitButton label="Send options" {items} placement="top-start" onclick={() => toasts.show('Sent')}>Opens upward</SplitButton>
	<SplitButton label="Send options" {items} bind:open onclick={() => toasts.show('Sent')}>Bound open</SplitButton>
	<Text size="sm" tone="muted">menu {open ? 'open' : 'closed'}</Text>
</Cluster>

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
	}
</style>
