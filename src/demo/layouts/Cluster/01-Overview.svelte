<script module>
	export const meta = {
		title: 'Pull request header',
		caption: 'One Cluster per row: metadata wraps on a phone, actions sit at justify="flex-end".',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Avatar, Badge, Button, Cluster, Heading, Text } from '@dorsk/tsumikit';
	import { people } from '../../fixtures';
</script>

<Heading level={3} size="md">Stream cache warm-up through the edge workers</Heading>
<Cluster>
	<Badge tone="ok" dot>Open</Badge>
	<Avatar name={people[0].name} hue={people[0].hue} size="xs" />
	<Text size="sm" tone="muted">{people[0].handle} wants to merge 4 commits into</Text>
	<Badge mono size="xs">main</Badge>
	<Badge tone="info" size="xs">perf</Badge>
	<Badge tone="warn" size="xs">needs review</Badge>
</Cluster>
<Cluster justify="flex-end">
	<Button variant="ghost">Close</Button>
	<Button>Request changes</Button>
	<Button variant="primary">Approve</Button>
</Cluster>
