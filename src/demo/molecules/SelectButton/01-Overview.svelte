<script module>
	export const meta = {
		title: 'Editor toolbar pickers',
		caption: 'glyph or icon, options, value and onchange; active tints the box when the current value is not the default.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { IconButton, SelectButton, Text } from '@dorsk/tsumikit';

	let size = $state('md');
	let wrap = $state('soft');
	const sizes = [
		{ value: 'sm', label: 'Small text' },
		{ value: 'md', label: 'Medium text' },
		{ value: 'lg', label: 'Large text' }
	];
	const wraps = [
		{ value: 'off', label: 'No wrap' },
		{ value: 'soft', label: 'Soft wrap' },
		{ value: 'word', label: 'Wrap at words' }
	];
</script>

<div class="toolbar">
	<IconButton icon="save" label="Save" />
	<IconButton icon="retry" label="Reformat" />
	<SelectButton glyph="A" label="Text size" value={size} options={sizes} active={size !== 'md'} onchange={(v) => (size = v)} />
	<SelectButton icon="text-cursor" label="Line wrapping" value={wrap} options={wraps} active={wrap !== 'off'} onchange={(v) => (wrap = v)} />
	<Text size="xs" tone="muted">{sizes.find((s) => s.value === size)?.label} · {wraps.find((w) => w.value === wrap)?.label}</Text>
</div>

<style>
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--sp-1);
	}
</style>
