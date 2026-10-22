<script module>
	export const meta = {
		title: 'Settings page outline',
		caption: 'level follows the document outline (1 → 2 → 3) while size keeps the page title modest; tone="muted" for a group kicker.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Card, Divider, Heading, Stack, Switch, Text } from '@dorsk/tsumikit';

	let digest = $state(true);
	let mentions = $state(true);
</script>

<Stack gap="var(--sp-4)" style="max-width: 32rem">
	<Heading level={1} size="xl">Notifications</Heading>
	<Card>
		<Stack gap="var(--sp-3)">
			<Heading level={2} size="sm" uppercase tone="muted">Email</Heading>
			<Stack gap="var(--sp-2)">
				<Heading level={3} size="md">Daily digest</Heading>
				<Text tone="muted" size="sm">One summary at 08:00 in your timezone.</Text>
				<Switch bind:checked={digest} label="Send the daily digest" labelVisible />
			</Stack>
			<Divider />
			<Stack gap="var(--sp-2)">
				<Heading level={3} size="md">Mentions</Heading>
				<Text tone="muted" size="sm">Only when someone writes your handle.</Text>
				<Switch bind:checked={mentions} label="Email me on mentions" labelVisible />
			</Stack>
		</Stack>
	</Card>
</Stack>
