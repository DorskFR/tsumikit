<script module>
	export const meta = {
		title: 'File manager actions',
		caption: 'Drag the preview edge: under collapseBelow="34rem" New folder and every icon action hide and the … Menu offers them as items.',
		layout: 'stack',
		resizable: true
	};
</script>

<script lang="ts">
	import { Button, Divider, IconButton, SegmentedControl, Toolbar, toasts, type MenuItem } from '@dorsk/tsumikit';

	let view = $state('list');
	const act = (label: string) => () => toasts.show(`${label}: 3 files`);
	const items: MenuItem[] = [
		{ label: 'New folder', icon: 'folder', onselect: act('New folder') },
		{ label: 'Download', icon: 'download', onselect: act('Download') },
		{ label: 'Share', icon: 'share', onselect: act('Share') },
		{ label: 'Rename', icon: 'edit', onselect: act('Rename') },
		{ label: 'Delete', icon: 'trash', danger: true, onselect: act('Delete') }
	];
</script>

<Toolbar label="Files" collapseBelow="34rem" {items}>
	<Button variant="primary" onclick={act('Upload')}>Upload</Button>
	<Button onclick={act('New folder')} data-overflow>New folder</Button>
	<Divider orientation="vertical" decorative data-overflow />
	<IconButton icon="download" label="Download" data-overflow onclick={act('Download')} />
	<IconButton icon="share" label="Share" data-overflow onclick={act('Share')} />
	<IconButton icon="edit" label="Rename" data-overflow onclick={act('Rename')} />
	<IconButton icon="trash" label="Delete" variant="danger" data-overflow onclick={act('Delete')} />
	<span style="margin-inline-start: auto">
		<SegmentedControl
			variant="icon"
			label="View"
			bind:value={view}
			options={[
				{ value: 'list', label: 'List', icon: 'list' },
				{ value: 'grid', label: 'Grid', icon: 'grid' }
			]}
		/>
	</span>
</Toolbar>
