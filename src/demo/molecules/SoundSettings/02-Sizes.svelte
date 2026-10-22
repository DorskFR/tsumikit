<script module>
	export const meta = {
		title: 'Sizes',
		caption: 'size="sm" and "md" set the trigger box and the panel density; variant and tone pass to the trigger.',
	};
</script>

<script lang="ts">
	import { SoundSettings } from '@dorsk/tsumikit';
</script>

<SoundSettings size="sm" />
<SoundSettings size="md" />
<SoundSettings size="md" variant="primary" label="Audio" />
