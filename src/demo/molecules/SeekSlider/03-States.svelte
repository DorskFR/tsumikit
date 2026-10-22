<script module>
	export const meta = {
		title: 'States',
		caption: 'disabled; max={null} (live) and max={0} (not loaded) make the track inert; value is clamped to the duration.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Cluster, SeekSlider, Text } from '@dorsk/tsumikit';
</script>

<Text size="xs" tone="muted">disabled while an ad plays</Text>
<SeekSlider value={20} max={30} disabled label="Seek (ad)" />
<Cluster gap="var(--sp-2)" align="center">
	<Badge tone="danger" size="xs">LIVE</Badge>
	<Text size="xs" tone="muted">a live stream has no duration</Text>
</Cluster>
<SeekSlider value={5400} max={null} size="sm" label="Seek live" />
<Text size="xs" tone="muted">metadata not loaded yet</Text>
<SeekSlider value={0} max={0} label="Seek loading" />
<Text size="xs" tone="muted">at the end, and a value past the duration clamps</Text>
<SeekSlider value={243} max={243} label="Seek ended" />
<SeekSlider value={9999} max={243} size="sm" label="Seek clamped" />
<Text size="xs" tone="muted">ten-hour stream recording</Text>
<SeekSlider value={21_600} max={36_000} buffered={[[0, 36_000]]} label="Seek VOD" />
