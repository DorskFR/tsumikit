<script module>
	export const meta = {
		title: 'Profile card while loading',
		caption: 'circle for the avatar, single bars for the name and role, lines={3} for the bio; the card toggles to real content and carries aria-busy.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Avatar, Button, Card, Cluster, Skeleton, Stack, Text } from '@dorsk/tsumikit';
	import { people } from '../../fixtures';

	let loading = $state(true);
	const p = people[0];
</script>

<Card maxWidth="24rem" aria-busy={loading}>
	<Stack gap="var(--sp-3)">
		<Cluster gap="var(--sp-3)" align="center">
			{#if loading}
				<Skeleton circle height="40px" />
				<Stack gap="var(--sp-1)" grow>
					<Skeleton width="9rem" />
					<Skeleton width="5rem" height="0.75em" />
				</Stack>
			{:else}
				<Avatar name={p.name} hue={p.hue} glyph={p.emoji} size="lg" decorative />
				<Stack gap="0">
					<Text weight="semibold">{p.name}</Text>
					<Text size="sm" tone="muted">{p.role}</Text>
				</Stack>
			{/if}
		</Cluster>
		{#if loading}
			<Skeleton lines={3} height="0.85em" />
		{:else}
			<Text size="sm">Runs the platform team. Owns deploy tooling, the on-call rota and the quarterly reliability review.</Text>
		{/if}
	</Stack>
</Card>
<Button size="sm" onclick={() => (loading = !loading)}>{loading ? 'Finish loading' : 'Load again'}</Button>
