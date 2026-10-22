<script module>
	export const meta = {
		title: 'Long titles',
		caption: 'truncate clips in a narrow column, wrap="balance" evens a wrapped title, measure caps the width, leading="tight" closes up multi-line headings.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Heading, Stack } from '@dorsk/tsumikit';

	const title = 'Postmortem: cache-01 eviction storm during the eu-west-1 failover rehearsal';
</script>

<Stack gap="var(--sp-3)" style="max-width: 24rem">
	<Heading level={3} truncate>{title}</Heading>
	<Heading level={3} wrap="balance">{title}</Heading>
	<Heading level={3} leading="tight" measure="18ch">{title}</Heading>
	<Heading level={3} size="sm" wrap="anywhere">release/2026.10.21-hotfix-postgres-primary-connection-pool-exhaustion</Heading>
</Stack>
