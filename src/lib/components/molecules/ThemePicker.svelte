<script lang="ts">
	// Theme switcher: a compact icon-button hosting a native <select> over the
	// full theme registry, wired to the global theme store. The native control
	// gives correct mobile/keyboard behaviour and outside-click handling for free.
	// The button glyph reflects the active theme's icon.
	import SelectButton from '$lib/components/molecules/SelectButton.svelte';
	import { theme, THEMES } from '$lib/stores/theme.svelte';

	let { class: klass = '' }: { class?: string } = $props();

	// Split the registry into light/dark sections (TSU-1) so the long list is
	// scannable. `<optgroup>` keeps native popup/keyboard behaviour for free.
	const toOption = (t: (typeof THEMES)[number]) => ({
		value: t.id,
		label: `${t.icon}  ${t.label}`
	});
	const groups = [
		{ label: '— light', options: THEMES.filter((t) => t.mode === 'light').map(toOption) },
		{ label: '— dark', options: THEMES.filter((t) => t.mode === 'dark').map(toOption) }
	];
</script>

<SelectButton
	class={klass}
	glyph={theme.icon}
	label="Theme"
	title={`Theme: ${theme.label}`}
	value={theme.current}
	{groups}
	onchange={(v) => theme.set(v as (typeof THEMES)[number]['id'])}
/>
