<script module>
	export const meta = {
		title: 'Storage and budget',
		caption: 'value and max with a custom format, toneAt thresholds, markers with labels, a caption and an actions snippet.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Meter } from '@dorsk/tsumikit';

	const gb = (v: number, m: number) => `${v} / ${m} GB`;
	const usd = (v: number, m: number) => `$${v} of $${m}`;
</script>

<div class="meters">
	<Meter
		label="NVMe pool"
		value={742}
		max={960}
		format={gb}
		toneAt={{ warn: 70, danger: 90 }}
		markers={[{ at: 80, label: 'alert', tone: 'warn' }]}
		caption="harbor, jellyfin, gitea and langfuse share this pool"
	>
		{#snippet actions()}<Button size="sm" variant="ghost">Expand</Button>{/snippet}
	</Meter>
	<Meter label="Monthly budget" value={184} max={250} format={usd} toneAt={{ warn: 75, danger: 95 }} caption="resets on the 1st" />
	<Meter label="Context window" value={128} max={200} format={(v, m) => `${v}k / ${m}k tokens`} tone="info" />
</div>

<style>
	.meters {
		display: grid;
		gap: var(--sp-4);
		max-width: 32rem;
	}
</style>
