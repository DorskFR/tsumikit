<script module>
	export const meta = {
		title: 'Layer and tint',
		caption: 'z picks the layer (drawer by default); style overrides the background for a darker or tinted wash; label names the click target.',
		layout: 'frame',
		height: '16rem'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Scrim, Text } from '@dorsk/tsumikit';

	let shown = $state<'none' | 'default' | 'dark' | 'tinted'>('none');
</script>

<div class="stage">
	<Cluster style="padding: var(--sp-4)">
		<Button size="sm" onclick={() => (shown = 'default')}>Default</Button>
		<Button size="sm" onclick={() => (shown = 'dark')}>Dark</Button>
		<Button size="sm" onclick={() => (shown = 'tinted')}>Tinted</Button>
		<Text size="sm" tone="muted">then click or press Escape</Text>
	</Cluster>
	{#if shown === 'default'}
		<Scrim onclose={() => (shown = 'none')} label="Dismiss" />
	{:else if shown === 'dark'}
		<Scrim onclose={() => (shown = 'none')} style="background: color-mix(in srgb, black 60%, transparent)" />
	{:else if shown === 'tinted'}
		<Scrim onclose={() => (shown = 'none')} z="var(--z-modal)" style="background: color-mix(in srgb, var(--accent) 25%, transparent)" />
	{/if}
</div>

<style>
	.stage {
		position: relative;
		height: 100%;
		min-height: 16rem;
		contain: layout paint;
	}
</style>
