<script module>
	export const meta = {
		title: 'Roving focus',
		caption: 'Tab into the bar once, then ← → Home End move between controls, skipping disabled ones; roving={false} drops role="toolbar" and leaves one tab stop per control.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Kbd, Stack, Text, Toolbar } from '@dorsk/tsumikit';
</script>

<Stack gap="var(--sp-1)">
	<Cluster gap="var(--sp-1)">
		<Kbd keys="tab" /><Kbd keys="left" /><Kbd keys="right" /><Kbd keys="home" /><Kbd keys="end" />
	</Cluster>
	<Toolbar label="Review">
		<Button size="sm">Prev</Button>
		<Button size="sm" disabled>Approve</Button>
		<Button size="sm">Reply</Button>
		<Button size="sm">Next</Button>
	</Toolbar>
</Stack>
<Stack gap="var(--sp-1)">
	<Text size="xs" mono tone="muted">roving={'{false}'}</Text>
	<Toolbar roving={false}>
		<Button size="sm">Prev</Button>
		<Button size="sm">Reply</Button>
		<Button size="sm">Next</Button>
	</Toolbar>
</Stack>
