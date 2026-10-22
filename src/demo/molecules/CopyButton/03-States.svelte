<script module>
	export const meta = {
		title: 'Copied feedback and labels',
		caption: 'copiedLabel and resetMs tune the confirmation; hitArea="compact" drops the touch slab in dense rows; sound={false} silences one instance.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, CopyButton, Text } from '@dorsk/tsumikit';

	const commits = [
		{ sha: '7f3c9e2', message: 'Tooltip: hovercard mode with persist-on-hover' },
		{ sha: 'b41d08a', message: 'Menu: control rows join arrow navigation' },
		{ sha: 'e9a7c55', message: 'Toaster: move into the topmost modal while one is open' }
	];
</script>

<Cluster align="center">
	<CopyButton text="https://example.dev/share/9k2m" label="Copy link" copiedLabel="Link copied" />
	<CopyButton text="7f3c9e2" copiedLabel="Hash copied" resetMs={4000} />
	<CopyButton text="ok" sound={false} label="Silent copy" />
</Cluster>
<ul class="log">
	{#each commits as { sha, message } (sha)}
		<li>
			<Text mono size="sm" tone="muted">{sha}</Text>
			<Text size="sm" truncate>{message}</Text>
			<CopyButton text={sha} box="xs" hitArea="compact" />
		</li>
	{/each}
</ul>

<style>
	.log {
		display: grid;
		gap: var(--sp-1);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--sp-2);
	}
</style>
