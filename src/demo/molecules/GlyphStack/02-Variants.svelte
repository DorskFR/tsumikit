<script module>
	export const meta = {
		title: 'Fold modes and expand',
		caption: 'stack="never" | "always" | "auto"; folded cells are 1rem, so expand="tap" opens the four glyphs as big tiles on click and expand="slide" opens on press: drag toward a corner and release to fire it.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Avatar, Badge, Cluster, Dot, GlyphStack, IconButton, Text, toasts, type GlyphStackItem } from '@dorsk/tsumikit';

	let pinned = $state(false);
	const modes = [
		{ stack: 'never', expand: 'none', note: 'never: inline run' },
		{ stack: 'always', expand: 'none', note: 'always: 2×2 grid' },
		{ stack: 'always', expand: 'tap', note: 'always + expand="tap"' },
		{ stack: 'always', expand: 'slide', note: 'always + expand="slide"' }
	] as const;
	const items: GlyphStackItem[] = [
		{ inline: pin, action: () => (pinned = !pinned) },
		{ inline: live, action: () => toasts.show('worker-02 is running') },
		{ inline: region, stacked: regionTile, action: () => toasts.show('Region: eu-west-1') },
		{ inline: owner, action: () => toasts.show('Owner: Jun Tanaka') }
	];
</script>

{#snippet pin()}<IconButton icon="star" size={14} box="xs" variant="ghost" label={pinned ? 'Unpin' : 'Pin'} pressed={pinned} onclick={() => (pinned = !pinned)} />{/snippet}
{#snippet live()}<Dot status="active" label="Running" />{/snippet}
{#snippet region()}<Badge size="xs" mono>eu-west-1</Badge>{/snippet}
{#snippet regionTile()}<Avatar name="eu west" shape="square" size={16} decorative />{/snippet}
{#snippet owner()}<Avatar name="Jun Tanaka" size={16} />{/snippet}

{#each modes as v (v.note)}
	<Cluster gap="var(--sp-2)">
		<GlyphStack stack={v.stack} expand={v.expand} expandLabel="worker-02 details" {items} />
		<Text size="xs" tone="muted">{v.note}</Text>
	</Cluster>
{/each}
