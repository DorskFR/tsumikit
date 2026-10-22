<script module>
	export const meta = {
		title: 'Team member list',
		caption: 'hue from the fixture, status snippet for presence, decorative because the row already shows the name.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Avatar, Cluster, Dot, Stack, Text } from '@dorsk/tsumikit';
	import { people } from '../../fixtures';
</script>

<Stack gap="var(--sp-2)" style="max-width: 22rem">
	{#each people as p (p.handle)}
		<Cluster gap="var(--sp-3)" align="center">
			<Avatar name={p.name} hue={p.hue} glyph={p.emoji} decorative>
				{#snippet status()}
					{#if p.online !== undefined}<Dot status={p.online ? 'active' : 'dead'} ring />{/if}
				{/snippet}
			</Avatar>
			<Stack gap="0" grow>
				<Text weight="medium" truncate>{p.name}</Text>
				<Text size="xs" tone="muted">{p.role}</Text>
			</Stack>
			<Text size="xs" tone="faint" mono>@{p.handle}</Text>
		</Cluster>
	{/each}
</Stack>
