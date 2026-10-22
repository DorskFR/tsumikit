<script module>
	export const meta = {
		title: 'Driving the store from code',
		caption: 'theme.all lists built-ins and registered themes; theme.set(id), theme.toggle() and theme.next read and write the same persisted preference.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Swatch, Text, theme } from '@dorsk/tsumikit';
</script>

<Cluster>
	<Button size="sm" onclick={() => theme.toggle()}>Toggle to {theme.next.label}</Button>
	<Button size="sm" variant="ghost" onclick={() => theme.set('dark')}>Reset to Dark</Button>
	<Text size="sm" tone="muted">{theme.all.length} themes registered</Text>
</Cluster>
<Cluster gap="var(--sp-1)">
	{#each theme.all as t (t.id)}
		<Swatch color={t.themeColor ?? 'var(--bg)'} label={t.label} interactive selected={theme.current === t.id} onclick={() => theme.set(t.id)} size="sm">{t.icon ?? theme.fallbackIcon}</Swatch>
	{/each}
</Cluster>
