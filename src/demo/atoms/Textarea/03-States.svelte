<script module>
	export const meta = {
		title: 'States',
		caption: 'disabled, readonly, invalid via Field error, and long content capped by maxHeight so it scrolls instead of growing.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Field, Textarea } from '@dorsk/tsumikit';

	const log = Array.from({ length: 40 }, (_, i) => `${String(i + 1).padStart(2, '0')}  worker-02  GET /api/jobs/${1200 + i} 200 ${12 + i}ms`).join('\n');
</script>

<Cluster align="flex-start">
	<Textarea disabled rows={2} value="Archived incidents cannot be edited." aria-label="Disabled" />
	<Textarea readonly rows={2} value="Generated on 2026-10-21 by the release bot." aria-label="Readonly" />
</Cluster>
<div style="max-width: 28rem">
	<Field label="Incident summary" error="Summaries need at least 20 characters.">
	<Textarea rows={2} value="Disk full." />
</Field>
</div>
<Textarea mono block autoresize maxHeight="8rem" value={log} aria-label="Request log" />
