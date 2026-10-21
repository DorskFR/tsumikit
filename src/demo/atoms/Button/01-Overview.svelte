<script module>
	export const meta = {
		title: 'Dialog footer',
		caption: 'variant="primary" carries the one main action; ghost and default stand beside it.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Text, toasts } from '@dorsk/tsumikit';

	let saving = $state(false);
	async function save() {
		saving = true;
		await new Promise((r) => setTimeout(r, 900));
		saving = false;
		toasts.show('Workspace settings saved');
	}
</script>

<Text tone="muted" size="sm">Changes apply to all 12 members of the workspace.</Text>
<Cluster justify="flex-end">
	<Button variant="ghost">Cancel</Button>
	<Button>Reset to defaults</Button>
	<Button variant="primary" loading={saving} onclick={save}>Save changes</Button>
</Cluster>
