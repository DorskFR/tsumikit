<script module>
	export const meta = {
		title: 'Modes',
		caption: 'mode="end" | "middle" | "start" | "path" against a max character budget; path abbreviates ancestors first and keepFirst protects leading segments; ellipsis swaps the marker.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Stack, Text, Truncate } from '@dorsk/tsumikit';

	const cases = [
		{ note: 'end, max 20', text: 'a-very-long-resource-identifier-that-keeps-going', max: 20 },
		{ note: 'middle, max 16', text: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', max: 16, mode: 'middle', mono: true },
		{ note: 'start, max 22', text: '/srv/app/var/logs/2026/06/14/request-trace.log', max: 22, mode: 'start', mono: true },
		{ note: 'path, max 24', text: '/home/amara/Documents/tsumikit/src/lib/truncate.ts', max: 24, mode: 'path', mono: true },
		{ note: 'path, keepFirst 1', text: '~/Documents/tsumikit/src/lib/truncate.ts', max: 24, mode: 'path', keepFirst: 1, mono: true },
		{ note: 'path, separator "."', text: 'com.example.billing.invoices.export.CsvWriter', max: 24, mode: 'path', separator: '.', mono: true },
		{ note: 'ellipsis "..."', text: 'Quarterly payout for the contractors', max: 18, ellipsis: '...' }
	] as const;
</script>

{#each cases as { note, ...props } (note)}
	<Stack gap="var(--sp-0-5)">
		<Text size="xs" tone="muted">{note}</Text>
		<Text size="sm"><Truncate {...props} /></Text>
	</Stack>
{/each}
