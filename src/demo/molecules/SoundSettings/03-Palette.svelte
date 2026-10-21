<script module>
	export const meta = {
		title: 'Palette',
		caption: 'sound.play(name) for every SoundName; silent until sounds are on.',
		layout: 'stack',
	};
</script>

<script lang="ts">
	import { Button, Cluster, SoundSettings, Text, sound, type SoundName } from '@dorsk/tsumikit';

	const palette: { name: SoundName; hint: string }[] = [
		{ name: 'click', hint: 'buttons, selections' },
		{ name: 'toggle-on', hint: 'switch on' },
		{ name: 'toggle-off', hint: 'switch off' },
		{ name: 'open', hint: 'modal, menu, drawer' },
		{ name: 'close', hint: 'dismiss' },
		{ name: 'success', hint: 'ok toast, copied' },
		{ name: 'error', hint: 'error toast' },
		{ name: 'tick', hint: 'slider step' },
	];
</script>

<Cluster align="center">
	<SoundSettings size="sm" />
	<Text size="sm" tone="muted">
		{sound.muted === 'off'
			? 'Turn sounds on to audition the palette.'
			: sound.muted === 'reduced-motion'
				? 'Reduced motion: only success and error play.'
				: `Volume ${Math.round(sound.volume * 100)}%`}
	</Text>
</Cluster>
<Cluster>
	{#each palette as { name, hint } (name)}
		<Button sound={false} title={hint} onclick={() => sound.play(name)}>{name}</Button>
	{/each}
</Cluster>
