<script module>
	export const meta = {
		title: 'Gutters and full-bleed children',
		caption: 'gutter sets the inline padding (safe-area insets win when larger); a child with margin-inline: calc(-1 * var(--container-gutter)) bleeds to the column edge.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Container, Text } from '@dorsk/tsumikit';
</script>

{#each ['var(--sp-1)', 'var(--sp-4)', 'var(--sp-8)'] as gutter (gutter)}
	<div class="parent">
		<Container size="32rem" {gutter} class="ct-gutter">
			<Text size="xs" mono>gutter="{gutter}"</Text>
		</Container>
	</div>
{/each}
<div class="parent">
	<Container size="32rem" class="ct-flow">
		<Text weight="semibold">Night Drive · Kaleido</Text>
		<div class="bleed">Full-bleed cover art</div>
		<Text size="sm" tone="muted">Captions stay inside the gutter.</Text>
	</Container>
</div>

<style>
	.parent {
		padding-block: var(--sp-2);
		background: var(--surface);
		border-radius: var(--r-sm);
	}
	:global(.ct-gutter) {
		background: linear-gradient(var(--bg-elevated), var(--bg-elevated)) content-box,
			color-mix(in srgb, var(--accent) 22%, transparent);
	}
	:global(.ct-flow) {
		display: grid;
		gap: var(--sp-2);
	}
	.bleed {
		margin-inline: calc(-1 * var(--container-gutter));
		padding: var(--sp-6) var(--sp-4);
		background: linear-gradient(135deg, hsl(280 60% 45%), hsl(200 70% 45%));
		color: white;
		text-align: center;
	}
</style>
