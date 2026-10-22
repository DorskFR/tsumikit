<script module>
	export const meta = {
		title: 'Sizes and handles',
		caption: 'size="sm" | "md"; handle="row" drags from anywhere (touch long-presses 250 ms); arrows={false} and numbered toggle the chrome; as="ul" for unordered sets.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { SortableList, Text } from '@dorsk/tsumikit';
	import { tracks } from '../../fixtures';

	let small = $state(tracks.slice(0, 4));
	let byRow = $state(tracks.slice(0, 4));
	const reorder = (list: typeof tracks, keys: string[]) => keys.map((k) => list.find((t) => String(t.id) === k)!);
</script>

<div>
	<Text size="xs" tone="muted">size="sm", numbered</Text>
	<SortableList items={small} key={(t) => String(t.id)} name={(t) => t.title} label="Up next (small)" size="sm" numbered onreorder={(keys) => (small = reorder(small, keys))}>
		{#snippet row(t)}<Text size="sm" truncate>{t.title}</Text>{/snippet}
	</SortableList>
</div>
<div>
	<Text size="xs" tone="muted">handle="row", arrows off, as="ul"</Text>
	<SortableList items={byRow} key={(t) => String(t.id)} name={(t) => t.title} label="Up next (row handle)" handle="row" arrows={false} as="ul" onreorder={(keys) => (byRow = reorder(byRow, keys))}>
		{#snippet row(t)}
			<Text truncate grow>{t.title}</Text>
			<Text size="xs" tone="muted" nowrap>{t.artist}</Text>
		{/snippet}
	</SortableList>
</div>
