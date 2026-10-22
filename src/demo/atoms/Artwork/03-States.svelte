<script module>
	export const meta = {
		title: 'Broken source, status overlay and fluid width',
		caption: 'a failing src swaps to the fallback and fires onerror; the status snippet pins a Dot or Badge bottom-right; omit size to fill the column.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Artwork, Badge, Cluster, Dot, Text } from '@dorsk/tsumikit';

	let failed = $state(false);
</script>

<Cluster align="flex-end">
	<Artwork src="https://example.invalid/missing.jpg" alt="Broken source" size="6rem" onerror={() => (failed = true)}>
		{#snippet status()}<Dot status="dead" ring />{/snippet}
	</Artwork>
	<Artwork alt="Live stream" size="6rem">
		{#snippet status()}<Dot status="active" glow ring />{/snippet}
	</Artwork>
	<Artwork alt="Episode 12" aspect="16/9" size="10rem">
		{#snippet status()}<Badge size="xs" tone="danger" border={false} uppercase>live</Badge>{/snippet}
	</Artwork>
	<Artwork alt="Kusaritoi Radio late night sessions volume three" size="6rem" />
</Cluster>
<Text size="xs" tone="muted">{failed ? 'Image failed to load, showing the fallback.' : 'Waiting for the broken image to fail…'}</Text>
<div style="max-width: 20rem">
	<Artwork alt="Fluid width" aspect="16/9" />
</div>
