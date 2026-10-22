<script module>
	export const meta = {
		title: 'Icons beside text',
		caption: 'no size, so each glyph tracks the text it sits in; tone colours it; label exposes a standalone icon to assistive tech.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Card, Cluster, Icon, Stack, Text } from '@dorsk/tsumikit';
	import { files } from '../../fixtures';

	const ICON = { 'image/png': 'image', 'application/pdf': 'file', 'text/markdown': 'markdown', 'text/csv': 'list', 'video/mp4': 'video' } as const;
	const kb = (n: number) => `${(n / 1024).toFixed(n > 1_000_000 ? 0 : 1)} KB`;
</script>

<Card maxWidth="26rem">
	<Stack gap="var(--sp-2)">
		<Cluster gap="var(--sp-2)">
			<Icon name="folder" tone="accent" />
			<Text weight="medium">Attachments</Text>
			<Text size="sm" tone="muted">{files.length} files</Text>
		</Cluster>
		{#each files as f (f.name)}
			<Cluster gap="var(--sp-2)" justify="space-between">
				<Cluster gap="var(--sp-2)">
					<Icon name={ICON[f.type as keyof typeof ICON] ?? 'file'} />
					<Text size="sm" truncate>{f.name}</Text>
				</Cluster>
				<Text size="xs" tone="muted" numeric>{kb(f.size)}</Text>
			</Cluster>
		{/each}
		<Cluster gap="var(--sp-2)">
			<Icon name="warning" tone="warn" label="Warning" />
			<Text size="sm" tone="muted">Files over 25 MB are shared as links.</Text>
		</Cluster>
	</Stack>
</Card>
