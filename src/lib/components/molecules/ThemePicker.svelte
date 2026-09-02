<script lang="ts">
	// Theme switcher: a compact icon-button hosting a native <select> over the
	// full theme registry (built-ins + theme.register()), wired to the global
	// theme store. The native control gives correct mobile/keyboard behaviour and
	// outside-click handling for free. The button glyph reflects the active theme.
	import SelectButton from '$lib/components/molecules/SelectButton.svelte';
	import { type ThemeDef, theme } from '$lib/stores/theme.svelte';

	let { class: klass = '' }: { class?: string } = $props();

	const toOption = (t: ThemeDef) => ({
		value: t.id,
		label: `${t.icon ?? theme.fallbackIcon}  ${t.label}`
	});
	const groups = $derived([
		{ label: '— light', options: theme.all.filter((t) => t.mode === 'light').map(toOption) },
		{ label: '— dark', options: theme.all.filter((t) => t.mode === 'dark').map(toOption) }
	]);
</script>

<SelectButton
	data-tsu="ThemePicker"
	class={klass}
	glyph={theme.icon}
	label="Theme"
	title={`Theme: ${theme.label}`}
	value={theme.current}
	{groups}
	onchange={(v) => theme.set(v)}
/>
