<script module>
	export const meta = {
		title: 'Empty, full, over and long labels',
		caption: 'value 0, value at max, value past max (clamped by the bar, honest in the readout), a caption snippet and a label that truncates.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Meter } from '@dorsk/tsumikit';
</script>

<div class="meters">
	<Meter label="Nothing used yet" value={0} max={100} />
	<Meter label="Full" value={100} max={100} toneAt={{ warn: 75, danger: 95 }} />
	<Meter label="Over quota" value={118} max={100} format={(v, m) => `${v}% of ${m}%`} tone="danger">
		{#snippet caption()}<Badge tone="danger" size="xs">18% over the cap</Badge>{/snippet}
	</Meter>
	<Meter label="A very long meter label that should not push the readout off the row on a phone" value={42} markers={[{ at: 25 }, { at: 50 }, { at: 75 }]} size="sm" />
</div>

<style>
	.meters {
		display: grid;
		gap: var(--sp-3);
		max-width: 28rem;
	}
</style>
