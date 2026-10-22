<script module>
	export const meta = {
		title: 'In hints, buttons and tight rows',
		caption: 'inline inside a field hint, trailing a button label, shrink={false} inside a squeezed row and block to fill a line.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Kbd, Text } from '@dorsk/tsumikit';
</script>

<Text size="sm" tone="muted">Press <Kbd keys="mod+enter" /> to submit, <Kbd keys="esc" /> to discard.</Text>
<Cluster>
	<Button variant="primary">Send <Kbd keys="mod+enter" /></Button>
	<Button variant="ghost">Cancel <Kbd keys="esc" /></Button>
</Cluster>
<div class="tight">
	<Text truncate>A long menu item label that competes with its shortcut for the row width</Text>
	<Kbd keys="mod+shift+p" shrink={false} />
</div>
<Kbd keys="mod+shift+alt+enter" block />

<style>
	.tight {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		max-width: 16rem;
	}
</style>
