<script module>
	export const meta = {
		title: 'Right-hand inspector with live width',
		caption: 'side="right"; minWidth="10rem" and maxWidth="70%" take CSS lengths; onresize streams the width, onresizeend reports where it settled; resizeStep sets the arrow-key step.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { KeyValue, ResizablePanel, Stack, Text } from '@dorsk/tsumikit';

	let live = $state(240);
	let settled = $state(240);
</script>

<ResizablePanel
	side="right"
	label="Inspector"
	width={240}
	minWidth="10rem"
	maxWidth="70%"
	resizeStep={32}
	handlePlacement="top"
	onresize={(w) => (live = w)}
	onresizeend={(w) => (settled = w)}
	style="height: 13rem; border: 1px solid var(--border); border-radius: var(--r-md); overflow: hidden"
>
	{#snippet panel()}
		<Stack gap="var(--sp-2)" style="padding: var(--sp-3)">
			<Text weight="semibold">worker-02</Text>
			<KeyValue dense rows={[{ label: 'CPU', value: '87%' }, { label: 'Memory', value: '1.9 GB' }, { label: 'Region', value: 'eu-west-1' }]} />
		</Stack>
	{/snippet}
	<Stack gap="var(--sp-1)" style="padding: var(--sp-3)">
		<Text size="sm" numeric>Live: {live}px</Text>
		<Text size="sm" numeric tone="muted">Settled: {settled}px</Text>
	</Stack>
</ResizablePanel>
