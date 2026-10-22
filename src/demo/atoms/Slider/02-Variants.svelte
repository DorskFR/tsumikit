<script module>
	export const meta = {
		title: 'Ticks, marks and widths',
		caption: 'ticks={true} dots every step, ticks={[…]} at chosen values; marks adds a clickable label row; width pins the control.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Slider } from '@dorsk/tsumikit';

	let quality = $state(50);
	let size = $state(16);
	let threshold = $state(80);
	let brightness = $state(60);
</script>

<Slider bind:value={quality} step={25} ticks label="Quality" showValue />
<Slider bind:value={size} min={12} max={24} step={1} ticks label="Font size" showValue format={(v) => `${v}px`} />
<Slider bind:value={threshold} ticks={[50, 70, 90]} marks={[{ value: 50, label: 'Low' }, { value: 70, label: 'Warn' }, { value: 90, label: 'Danger' }]} label="Alert threshold" />
<Cluster>
	<Slider bind:value={brightness} width="10rem" label="Brightness" showValue />
	<Slider bind:value={brightness} width="16rem" label="Brightness" showValue style="--slider-accent: var(--warn)" />
</Cluster>
