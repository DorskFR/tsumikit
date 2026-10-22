<script module>
	export const meta = {
		title: 'Content shapes',
		caption: 'items accepts plain strings; fewer than four cells leave the grid partly empty; children takes a free-form run where each direct child is a cell; the inline gap follows --glyph-stack-gap.'
	};
</script>

<script lang="ts">
	import { Cluster, Dot, GlyphStack, Icon, Text } from '@dorsk/tsumikit';
</script>

<Cluster gap="var(--sp-2)">
	<GlyphStack stack="always" items={[{ inline: '🔒' }, { inline: '⚡' }, { inline: '☁' }, { inline: '★' }]} />
	<Text size="xs" tone="muted">strings</Text>
</Cluster>
<Cluster gap="var(--sp-2)">
	<GlyphStack stack="always" items={[{ inline: '🔒' }, { inline: '⚡' }]} />
	<Text size="xs" tone="muted">two items</Text>
</Cluster>
<Cluster gap="var(--sp-2)">
	<GlyphStack stack="always" items={[{ inline: '🔒' }]} />
	<Text size="xs" tone="muted">one item</Text>
</Cluster>
<Cluster gap="var(--sp-2)">
	<GlyphStack stack="always">
		<Icon name="git-branch" size={12} />
		<Icon name="lock" size={12} />
		<Dot status="stale" />
	</GlyphStack>
	<Text size="xs" tone="muted">children</Text>
</Cluster>
<Cluster gap="var(--sp-2)">
	<GlyphStack stack="never" style="--glyph-stack-gap: var(--sp-3)">
		<Icon name="git-branch" size={14} />
		<Icon name="lock" size={14} />
		<Dot status="dead" label="Offline" />
	</GlyphStack>
	<Text size="xs" tone="muted">wider gap</Text>
</Cluster>
