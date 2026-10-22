<script module>
	export const meta = {
		title: 'Scoped override',
		caption: 'data-fx-* on any ancestor overrides the page setting for that subtree; "none" turns a family off.',
		layout: 'stack',
	};
</script>

<script lang="ts">
	import { Button, Checkbox, Cluster, Switch, Text } from '@dorsk/tsumikit';

	const scopes = [
		{ hover: 'smoke', check: 'draw', switch: 'squash' },
		{ hover: 'ember', check: 'pop', switch: 'glow' },
		{ hover: 'aurora', check: 'confetti', switch: 'calm' },
		{ hover: 'none', check: 'none', switch: 'none' },
	];
</script>

{#each scopes as s (s.hover)}
	<div data-fx-hover={s.hover} data-fx-check={s.check} data-fx-switch={s.switch}>
		<Cluster align="center">
			<Text size="sm" tone="muted" mono>{s.hover} · {s.check} · {s.switch}</Text>
			<Button variant="primary">Primary</Button>
			<Button>Default</Button>
			<Checkbox label="Check" />
			<Switch label="Switch" labelVisible />
		</Cluster>
	</div>
{/each}
