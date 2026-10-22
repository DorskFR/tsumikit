<script module>
	export const meta = {
		title: 'Toolbar and code',
		caption: 'control height-matches a Toolbar next to ThemePicker; theme.setLook(id) drives it from code and onchange reports the pick.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, LOOKS, LookPicker, Text, ThemePicker, Toolbar, theme } from '@dorsk/tsumikit';

	let picked = $state('');
</script>

<Toolbar label="Site header" density="compact">
	<LookPicker control size="sm" onchange={(l) => (picked = l)} />
	<ThemePicker box="sm" auto />
</Toolbar>
<Cluster align="center">
	{#each LOOKS as l (l.id)}
		<Button size="sm" variant={theme.look === l.id ? 'primary' : 'default'} onclick={() => theme.setLook(l.id)}>
			{l.label}
		</Button>
	{/each}
	<Text size="sm" tone="muted">{picked ? `onchange → ${picked}` : 'pick a look'}</Text>
</Cluster>
