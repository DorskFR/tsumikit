<script module>
	export const meta = {
		title: 'Screen sans and mono',
		caption: 'Inter is bundled and first in --font-sans; counts (--font-numeric) and eyebrow labels (--font-label) follow it, so only real code is monospace.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Metric, Text } from '@dorsk/tsumikit';
</script>

<Text as="p" size="lg" measure>
	Inter 0O 1lI — a typeface drawn for screens: open digits, single-storey a, even spacing at 13 to 16px.
</Text>
<div class="row">
	<Metric label="Requests" value="12,480" />
	<Metric label="p95 latency" value="184 ms" />
	<Badge tone="ok">3 passing</Badge>
	<Text variant="eyebrow">Shortcut</Text>
	<Text variant="code">git rebase -i HEAD~3</Text>
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--sp-4);
	}
</style>
