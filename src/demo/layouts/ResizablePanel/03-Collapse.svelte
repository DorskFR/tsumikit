<script module>
	export const meta = {
		title: 'Collapsible build log',
		caption: 'bind:collapsed drives the panel from outside as well as from its edge chevron; persistCollapsed={false} keeps only the width.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, ResizablePanel, Stack, Text } from '@dorsk/tsumikit';

	let collapsed = $state(false);
	const lines = ['$ npm run build', 'vite v6.0.0 building for production…', '✓ 412 modules transformed', 'built in 3.84s'];
</script>

<Cluster>
	<Button size="sm" pressed={!collapsed} onclick={() => (collapsed = !collapsed)}>
		{collapsed ? 'Show log' : 'Hide log'}
	</Button>
</Cluster>
<ResizablePanel
	label="Build log"
	bind:collapsed
	width={260}
	minWidth={160}
	widthKey="tsumikit-demo-build-log"
	persistCollapsed={false}
	style="height: 11rem; border: 1px solid var(--border); border-radius: var(--r-md); overflow: hidden"
>
	{#snippet panel()}
		<Stack gap="var(--sp-0-5)" style="padding: var(--sp-3)">
			{#each lines as line (line)}<Text mono size="xs" wrap="anywhere">{line}</Text>{/each}
		</Stack>
	{/snippet}
	<Stack gap="var(--sp-1)" style="padding: var(--sp-3)">
		<Text weight="semibold">Deploy #1824</Text>
		<Text size="sm" tone="muted">main · 4 commits · passed</Text>
	</Stack>
</ResizablePanel>
