<script module>
	export const meta = {
		title: 'Tones, snippets and long values',
		caption: 'every tone on a value, a value that is a snippet, a long value that wraps and an empty rows array.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, KeyValue, Text, type KeyValueRow } from '@dorsk/tsumikit';

	const tones = ['neutral', 'ok', 'success', 'warn', 'danger', 'info', 'accent'] as const;
	const toned: KeyValueRow[] = tones.map((tone) => ({ label: tone, value: 'value', tone }));
</script>

{#snippet owner()}
	<Badge tone="ok" dot size="xs">online</Badge>
	<Text size="sm">Amara Okafor</Text>
{/snippet}

<KeyValue columns={2} rows={toned} />
<KeyValue
	rows={[
		{ label: 'Owner', value: owner },
		{ label: 'Image digest', value: 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', mono: true, hint: 'wraps rather than overflows' },
		{ label: 'Description', value: 'A long free-text value that keeps the label column fixed and wraps across as many lines as it needs on a phone.' }
	]}
/>
<KeyValue rows={[]} />
<Text size="xs" tone="muted">An empty rows array renders nothing.</Text>
