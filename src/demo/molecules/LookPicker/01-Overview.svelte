<script module>
	export const meta = {
		title: 'Appearance settings',
		caption: 'the look row beside the theme row; theme.look reads the store, which persists it with the theme and paints data-look on <html>.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { LOOKS, LookPicker, Text, ThemePicker, theme } from '@dorsk/tsumikit';

	const status = $derived(LOOKS.find((l) => l.id === theme.look)?.status ?? 'stable');
</script>

<div class="row">
	<span class="copy">
		<Text weight="medium">Look</Text>
		<Text size="sm" tone="muted">{theme.look} · {status}</Text>
	</span>
	<LookPicker size="sm" />
</div>
<div class="row">
	<span class="copy">
		<Text weight="medium">Theme</Text>
		<Text size="sm" tone="muted">{theme.label} · {theme.option.mode}</Text>
	</span>
	<ThemePicker auto />
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-3);
		padding: var(--sp-2) 0;
		border-bottom: 1px solid var(--border);
	}
	.row:last-child {
		border-bottom: 0;
	}
	.copy {
		display: grid;
		min-width: 0;
	}
</style>
