<script module>
	export const meta = {
		title: 'States and relative precision',
		caption: 'null, undefined or unparseable input render an inert dash; precision shows two units, short drops "ago"; selectable adds mode switches to the popover; details={false} is a bare <time>.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Stack, Text, Timestamp } from '@dorsk/tsumikit';

	const now = Date.now();
	const cases = [
		{ note: 'null', value: null },
		{ note: 'not a date', value: 'next tuesday-ish' },
		{ note: 'epoch ms, 6 min ago', value: now - 6 * 60_000, mode: 'relative' },
		{ note: 'precision', value: now - 39 * 3_600_000, mode: 'relative', precision: true },
		{ note: 'short', value: now - 2 * 3_600_000, mode: 'relative', short: true },
		{ note: 'in the future', value: now + 3 * 86_400_000, mode: 'relative' },
		{ note: 'selectable', value: '2026-06-14T07:30:00Z', mode: 'relative', selectable: true },
		{ note: 'details off', value: '2026-06-14T07:30:00Z', details: false }
	] as const;
</script>

{#each cases as { note, ...props } (note)}
	<Stack gap="var(--sp-0-5)">
		<Text size="xs" tone="muted">{note}</Text>
		<Timestamp tone="default" {...props} />
	</Stack>
{/each}
