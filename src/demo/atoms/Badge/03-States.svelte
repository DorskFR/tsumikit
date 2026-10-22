<script module>
	export const meta = {
		title: 'Interactive, removable, removed and overflowing',
		caption: 'as="button" with active for a toggle, href for a link, removable with onremove, actionIcon for another trailing action, removed for a restorable tag, truncate with maxWidth.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Cluster } from '@dorsk/tsumikit';

	let unread = $state(true);
	let keys = $state([
		{ name: 'API_KEY', removed: false },
		{ name: 'DATABASE_URL', removed: true },
		{ name: 'SENTRY_DSN', removed: false }
	]);
	const toggle = (name: string) =>
		(keys = keys.map((k) => (k.name === name ? { ...k, removed: !k.removed } : k)));
</script>

<Cluster>
	<Badge as="button" tone="info" active={unread} onclick={() => (unread = !unread)}>unread {unread ? 'on' : 'off'}</Badge>
	<Badge as="button" tone="ok" active size="sm">on</Badge>
	<Badge as="button" tone="ok" size="sm">off</Badge>
	<Badge href="https://github.com/DorskFR/tsumikit" external tone="accent">repository</Badge>
</Cluster>
<Cluster>
	{#each keys as k (k.name)}
		{#if k.removed}
			<Badge mono removed actionIcon="retry" actionLabel="Restore {k.name}" onaction={() => toggle(k.name)}>{k.name}</Badge>
		{:else}
			<Badge mono tone="danger" removable actionIcon="trash" actionLabel="Delete {k.name}" onremove={() => toggle(k.name)}>{k.name}</Badge>
		{/if}
	{/each}
</Cluster>
<Cluster>
	<Badge truncate maxWidth="12ch">a very long account name that clips</Badge>
	<Badge truncate maxWidth="16ch" mono tone="info" removable onremove={() => {}}>feature/very-long-branch-name-that-clips</Badge>
	<Badge block tone="warn" border={false}>A block badge fills its row, for a banner-like notice</Badge>
</Cluster>
