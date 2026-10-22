<script module>
	export const meta = {
		title: 'States',
		caption: 'disabled; hideOnTouch={false} keeps the slab on phones (the default leaves only the mute button, since phones use hardware keys); step sets the arrow and wheel increment.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Text, VolumeSlider } from '@dorsk/tsumikit';

	let coarse = $state(0.5);
	let changes = $state(0);
</script>

<Cluster gap="var(--sp-3)">
	<VolumeSlider value={0.6} disabled label="Volume (no output device)" />
	<Text size="sm" tone="muted">disabled: no output device</Text>
</Cluster>
<Cluster gap="var(--sp-3)">
	<VolumeSlider value={0.4} hideOnTouch={false} label="Volume always visible" />
	<Text size="sm" tone="muted">slab stays visible on touch screens</Text>
</Cluster>
<Cluster gap="var(--sp-3)">
	<VolumeSlider bind:value={coarse} step={0.25} onchange={() => changes++} label="Volume in quarters" />
	<Text size="sm" tone="muted" numeric>step 0.25 · {Math.round(coarse * 100)}% · {changes} changes</Text>
</Cluster>
