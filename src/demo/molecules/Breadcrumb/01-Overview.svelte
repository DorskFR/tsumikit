<script module>
	export const meta = {
		title: 'File manager location',
		caption: 'items with href for every ancestor; the last item is the current page and renders as text.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Breadcrumb, Heading, Text } from '@dorsk/tsumikit';

	const path = ['Projects', 'tsumikit', 'src', 'lib', 'components', 'molecules'];
	const items = [...path.map((label) => ({ label, href: '#breadcrumb' })), { label: 'Breadcrumb.svelte' }];
</script>

<Breadcrumb {items} />
<Heading level={3} size="md">Breadcrumb.svelte</Heading>
<Text size="sm" tone="muted">162 lines · modified 2 hours ago</Text>
