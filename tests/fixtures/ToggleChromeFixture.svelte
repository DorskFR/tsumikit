<script lang="ts">
	import Icon from '../../src/lib/components/atoms/Icon.svelte';
	import Popover from '../../src/lib/components/molecules/Popover.svelte';
	import Toggle from '../../src/lib/components/molecules/Toggle.svelte';

	let { pressed = false, pill = false }: { pressed?: boolean; pill?: boolean } = $props();
</script>

<Toggle id="chip" {pressed} {pill}>Filters</Toggle>

<Popover label="Pins" variant="toggle" {pressed} {pill} id="pop">
	{#snippet trigger()}Pins{/snippet}
	{#snippet children()}pinned<!---->{/snippet}
</Popover>

<Toggle id="emoji">⚡ Auto</Toggle>
<Toggle id="glyph"><Icon name="zap" size={12} /> Auto</Toggle>
<Toggle id="text">Auto</Toggle>
