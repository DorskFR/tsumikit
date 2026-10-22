<script module>
	export const meta = {
		title: 'Sizes, orientation and levels',
		caption: 'size="sm" | "md"; orientation="vertical" for mixers; the icon steps through volume, volume-low, volume-high and volume-mute.'
	};
</script>

<script lang="ts">
	import { Stack, Text, VolumeSlider } from '@dorsk/tsumikit';

	const channels = ['Music', 'Voice', 'Effects', 'Ambience'];
	let mix = $state([0.8, 1, 0.35, 0.1]);
</script>

<Stack gap="var(--sp-2)">
	<Text size="xs" tone="muted">sm · md</Text>
	<VolumeSlider value={0.5} label="Small volume" />
	<VolumeSlider size="md" value={0.5} label="Medium volume" />
	<Text size="xs" tone="muted">0 · 30% · 80% · muted</Text>
	<VolumeSlider value={0} label="Silent" />
	<VolumeSlider value={0.3} label="Low" />
	<VolumeSlider value={0.8} label="High" />
	<VolumeSlider value={0.8} muted label="Muted" />
</Stack>
<div class="mixer">
	{#each channels as name, i (name)}
		<Stack gap="var(--sp-1)" align="center">
			<VolumeSlider orientation="vertical" bind:value={mix[i]} label="{name} level" />
			<Text size="xs" tone="muted">{name}</Text>
		</Stack>
	{/each}
</div>

<style>
	.mixer {
		display: flex;
		flex-wrap: wrap;
		gap: var(--sp-4);
	}
</style>
