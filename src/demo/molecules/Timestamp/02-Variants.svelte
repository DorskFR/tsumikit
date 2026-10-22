<script module>
	export const meta = {
		title: 'Modes',
		caption: 'mode picks the inline text; date, time and datetime follow the viewer zone unless utc is set; iso is always UTC; mono, size and tone match surrounding copy.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Stack, Text, Timestamp } from '@dorsk/tsumikit';

	const at = '2026-06-14T07:30:00Z';
	const modes = ['datetime', 'date', 'time', 'iso', 'short-iso', 'relative'] as const;
</script>

{#each modes as mode (mode)}
	<Stack gap="var(--sp-0-5)">
		<Text size="xs" tone="muted">{mode}</Text>
		<Timestamp value={at} {mode} tone="default" />
	</Stack>
{/each}
<Stack gap="var(--sp-0-5)">
	<Text size="xs" tone="muted">date, utc</Text>
	<Timestamp value="2026-06-14T00:00:00Z" mode="date" utc tone="default" />
</Stack>
<Stack gap="var(--sp-0-5)">
	<Text size="xs" tone="muted">mono, size lg, tone accent</Text>
	<Timestamp value={at} mono size="lg" tone="accent" />
</Stack>
<Stack gap="var(--sp-0-5)">
	<Text size="xs" tone="muted">tone inherit inside copy</Text>
	<Text size="sm">Invoice issued <Timestamp value={at} mode="date" tone="inherit" />.</Text>
</Stack>
