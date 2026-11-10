<script module>
	export const meta = {
		title: 'Reserve the final box',
		caption: 'without height each line fills the 1lh line box of the surrounding text, so lines={3} is as tall as three lines; aspect reserves a cover tile and control a form row.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Artwork, AutoGrid, Card, Cluster, Field, Input, Skeleton, Stack, Switch, Text } from '@dorsk/tsumikit';

	let loading = $state(true);
	const settings = [
		{ label: 'Library name', value: 'Evening shelf' },
		{ label: 'Scan folder', value: '/media/music' },
		{ label: 'Metadata language', value: 'English' },
	];
</script>

<Switch bind:checked={loading} label="Loading" />
<AutoGrid min="14rem" gap="var(--sp-4)">
	<Card padding="sm">
		<Text as="p" size="sm">
			Recorded live over two nights in Osaka.<br />
			Remastered from the original tapes.<br />
			Includes three unreleased takes.
		</Text>
	</Card>
	<Card padding="sm" aria-busy="true">
		<Text as="p" size="sm"><Skeleton lines={3} /></Text>
	</Card>
</AutoGrid>
<Cluster gap="var(--sp-4)" align="start">
	<Stack gap="var(--sp-2)" style="width: 8rem">
		<Artwork seed="Night Drive" alt="Night Drive" aspect="2/3" size="100%" />
		<Stack gap="0">
			<Text size="sm" weight="medium" truncate>Night Drive</Text>
			<Text size="xs" tone="muted" truncate>Mika Sato</Text>
		</Stack>
	</Stack>
	<Stack gap="var(--sp-2)" style="width: 8rem" aria-busy="true">
		<Skeleton aspect="2/3" />
		<Stack gap="0">
			<Text size="sm" weight="medium"><Skeleton width="80%" /></Text>
			<Text size="xs"><Skeleton width="50%" /></Text>
		</Stack>
	</Stack>
</Cluster>
<Card maxWidth="24rem" aria-busy={loading}>
	<Stack gap="var(--sp-3)">
		{#each settings as s (s.label)}
			{#if loading}
				<Field>
					<Text size="sm"><Skeleton width="7rem" /></Text>
					<Skeleton control />
				</Field>
			{:else}
				<Field label={s.label}>
					<Input value={s.value} />
				</Field>
			{/if}
		{/each}
	</Stack>
</Card>
