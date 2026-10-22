<script module>
	export const meta = {
		title: 'Appearance settings',
		caption: 'a settings row beside FontScalePicker and SoundSettings; auto offers a row that follows the system scheme; theme.label reads the store.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { FontScalePicker, SoundSettings, Text, ThemePicker, fontScale, theme } from '@dorsk/tsumikit';
</script>

<div class="row">
	<span class="copy">
		<Text weight="medium">Theme</Text>
		<Text size="sm" tone="muted">{theme.label} · {theme.option.mode}</Text>
	</span>
	<ThemePicker auto />
</div>
<div class="row">
	<span class="copy">
		<Text weight="medium">Text size</Text>
		<Text size="sm" tone="muted">{fontScale.levelId}</Text>
	</span>
	<FontScalePicker />
</div>
<div class="row">
	<span class="copy">
		<Text weight="medium">Sounds</Text>
		<Text size="sm" tone="muted">Clicks, toggles and toasts</Text>
	</span>
	<SoundSettings />
</div>

<style>
	.row {
		display: flex;
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
