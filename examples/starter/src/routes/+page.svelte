<script lang="ts">
	import { Button, Heading, Link, Stack, Text } from '@dorsk/tsumikit';
</script>

<svelte:head>
	<title>Starter</title>
</svelte:head>

<Stack gap="var(--sp-4)">
	<Heading level={2} size="lg">A small app on tsumikit</Heading>
	<Text tone="muted" measure>
		A shell, a theme, a list with filters in the URL, undo instead of confirm, and errors that
		say what to do next. Copy it, rename it, delete what you do not need.
	</Text>
	<div>
		<Button variant="primary" href="/items">Open the list</Button>
	</div>
	<Text variant="caption" tone="faint">
		Try a missing page too: <Link href="/nowhere" rel="external">/nowhere</Link>
	</Text>
</Stack>
