<script module>
	export const meta = {
		title: 'Transaction details',
		caption: 'mode="middle" keeps both ends of hashes and addresses; copyable copies the full value on click; hover or focus a shortened value for the full text.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Card, KeyValue, Truncate, toasts } from '@dorsk/tsumikit';

	const copied = (ok: boolean) => toasts.show(ok ? 'Copied to clipboard' : 'Copy failed');
</script>

<Card>
	<KeyValue
		rows={[
			{ label: 'Status', value: status },
			{ label: 'Hash', value: hash },
			{ label: 'From', value: from },
			{ label: 'To', value: to },
			{ label: 'Memo', value: memo }
		]}
	/>
</Card>

{#snippet status()}<Badge tone="ok" size="sm">Confirmed</Badge>{/snippet}
{#snippet hash()}<Truncate text="0x9f4c2e71b0d8a35e6c1f22a7b94e0d3c5a8b17f6e2d09c4b3a1e5f7d8c6b2a90" max={18} mode="middle" mono copyable oncopy={copied} />{/snippet}
{#snippet from()}<Truncate text="0x71C7656EC7ab88b098defB751B7401B5f6d8976F" max={16} mode="middle" mono copyable oncopy={copied} />{/snippet}
{#snippet to()}<Truncate text="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" max={16} mode="middle" mono copyable oncopy={copied} />{/snippet}
{#snippet memo()}<Truncate text="Quarterly payout for the media-transcode contractors, batch 4 of 6" max={36} />{/snippet}
