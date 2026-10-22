<script module>
	export const meta = {
		title: 'Over artwork, on avatars, with a tooltip',
		caption: 'ring keeps the dot legible on a cover, status snippets pin it to Avatar and Artwork corners, interactive makes a bare dot focusable so a Tooltip can anchor it.'
	};
</script>

<script lang="ts">
	import { Artwork, Avatar, Dot, Text, Tooltip } from '@dorsk/tsumikit';
	import { people } from '../../fixtures';
</script>

<Artwork alt="Neon Rain" size="5rem">
	{#snippet status()}<Dot status="active" ring glow />{/snippet}
</Artwork>
{#each people.slice(0, 3) as p (p.handle)}
	<Avatar name={p.name} hue={p.hue} size="lg">
		{#snippet status()}<Dot status={p.online ? 'active' : 'dead'} ring />{/snippet}
	</Avatar>
{/each}
<Tooltip text="Worker heartbeat 4 s ago">
	{#snippet trigger()}<Dot status="active" interactive />{/snippet}
</Tooltip>
<Text size="sm" tone="muted">Inline <Dot status="stale" /> mid-sentence, baseline aligned.</Text>
