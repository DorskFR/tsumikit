<script module>
	export const meta = {
		title: 'Album shelf',
		caption: 'no src, so every tile is the seeded gradient with initials; seed keeps one album one colour; hover marks the tiles as tappable.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Artwork, Cluster, Stack, Text } from '@dorsk/tsumikit';
	import { tracks } from '../../fixtures';

	let playing = $state(tracks[0].id);
	const current = $derived(tracks.find((t) => t.id === playing) ?? tracks[0]);
</script>

<Cluster gap="var(--sp-4)" align="center">
	<Artwork alt={current.album} seed={current.album} size="4.5rem" radius="lg" />
	<Stack gap="0">
		<Text weight="semibold">{current.title}</Text>
		<Text size="sm" tone="muted">{current.artist} · {current.album}</Text>
	</Stack>
</Cluster>
<Cluster gap="var(--sp-3)">
	{#each tracks as t (t.id)}
		<button type="button" class="tile" onclick={() => (playing = t.id)} aria-pressed={playing === t.id}>
			<Artwork alt="" seed={t.album} size="5.5rem" hover />
			<Text size="xs" truncate block>{t.title}</Text>
		</button>
	{/each}
</Cluster>

<style>
	.tile {
		all: unset;
		display: grid;
		gap: var(--sp-1);
		width: 5.5rem;
		cursor: pointer;
		border-radius: var(--r-md);
	}
	.tile:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
