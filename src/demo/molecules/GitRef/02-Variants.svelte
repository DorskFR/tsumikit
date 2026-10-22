<script module>
	export const meta = {
		title: 'Parts and PR states',
		caption: 'Any subset of branch, pr and diff; pr.state is open | merged | closed | draft (open when omitted); owner and repo add the slug to the label.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, GitRef, Text } from '@dorsk/tsumikit';

	const url = 'https://github.com/DorskFR/tsumikit/pull/';
	const states = ['open', 'merged', 'closed', 'draft'] as const;
</script>

<Cluster>
	{#each states as state, i (state)}
		<GitRef pr={{ url: `${url}${90 + i}`, number: 90 + i, state }} collapse="never" />
	{/each}
</Cluster>
<Cluster gap="var(--sp-4)">
	<Cluster gap="var(--sp-2)"><Text size="xs" tone="muted">branch</Text><GitRef branch="main" collapse="never" /></Cluster>
	<Cluster gap="var(--sp-2)"><Text size="xs" tone="muted">diff</Text><GitRef diff={{ additions: 128, deletions: 42 }} /></Cluster>
	<Cluster gap="var(--sp-2)">
		<Text size="xs" tone="muted">owner/repo</Text>
		<GitRef pr={{ url: `${url}77`, owner: 'DorskFR', repo: 'tsumikit', number: 77, state: 'merged' }} collapse="never" />
	</Cluster>
</Cluster>
