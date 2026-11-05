<script module>
	export const meta = {
		title: 'Pages as links',
		caption: 'href={(page) => string} renders every page and the prev/next controls as real links with aria-current="page"; urlState keeps the ?page= param, so the page survives a reload and middle-click opens it in a new tab.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Pagination, Text, urlState } from '@dorsk/tsumikit';
	import { AUDIT } from './data';

	const limit = 8;
	const page = urlState('page', {
		default: 1,
		parse: (raw) => Number.parseInt(raw, 10) || 1,
		serialize: String
	});
	const rows = $derived(AUDIT.slice((page.value - 1) * limit, page.value * limit));
</script>

<Text size="sm" tone="muted">{rows.map((r) => r.actor).join(', ')}</Text>
<Cluster justify="flex-end">
	<Pagination bind:page={page.value} pageCount={Math.ceil(AUDIT.length / limit)} href={(p) => page.href(p)} size="sm" />
</Cluster>
