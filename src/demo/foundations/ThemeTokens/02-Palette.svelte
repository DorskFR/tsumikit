<script module>
	export const meta = {
		title: 'Raw palette',
		caption: 'The --c-* hues a theme is built from; components use the semantic tokens above, apps reach for these only for charts and custom tints.',
		layout: 'row'
	};
</script>

<script lang="ts">
	import { Swatch, Text } from '@dorsk/tsumikit';
	import { paletteTokens } from './tokens';
</script>

{#each paletteTokens as token (token)}
	<div class="chip">
		<Swatch color="var({token})" size="lg" label={token} />
		<Text size="xs" mono tone="muted">{token.slice(4)}</Text>
	</div>
{/each}

<style>
	.chip {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: var(--sp-1);
	}
</style>
