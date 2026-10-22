<script module>
	export const meta = {
		title: 'Call controls',
		caption: 'bind:value (0–1) and bind:muted; dragging the level up from zero unmutes, and onmutechange reports the toggle.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Avatar, Card, Cluster, Stack, Text, VolumeSlider } from '@dorsk/tsumikit';
	import { people } from '../../fixtures';

	let levels = $state(people.slice(0, 3).map((p, i) => ({ ...p, volume: [0.8, 0.45, 1][i], muted: i === 2 })));
	let speaker = $state(0.6);
	let speakerMuted = $state(false);
</script>

<Card>
	<Stack gap="var(--sp-3)">
		<Cluster justify="space-between" align="center">
			<Text weight="semibold">Speaker</Text>
			<VolumeSlider size="md" bind:value={speaker} bind:muted={speakerMuted} label="Speaker volume" />
		</Cluster>
		{#each levels as p (p.handle)}
			<Cluster justify="space-between" align="center">
				<Cluster gap="var(--sp-2)" align="center">
					<Avatar name={p.name} size={24} />
					<Text size="sm">{p.name}</Text>
				</Cluster>
				<VolumeSlider bind:value={p.volume} bind:muted={p.muted} label="{p.name} volume" muteLabel="Mute {p.name}" unmuteLabel="Unmute {p.name}" />
			</Cluster>
		{/each}
	</Stack>
</Card>
