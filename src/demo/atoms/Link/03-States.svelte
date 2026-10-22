<script module>
	export const meta = {
		title: 'Anchor, button, download and long titles',
		caption: 'href renders an anchor (target and rel pass through); without it a button. align="start" keeps a wrapped button title left-aligned.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Link, Text } from '@dorsk/tsumikit';

	let opened = $state(0);
</script>

<Cluster>
	<Link href="https://svelte.dev" target="_blank" rel="noreferrer">Opens in a new tab</Link>
	<Link href="data:text/plain,hello" download="hello.txt">Download hello.txt</Link>
	<Link onclick={() => opened++}>Reopen panel</Link>
	<Text size="sm" tone="muted" numeric>opened {opened}×</Text>
</Cluster>
<div style="max-width: 18rem">
	<Link align="start" onclick={() => opened++}>A conversation title long enough to wrap onto a second line inside a narrow sidebar</Link>
</div>
