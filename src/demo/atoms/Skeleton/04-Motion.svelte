<script module>
	export const meta = {
		title: 'Sheen sweep and soft pulse',
		caption: 'variant sheen sends one light across each bar in step; variant pulse breathes each bar a beat behind the last, --skeleton-phase offsets a later set.',
		layout: 'row'
	};
</script>

<script lang="ts">
	import { Card, Cluster, Skeleton, Stack } from '@dorsk/tsumikit';

	const variants = ['sheen', 'pulse'] as const;
</script>

{#each variants as variant (variant)}
	<Card padding="sm" maxWidth="18rem" aria-busy="true">
		<Stack gap="var(--sp-3)">
			<Cluster gap="var(--sp-3)" align="center" wrap={false}>
				<Skeleton {variant} circle height="2.5rem" />
				<Stack gap="var(--sp-2)" style="flex: 1; min-width: 0">
					<Skeleton {variant} width="55%" height="0.8rem" />
					<Skeleton {variant} width="35%" height="0.65rem" style="--skeleton-phase: 1" />
				</Stack>
			</Cluster>
			<Skeleton {variant} lines={3} height="0.75rem" style="--skeleton-phase: 2" />
		</Stack>
	</Card>
{/each}
