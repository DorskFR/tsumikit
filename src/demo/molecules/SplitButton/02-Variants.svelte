<script module>
	export const meta = {
		title: 'Variants, sizes and caret width',
		caption: 'variant default/primary/danger; size sm/md/lg; caret="half" narrows the secondary segment.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, SplitButton, toasts, type MenuItem } from '@dorsk/tsumikit';

	const formats: MenuItem[] = [
		{ label: 'CSV', icon: 'file-text', onselect: () => toasts.show('Exporting CSV') },
		{ label: 'JSON', icon: 'file', onselect: () => toasts.show('Exporting JSON') },
		{ label: 'PDF report', icon: 'download', onselect: () => toasts.show('Exporting PDF') }
	];
</script>

<Cluster align="center">
	<SplitButton label="Export formats" items={formats} onclick={() => toasts.show('Exported CSV')}>Export</SplitButton>
	<SplitButton variant="primary" label="Export formats" items={formats} onclick={() => toasts.ok('Exported')}>Export</SplitButton>
	<SplitButton variant="danger" label="Delete options" items={formats} onclick={() => toasts.error('Deleted')}>Delete</SplitButton>
</Cluster>
<Cluster align="center">
	{#each ['sm', 'md', 'lg'] as const as size (size)}
		<SplitButton variant="primary" {size} label="Export formats" items={formats} onclick={() => toasts.ok('Exported')}>
			Export
		</SplitButton>
	{/each}
</Cluster>
<Cluster align="center">
	<SplitButton caret="half" label="Export formats" items={formats} onclick={() => toasts.show('Exported')}>Half caret</SplitButton>
	<SplitButton variant="primary" caret="half" label="Export formats" items={formats} onclick={() => toasts.ok('Exported')}>
		Half caret
	</SplitButton>
	<SplitButton variant="primary" caret="half" size="lg" label="Export formats" items={formats} onclick={() => toasts.ok('Exported')}>
		Large
	</SplitButton>
</Cluster>
