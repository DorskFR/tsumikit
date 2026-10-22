<script module>
	export const meta = {
		title: 'API keys and install command',
		caption: 'text is the string copied; box="sm" makes an icon-only square beside a code value.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { CopyButton, Text } from '@dorsk/tsumikit';

	const secrets = [
		{ label: 'Publishable key', value: 'pk_live_4f8a0c21e9b7d3f9a' },
		{ label: 'Secret key', value: 'sk_live_••••••••••••c21e' },
		{ label: 'Webhook URL', value: 'https://hooks.example.dev/in/7d3f9a' }
	];
</script>

<dl class="keys">
	{#each secrets as { label, value } (label)}
		<dt><Text size="sm" tone="muted">{label}</Text></dt>
		<dd>
			<Text mono size="sm" truncate>{value}</Text>
			<CopyButton text={value} box="sm" />
		</dd>
	{/each}
</dl>
<div class="install">
	<Text mono size="sm">npm i @dorsk/tsumikit</Text>
	<CopyButton text="npm i @dorsk/tsumikit" label="Copy command" />
</div>

<style>
	.keys {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: var(--sp-2) var(--sp-4);
		align-items: center;
		margin: 0;
	}
	dd {
		display: flex;
		align-items: center;
		gap: var(--sp-1);
		min-width: 0;
		margin: 0;
	}
	.install {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-2);
		padding: var(--sp-2) var(--sp-3);
		border: 1px solid var(--border);
		border-radius: var(--r-md);
		background: var(--surface);
	}
</style>
