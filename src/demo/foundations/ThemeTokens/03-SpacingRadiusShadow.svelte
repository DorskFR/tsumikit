<script module>
	export const meta = {
		title: 'Spacing, radius and shadow',
		caption: '--sp-* is a 4px-based scale, --r-* the corner radii, --shadow-* the three elevations; all are plain CSS lengths you can use in your own rules.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Text } from '@dorsk/tsumikit';
	import { radiusTokens, shadowTokens, spacingTokens } from './tokens';
</script>

<div class="rows">
	{#each spacingTokens as token (token)}
		<Text size="xs" mono tone="muted">{token}</Text>
		<span class="bar" style="width: var({token})"></span>
	{/each}
</div>
<Cluster gap="var(--sp-4)">
	{#each radiusTokens as token (token)}
		<span class="box" style="border-radius: var({token})"><Text size="xs" mono>{token.slice(2)}</Text></span>
	{/each}
</Cluster>
<Cluster gap="var(--sp-6)">
	{#each shadowTokens as token (token)}
		<span class="box raised" style="box-shadow: var({token})"><Text size="xs" mono>{token.slice(2)}</Text></span>
	{/each}
</Cluster>

<style>
	.rows {
		display: grid;
		grid-template-columns: 6rem 1fr;
		gap: var(--sp-1) var(--sp-3);
		align-items: center;
	}
	.bar {
		display: block;
		height: 0.75rem;
		background: var(--accent);
		border-radius: var(--r-xs);
	}
	.box {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 5rem;
		height: 3rem;
		border: 1px solid var(--border-strong);
		background: var(--bg-elevated);
	}
	.raised {
		border-color: var(--border);
		border-radius: var(--r-md);
	}
</style>
