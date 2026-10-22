<script module>
	export const meta = {
		title: 'Code editor file tree',
		caption: 'Drag or arrow-key the separator; widthKey restores the width and the collapsed state on reload, clamped to minWidth and maxWidth.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { NavItem, ResizablePanel, Stack, Text } from '@dorsk/tsumikit';

	const tree = [
		{ path: 'src/lib/index.ts', icon: 'file-text' },
		{ path: 'src/lib/components', icon: 'folder' },
		{ path: 'src/routes/+page.svelte', icon: 'file' },
		{ path: 'README.md', icon: 'markdown' },
		{ path: 'package.json', icon: 'file-text' }
	] as const;
	let current = $state('src/lib/index.ts');
</script>

<ResizablePanel
	label="Explorer"
	width={220}
	minWidth="9rem"
	maxWidth={360}
	widthKey="tsumikit-demo-explorer"
	style="height: 16rem; border: 1px solid var(--border); border-radius: var(--r-md); overflow: hidden"
>
	{#snippet panel()}
		<Stack gap="0" style="padding: var(--sp-2)">
			{#each tree as file (file.path)}
				<NavItem
					icon={file.icon}
					label={file.path}
					iconSize={16}
					active={file.path === current}
					onclick={() => (current = file.path)}
				/>
			{/each}
		</Stack>
	{/snippet}
	<Stack gap="var(--sp-1)" style="padding: var(--sp-3); min-width: 0">
		<Text size="xs" tone="muted" mono truncate>{current}</Text>
		<Text mono size="sm" wrap="anywhere">export {'{'} default as Button {'}'} from './components/atoms/Button.svelte';</Text>
	</Stack>
</ResizablePanel>
