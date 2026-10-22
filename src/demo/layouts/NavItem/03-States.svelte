<script module>
	export const meta = {
		title: 'Long labels and large counts',
		caption: 'Labels truncate with the full text in title; badge accepts text as well as numbers; 0 and empty strings render no badge.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { NavItem, Stack } from '@dorsk/tsumikit';
</script>

<Stack gap="var(--sp-0-5)" style="max-width: 14rem">
	<NavItem icon="folder" label="Quarterly planning and roadmap reviews 2026" badge={128} />
	<NavItem icon="git-branch" label="feature/stream-cache-warmup-edge-workers" badge="new" badgeTone="info" active />
	<NavItem icon="warning" label="Failed jobs" badge="99+" badgeTone="danger" />
	<NavItem icon="check-circle" label="Resolved" badge={0} />
	<NavItem icon="users" label="Team" badge="" />
</Stack>
