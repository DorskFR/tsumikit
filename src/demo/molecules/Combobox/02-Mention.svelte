<script module>
	export const meta = {
		title: 'Mentions in a textarea',
		caption: 'anchor="caret" pins the listbox under the cursor; findTrigger detects the @ token and applyTrigger replaces it. Type @ to try.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { tick } from 'svelte';
	import { applyTrigger, Combobox, findTrigger, Text, Textarea } from '@dorsk/tsumikit';
	import { people, type Person } from '../../fixtures';

	let text = $state('Deploy is blocked, can @');
	let el = $state<HTMLTextAreaElement | null>(null);
	let trigger = $state<ReturnType<typeof findTrigger>>(null);
	let index = $state(0);
	const matches = $derived.by(() => {
		const t = trigger;
		return t ? people.filter((p) => p.handle.startsWith(t.query.toLowerCase())) : [];
	});

	function readCaret() {
		trigger = el ? findTrigger(el.value, el.selectionStart ?? el.value.length, '@') : null;
	}
	async function pick(p: Person) {
		if (!el || !trigger) return;
		const out = applyTrigger(el.value, el.selectionStart ?? el.value.length, trigger, `@${p.handle}`);
		text = out.text;
		trigger = null;
		await tick();
		el.setSelectionRange(out.caret, out.caret);
	}
</script>

<Combobox options={matches} open={trigger !== null} bind:index label="People" anchor="caret" getKey={(p) => p.handle} onselect={pick} onclose={() => (trigger = null)} style="max-width: 32rem">
	{#snippet option(p, { active })}
		<span style:font-weight={active ? 'var(--fw-semibold)' : 'inherit'}>@{p.handle}</span>
		<Text as="span" tone="muted" size="sm"> · {p.name}</Text>
	{/snippet}
	<Textarea
		rows={3}
		bind:value={text}
		bind:el
		aria-label="Message"
		oninput={readCaret}
		onclick={readCaret}
		onkeyup={(e) => {
			if (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End') readCaret();
		}}
	/>
</Combobox>
