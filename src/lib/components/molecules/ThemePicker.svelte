<script lang="ts">
	// Theme switcher: a compact icon-button hosting a native <select> over the
	// full theme registry, wired to the global theme store. The native control
	// gives correct mobile/keyboard behaviour and outside-click handling for free.
	// The button glyph reflects the active theme's icon.
	import SelectButton from '$lib/components/molecules/SelectButton.svelte';
	import { theme, THEMES } from '$lib/stores/theme.svelte';

	let { class: klass = '' }: { class?: string } = $props();

	const options = THEMES.map((t) => ({ value: t.id, label: `${t.icon}  ${t.label}` }));
</script>

<SelectButton
	class={klass}
	glyph={theme.icon}
	label="Theme"
	title={`Theme: ${theme.label}`}
	value={theme.current}
	{options}
	onchange={(v) => theme.set(v as (typeof THEMES)[number]['id'])}
/>
