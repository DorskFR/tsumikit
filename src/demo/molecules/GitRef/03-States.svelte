<script module>
	export const meta = {
		title: 'Collapse and overflow',
		caption: 'collapse="glyph" is icon-only everywhere, "never" always keeps text; maxWidth caps the branch chip, which ellipsises with the full name in the tooltip; with no parts nothing renders.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, GitRef, Text } from '@dorsk/tsumikit';

	const pr = { url: 'https://github.com/DorskFR/tsumikit/pull/88', number: 88, state: 'open' } as const;
	const long = 'feat/wave-1-new-components-with-a-really-long-descriptive-branch-name';
</script>

<Cluster gap="var(--sp-2)"><Text size="xs" tone="muted">glyph</Text><GitRef branch="fix/resizable-panel" {pr} diff={{ additions: 3, deletions: 1 }} collapse="glyph" /></Cluster>
<Cluster gap="var(--sp-2)"><Text size="xs" tone="muted">long branch, default 14rem cap</Text><GitRef branch={long} collapse="never" /></Cluster>
<Cluster gap="var(--sp-2)"><Text size="xs" tone="muted">maxWidth="8rem"</Text><GitRef branch={long} maxWidth="8rem" collapse="never" /></Cluster>
<Cluster gap="var(--sp-2)"><Text size="xs" tone="muted">huge and empty diffs</Text><GitRef diff={{ additions: 128_734, deletions: 96_120 }} /><GitRef diff={{ additions: 0, deletions: 0 }} /></Cluster>
<Cluster gap="var(--sp-2)"><Text size="xs" tone="muted">no parts</Text><GitRef /><Text size="xs" tone="faint">(nothing rendered)</Text></Cluster>
