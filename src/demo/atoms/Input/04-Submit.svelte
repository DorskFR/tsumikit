<script module>
	export const meta = {
		title: 'Enter to submit',
		caption: 'onenter fires with the value on Enter; onclear fires when the clear button empties it.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Input, Text } from '@dorsk/tsumikit';

	let draft = $state('');
	let sent = $state<string[]>([]);
</script>

<Input
	bind:value={draft}
	icon="send"
	clearable
	placeholder="Run a command and press Enter"
	aria-label="Command"
	mono
	onenter={(v) => {
		if (!v.trim()) return;
		sent = [v, ...sent].slice(0, 4);
		draft = '';
	}}
	onclear={() => (sent = [])}
/>
{#each sent as line (line)}
	<Text mono size="sm" tone="muted">$ {line}</Text>
{:else}
	<Text size="sm" tone="faint">Nothing sent yet.</Text>
{/each}
