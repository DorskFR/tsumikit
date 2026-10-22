<script module>
	export const meta = {
		title: 'Message composer',
		caption: 'leading FileButton, an autoresize Textarea and a trailing SplitButton; past one row the adornments move to a bar under the text.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { FileButton, InputGroup, SplitButton, Textarea, toasts, type MenuItem } from '@dorsk/tsumikit';

	let message = $state('');
	const schedule: MenuItem[] = [
		{ label: 'Send tomorrow 09:00', icon: 'clock', onselect: () => toasts.show('Scheduled for tomorrow') },
		{ label: 'Send next Monday', icon: 'calendar', onselect: () => toasts.show('Scheduled for Monday') }
	];
</script>

<div class="composer">
	<InputGroup>
		{#snippet leading()}
			<FileButton iconOnly label="Attach" variant="ghost" box="sm" multiple onfiles={(f) => toasts.show(`${f.length} file(s) attached`)} />
		{/snippet}
		<Textarea bind:value={message} autoresize rows={1} resize="top" maxHeight="10rem" placeholder="Message #platform" aria-label="Message" />
		{#snippet trailing()}
			<SplitButton variant="primary" size="sm" label="Schedule send" items={schedule} onclick={() => toasts.ok('Sent')}>Send</SplitButton>
		{/snippet}
	</InputGroup>
</div>

<style>
	.composer {
		max-width: 36rem;
	}
</style>
