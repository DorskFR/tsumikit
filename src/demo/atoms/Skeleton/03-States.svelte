<script module>
	export const meta = {
		title: 'List and table placeholders',
		caption: 'rows built from bars of varying width read as a list or a table; every bar on screen shimmers in sync.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Card, Cluster, Skeleton, Stack } from '@dorsk/tsumikit';

	const widths = ['70%', '55%', '80%', '45%', '65%'];
</script>

<Card padding="sm" aria-busy="true">
	<Stack gap="var(--sp-3)">
		{#each widths as w (w)}
			<Cluster gap="var(--sp-2)" align="center">
				<Skeleton circle height="28px" />
				<Stack gap="var(--sp-1)" grow>
					<Skeleton width={w} />
					<Skeleton width="30%" height="0.7em" />
				</Stack>
			</Cluster>
		{/each}
	</Stack>
</Card>
<Card padding="sm" aria-busy="true">
	<Stack gap="var(--sp-2)">
		<Cluster gap="var(--sp-2)">
			<Skeleton width="30%" height="0.75em" /><Skeleton width="20%" height="0.75em" /><Skeleton width="15%" height="0.75em" />
		</Cluster>
		{#each widths as w (w)}
			<Cluster gap="var(--sp-2)">
				<Skeleton width="30%" /><Skeleton width={w === '70%' ? '20%' : '18%'} /><Skeleton width="15%" />
			</Cluster>
		{/each}
	</Stack>
</Card>
