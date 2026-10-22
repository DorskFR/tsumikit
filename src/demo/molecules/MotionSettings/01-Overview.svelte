<script module>
	export const meta = {
		title: 'Settings toolbar',
		caption: 'size="sm" beside the other preference controls; choices persist and apply page-wide.',
	};
</script>

<script lang="ts">
	import { FontScalePicker, MotionSettings, SoundSettings, Text, ThemePicker, Toolbar } from '@dorsk/tsumikit';
</script>

<Toolbar label="Preferences" density="compact">
	<Text size="sm" tone="muted">Preferences</Text>
	<MotionSettings size="sm" />
	<SoundSettings size="sm" />
	<FontScalePicker box="sm" />
	<ThemePicker box="sm" />
</Toolbar>
