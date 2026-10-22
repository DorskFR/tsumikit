<script module>
	export const meta = {
		title: 'Composer send',
		caption: 'variant="primary" with control height; items fill the caret Menu, onclick is the primary action, ArrowDown opens the menu.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { SplitButton, Text, Textarea, toasts, type MenuItem } from '@dorsk/tsumikit';

	let draft = $state('Deploy window moves to 22:00 UTC tonight, heads up.');
	let sending = $state(false);

	const schedule: MenuItem[] = [
		{ label: 'Later today', icon: 'clock', onselect: () => toasts.show('Scheduled for 18:00') },
		{ label: 'Tomorrow 9:00', icon: 'clock', onselect: () => toasts.show('Scheduled for tomorrow') },
		{ label: 'Custom time…', icon: 'calendar', onselect: () => toasts.show('Pick a time') }
	];

	async function send() {
		sending = true;
		await new Promise((r) => setTimeout(r, 700));
		sending = false;
		toasts.ok('Message sent to #ops');
	}
</script>

<Textarea bind:value={draft} autoresize placeholder="Message #ops" />
<div class="bar">
	<Text size="sm" tone="muted">{draft.length} characters</Text>
	<SplitButton variant="primary" control label="More send options" items={schedule} loading={sending} onclick={send}>
		Send
	</SplitButton>
</div>

<style>
	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-2);
	}
</style>
