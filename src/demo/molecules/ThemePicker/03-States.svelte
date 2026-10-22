<script module>
	export const meta = {
		title: 'Header toolbar, auto labels, disabled, store access',
		caption: 'the picker in a Toolbar next to FontScalePicker; autoLabel/lightLabel/darkLabel rename the groups; theme.set and theme.toggle drive it from code.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, FontScalePicker, Heading, Text, THEMES, ThemePicker, Toolbar, theme } from '@dorsk/tsumikit';
</script>

<Toolbar label="Site header" density="compact">
	<Heading level={2} size="sm">Fleet console</Heading>
	<span class="spacer"></span>
	<FontScalePicker box="sm" />
	<ThemePicker box="sm" auto autoLabel="System" autoHelp="Match the OS appearance" lightLabel="Day" darkLabel="Night" />
</Toolbar>
<Cluster align="center">
	<ThemePicker disabled />
	<Text size="sm" tone="muted">disabled</Text>
	<Button size="sm" onclick={() => theme.toggle()}>theme.toggle() → {theme.next.label}</Button>
	{#each THEMES.slice(0, 3) as t (t.id)}
		<Button size="sm" variant={theme.current === t.id ? 'primary' : 'default'} onclick={() => theme.set(t.id)}>{t.label}</Button>
	{/each}
</Cluster>

<style>
	.spacer {
		flex: 1;
	}
</style>
