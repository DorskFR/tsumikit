<script module>
	export const meta = {
		title: 'Sizing, icon and copy',
		caption: 'full renders the whole path at content width; shrink sizes to the path while it fits; minLeaf sets the leaf floor; mono={false} uses the body font; icon swaps the glyph; copy makes it a button that copies the full path.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Text, WorkingDir, toasts } from '@dorsk/tsumikit';

	const path = '/home/amara/Documents/tsumikit/src/lib/components';
</script>

<Text size="xs" tone="muted">default: fills the row, abbreviates to fit</Text>
<WorkingDir {path} />
<Text size="xs" tone="muted">full · shrink</Text>
<WorkingDir {path} full />
<WorkingDir path="~/projects/cctui" shrink />
<Text size="xs" tone="muted">in a 12rem slot: minLeaf 18 (default) vs 4</Text>
<div class="slot"><WorkingDir path="/var/log/an-unusually-verbose-service-name" /></div>
<div class="slot"><WorkingDir path="/var/log/an-unusually-verbose-service-name" minLeaf={4} /></div>
<Text size="xs" tone="muted">mono off with a music icon · copy with an archive icon</Text>
<WorkingDir path="~/Music/Kaleido/Neon Rain" mono={false} icon="music" shrink />
<WorkingDir path="/srv/backups/postgres-primary/2026-10-21" icon="archive" shrink copy oncopy={(ok) => toasts.show(ok ? 'Path copied' : 'Copy failed')} />

<style>
	.slot {
		width: 12rem;
		max-width: 100%;
	}
</style>
