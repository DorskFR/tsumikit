<script module>
	export const meta = {
		title: 'Settings panel, disabled, levels from the store',
		caption: 'a settings row; disabled; SCALE_LEVELS and fontScale.set(id) drive the same value from plain buttons.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, FontScalePicker, Text, fontScale, SCALE_LEVELS } from '@dorsk/tsumikit';
</script>

<div class="row">
	<span class="copy">
		<Text weight="medium">Text size</Text>
		<Text size="sm" tone="muted">Only text scales; buttons, inputs and icons keep their size.</Text>
	</span>
	<FontScalePicker />
</div>
<Cluster align="center">
	<FontScalePicker disabled />
	<Text size="sm" tone="muted">disabled</Text>
</Cluster>
<Cluster>
	{#each SCALE_LEVELS as l (l.id)}
		<Button size="sm" variant={fontScale.levelId === l.id ? 'primary' : 'default'} onclick={() => fontScale.set(l.id)}>{l.label}</Button>
	{/each}
</Cluster>

<style>
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-3);
	}
	.copy {
		display: grid;
		min-width: 0;
	}
</style>
