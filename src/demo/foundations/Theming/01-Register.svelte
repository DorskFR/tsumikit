<script module>
	export const meta = {
		title: 'Register a custom theme',
		caption: 'theme.register({ id, label, mode, icon, themeColor }) adds it to every picker; the colours live in your own :global([data-theme=id]) rule.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Text, theme } from '@dorsk/tsumikit';

	theme.register({ id: 'demo-plum', label: 'Demo Plum', icon: '✺', themeColor: '#1c1224', mode: 'dark' });
	const active = $derived(theme.current === 'demo-plum');
</script>

<Text size="sm" tone="muted">Current theme: <Text weight="semibold" tone="accent">{theme.label}</Text></Text>
<Cluster>
	<Button variant="primary" onclick={() => theme.set('demo-plum')} disabled={active}>Try Demo Plum</Button>
	<Button variant="ghost" onclick={() => theme.set('dark')} disabled={!active}>Back to Dark</Button>
</Cluster>

<style>
	:global([data-theme='demo-plum']) {
		color-scheme: dark;
		--c-bg: #1c1224;
		--c-bg-elev: #251831;
		--c-bg-elev-2: #2f1f3d;
		--c-surface: #2a1c37;
		--c-border: #3e2b4f;
		--c-border-strong: #533b68;
		--c-text: #efe6f6;
		--c-text-muted: #b3a2c4;
		--c-text-faint: #7f6f90;
		--c-accent: #e39bff;
		--c-accent-ink: #1c1224;
		--c-accent-dim: #8b5aa6;
		--c-blue: #7fb2ff;
		--c-amber: #f0b35c;
		--c-red: #ff7a90;
		--c-green: #7fd9a2;
		--c-violet: #c59cff;
		--c-gold: #f0b35c;
		--c-teal: #63d3d3;
	}
</style>
