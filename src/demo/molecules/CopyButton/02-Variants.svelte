<script module>
	export const meta = {
		title: 'Variants and boxes',
		caption: 'variant picks the Button chrome; box="xs|sm|md|lg" makes a square icon-only control; showLabel overrides.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, CopyButton } from '@dorsk/tsumikit';

	const hash = '7f3c9e2a';
</script>

<Cluster align="center">
	<CopyButton text={hash} />
	<CopyButton text={hash} variant="default" />
	<CopyButton text={hash} variant="primary" label="Copy hash" />
	<CopyButton text={hash} variant="danger" label="Copy error id" />
</Cluster>
<Cluster align="center">
	<CopyButton text={hash} box="xs" />
	<CopyButton text={hash} box="sm" />
	<CopyButton text={hash} box="md" />
	<CopyButton text={hash} box="lg" />
	<CopyButton text={hash} box="sm" showLabel />
</Cluster>
