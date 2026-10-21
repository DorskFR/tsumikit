<script module>
	export const meta = {
		title: 'Hotbar slots and links',
		caption: 'layout="stacked" puts glyph over the label with a shortcut hint; href renders a real link with the same chrome.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster } from '@dorsk/tsumikit';
</script>

<Cluster>
	<Button layout="stacked" size="sm" glyph="■" shortcut="1" tone="danger">Disarm</Button>
	<Button layout="stacked" size="sm" glyph="⇢" shortcut="2">Go zone</Button>
	<Button layout="stacked" size="sm" glyph="$" shortcut="3" disabled>Sell all</Button>
	<Button layout="stacked" size="sm" glyph="☰" shortcut="G" pressed count={2}>Group</Button>
	<Button layout="stacked" glyph="search" shortcut="F">Find</Button>
	<Button layout="stacked" size="lg" glyph="star" shortcut="S">Star</Button>
</Cluster>
<Cluster>
	<Button href="https://github.com/DorskFR/tsumikit" target="_blank">Open repository</Button>
	<Button as="a" href="#button" variant="ghost">Back to top of section</Button>
	<Button href="#nowhere" disabled>Inactive link</Button>
</Cluster>
