<script lang="ts">
	import Avatar from '../../src/lib/components/atoms/Avatar.svelte';
	import Dot from '../../src/lib/components/atoms/Dot.svelte';

	let {
		name = 'dorsk',
		glyph,
		seed,
		hue,
		tone,
		size = 'md',
		shape = 'circle',
		decorative = false,
		withStatus = false
	}: {
		name?: string;
		glyph?: string;
		seed?: string;
		hue?: number;
		tone?: 'accent' | 'neutral' | 'none';
		size?: 'xs' | 'sm' | 'md' | 'lg' | number;
		shape?: 'circle' | 'square';
		decorative?: boolean;
		withStatus?: boolean;
	} = $props();
</script>

{#if withStatus}
	<Avatar {name} {glyph} {seed} {hue} {tone} {size} {shape} {decorative} class="probe" data-probe="x">
		{#snippet status()}<Dot status="dead" />{/snippet}
	</Avatar>
{:else}
	<Avatar {name} {glyph} {seed} {hue} {tone} {size} {shape} {decorative} class="probe" data-probe="x" />
{/if}
