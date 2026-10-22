<script module>
	export const meta = {
		title: 'Meter, Progress, Gauge and CapBar',
		caption: 'the same 62% as a Meter (label + readout), a bare Progress, an inline Gauge and a CapBar with a draggable cap.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { CapBar, Cluster, Gauge, Meter, Progress, Text } from '@dorsk/tsumikit';

	let cap = $state(80);
</script>

<div class="compare">
	<Meter label="Meter" value={62} toneAt={{ warn: 75, danger: 90 }} caption="for a labelled level with thresholds" />
	<Progress value={62} label="Progress" />
	<Cluster align="center">
		<Gauge value={62} label="Gauge" warnAt={75} dangerAt={90} />
		<Text size="sm" tone="muted">Gauge: a glanceable dial inside a row</Text>
	</Cluster>
	<CapBar label="CapBar" value={62} bind:cap hint="resets 3h" />
</div>

<style>
	.compare {
		display: grid;
		gap: var(--sp-4);
		max-width: 32rem;
	}
</style>
