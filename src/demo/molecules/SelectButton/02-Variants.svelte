<script module>
	export const meta = {
		title: 'Boxes, groups and rows',
		caption: 'box xs, sm, md, lg share the square scale; groups renders native optgroup sections; variant="row" with label beside the glyph for an overflow menu, block fills the width.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, SelectButton } from '@dorsk/tsumikit';

	let theme = $state('cyberia');
	const themes = [
		{ label: 'Light', options: [{ value: 'paper', label: 'Paper' }, { value: 'sand', label: 'Sand' }] },
		{ label: 'Dark', options: [{ value: 'cyberia', label: 'Cyberia' }, { value: 'graphite', label: 'Graphite' }] }
	];
	const locales = [
		{ value: 'en', label: 'English' },
		{ value: 'fr', label: 'Français' },
		{ value: 'ja', label: '日本語' }
	];
	let locale = $state('en');
</script>

<Cluster align="center">
	{#each ['xs', 'sm', 'md', 'lg'] as const as box (box)}
		<SelectButton {box} glyph="A" label="Text size ({box})" value={locale} options={locales} onchange={(v) => (locale = v)} />
	{/each}
	<SelectButton icon="palette" label="Theme" value={theme} groups={themes} active onchange={(v) => (theme = v)} />
</Cluster>
<div class="menu">
	<SelectButton variant="row" block icon="palette" label="Theme" value={theme} groups={themes} onchange={(v) => (theme = v)} />
	<SelectButton variant="row" block glyph="🌐" label="Language" value={locale} options={locales} onchange={(v) => (locale = v)} />
</div>

<style>
	.menu {
		display: grid;
		gap: var(--sp-1);
		max-width: 16rem;
	}
</style>
