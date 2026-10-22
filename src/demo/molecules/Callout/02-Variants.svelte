<script module>
	export const meta = {
		title: 'Tones',
		caption: 'tone neutral/info/ok/warn/danger/accent picks the tint and the default glyph; icon overrides it.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Callout } from '@dorsk/tsumikit';
</script>

<Callout tone="neutral" title="Scheduled maintenance">The EU region is read-only on Sunday from 02:00 to 03:00 UTC.</Callout>
<Callout tone="info">Auto-search runs in the background and links matches as it goes.</Callout>
<Callout tone="ok" title="Backup verified">Last night's snapshot restored cleanly in the staging cluster.</Callout>
<Callout tone="warn" title="Quota at 87%">Uploads pause when the workspace reaches its storage limit.</Callout>
<Callout tone="danger" title="Payment failed">The card ending 4242 was declined. Update it to keep the plan active.</Callout>
<Callout tone="accent" icon="star" title="New: shared filters">Save a filter once and reuse it across every dashboard.</Callout>
