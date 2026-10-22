<script module>
	export const meta = {
		title: 'Settings toolbar',
		caption: 'size="sm" beside the theme and text-size pickers; the switch state and volume persist.',
	};
</script>

<script lang="ts">
	import { FontScalePicker, SoundSettings, Text, ThemePicker, Toolbar } from '@dorsk/tsumikit';
</script>

<Toolbar label="Preferences" density="compact">
	<Text size="sm" tone="muted">Preferences</Text>
	<SoundSettings size="sm" />
	<FontScalePicker box="sm" />
	<ThemePicker box="sm" />
</Toolbar>
