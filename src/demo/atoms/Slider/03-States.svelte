<script module>
	export const meta = {
		title: 'States',
		caption: 'disabled, invalid, values pinned at min and max, a negative range, and a fine step that stays quiet while dragging.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Field, Slider } from '@dorsk/tsumikit';

	let temp = $state(-4);
	let gain = $state(0.35);
</script>

<Slider value={40} disabled label="Disabled" showValue />
<Slider value={120} max={100} invalid label="Over budget" showValue format={(v) => `${v}%`} />
<Slider value={0} label="At minimum" showValue />
<Slider value={100} label="At maximum" showValue />
<Field label="Freezer target" hint="Negative ranges work like any other.">
	<Slider bind:value={temp} min={-30} max={10} ticks={[-30, -18, 0, 10]} showValue format={(v) => `${v} °C`} />
</Field>
<Slider bind:value={gain} min={0} max={1} step={0.01} label="Gain" showValue format={(v) => v.toFixed(2)} />
