<script module>
	export const meta = {
		title: 'Micro-interactions',
		caption: 'data-fx-focus on any ancestor: "bloom" (default) halos the focused control, "label" floats a Field label inside md text fields, "none" keeps the plain ring.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Field, Input, Select, Stack, Text, Textarea } from '@dorsk/tsumikit';

	const variants = ['bloom', 'label', 'none'] as const;
	const plans = ['Free', 'Pro', 'Team'].map((p) => ({ value: p, label: p }));
	let names = $state<Record<string, string>>({ bloom: '', label: 'Ada Lovelace', none: '' });
</script>

{#each variants as v (v)}
	<div data-fx-focus={v}>
		<Stack gap="var(--sp-2)">
			<Text size="sm" tone="muted" mono>data-fx-focus="{v}"</Text>
			<Field label="Full name"><Input bind:value={names[v]} autocomplete="off" /></Field>
			<Field label="Email" error={v === 'none' ? undefined : 'Enter a valid address'}><Input type="email" placeholder="you@example.com" /></Field>
			<Field label="Notes"><Textarea rows={2} /></Field>
			<Field label="Plan"><Select options={plans} /></Field>
		</Stack>
	</div>
{/each}
