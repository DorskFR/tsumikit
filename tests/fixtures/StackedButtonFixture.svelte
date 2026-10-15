<script lang="ts">
	import Button from '../../src/lib/components/atoms/Button.svelte';
</script>

<Button id="slot" layout="stacked" size="sm" glyph="■" shortcut="1" tone="danger">Disarm</Button>
<Button id="icon" layout="stacked" glyph="search" shortcut="2" count={3}>Find</Button>
<Button id="snippet" layout="stacked" shortcut="G" aria-keyshortcuts="Shift+G" pressed>
	{#snippet glyph()}<b>☰</b>{/snippet}
	Group
</Button>
<Button id="plain" layout="stacked" glyph="$">Sell all</Button>
<Button id="inline">Save</Button>
