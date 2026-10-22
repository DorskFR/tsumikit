<script module>
	export const meta = {
		title: 'Edge paths',
		caption: 'Root, home and trailing slashes normalise; a relative path keeps no leading slash; a single huge segment still ellipsises; title overrides the tooltip.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Stack, Text, WorkingDir } from '@dorsk/tsumikit';

	const cases = [
		{ note: 'root', path: '/' },
		{ note: 'home', path: '~' },
		{ note: 'trailing slash', path: '/etc/nginx/' },
		{ note: 'relative', path: 'src/demo/molecules' },
		{ note: 'one long segment', path: '/data/2026-10-21T07-30-00Z-nightly-full-cluster-snapshot-eu-west-1' },
		{ note: 'title', path: '/mnt/nas/media', title: 'NAS media share (read-only)' }
	];
</script>

{#each cases as { note, ...props } (note)}
	<Stack gap="var(--sp-1)">
		<Text size="xs" tone="muted">{note}</Text>
		<WorkingDir {...props} />
	</Stack>
{/each}
