<script module>
	export const meta = {
		title: 'Semantic colours',
		caption: 'Each swatch paints var(--token) live, so switching the theme in the toolbar re-colours this grid; the resolved value is read in $effect.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Swatch, Text, theme } from '@dorsk/tsumikit';
	import { colorTokens } from './tokens';

	let resolved = $state<Record<string, string>>({});
	$effect(() => {
		void theme.current;
		const cs = getComputedStyle(document.documentElement);
		resolved = Object.fromEntries(colorTokens.map(([t]) => [t, cs.getPropertyValue(t).trim()]));
	});
</script>

{#each colorTokens as [token, role] (token)}
	<div class="token">
		<Swatch color="var({token})" shape="square" size="lg" label={token} />
		<div class="text">
			<Text size="sm" mono>{token}</Text>
			<Text size="xs" tone="muted">{role}</Text>
			<Text size="xs" tone="faint" mono>{resolved[token] ?? ''}</Text>
		</div>
	</div>
{/each}

<style>
	.token {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		min-width: 0;
	}
	.text {
		display: grid;
		min-width: 0;
	}
</style>
