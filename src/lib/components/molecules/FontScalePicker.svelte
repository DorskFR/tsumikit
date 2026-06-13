<script lang="ts">
	// UI text-size switcher. Same compact native-select-over-button pattern as
	// ThemePicker, wired to the font-scale store. Drives --fs-scale (text only) —
	// chrome dimensions stay fixed. Glyph is the conventional "A".
	import SelectButton from '$lib/components/molecules/SelectButton.svelte';
	import { fontScale, SCALE_LEVELS } from '$lib/stores/fontscale.svelte';

	let { class: klass = '' }: { class?: string } = $props();

	const options = SCALE_LEVELS.map((l) => ({ value: l.id, label: l.label }));
</script>

<SelectButton
	class={klass}
	glyph="A"
	label="Text size"
	title="Text size"
	value={fontScale.levelId}
	{options}
	onchange={(v) => fontScale.set(v)}
/>
