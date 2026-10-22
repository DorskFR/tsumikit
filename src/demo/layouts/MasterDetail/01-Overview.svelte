<script module>
	export const meta = {
		title: 'Mail inbox',
		caption: 'Drag the preview edge under 40rem: the list and the message become two pages with a back header, and focus returns to the opened row.',
		layout: 'stack',
		resizable: true
	};
</script>

<script lang="ts">
	import { Avatar, Heading, MasterDetail, Stack, Text } from '@dorsk/tsumikit';
	import { inbox } from './data';

	let openId = $state<number | null>(null);
	const open = $derived(inbox.find((m) => m.id === openId));
</script>

<MasterDetail
	selected={open !== undefined}
	onback={() => (openId = null)}
	breakpoint="40rem"
	listWidth="19rem"
	listLabel="Inbox"
	style="height: 24rem; border: 1px solid var(--border); border-radius: var(--r-md)"
>
	{#snippet list()}
		{#each inbox as mail (mail.id)}
			<button class="mail" class:active={mail.id === openId} onclick={() => (openId = mail.id)}>
				<Avatar name={mail.from} hue={mail.hue} size="sm" decorative />
				<Stack gap="0" style="min-width: 0; flex: 1">
					<Text weight={mail.unread ? 'semibold' : 'normal'} truncate>{mail.from}</Text>
					<Text size="sm" truncate>{mail.subject}</Text>
					<Text size="xs" tone="muted" truncate>{mail.preview}</Text>
				</Stack>
				<Text size="xs" tone="muted" nowrap>{mail.time}</Text>
			</button>
		{/each}
	{/snippet}
	{#snippet detailHeader()}
		<Text size="sm" tone="muted" truncate>{open?.from ?? 'Inbox · 2 unread'}</Text>
	{/snippet}
	{#snippet detail()}
		<Stack style="padding: var(--sp-4)">
			<Heading level={3} size="md">{open?.subject}</Heading>
			<Text tone="muted" size="sm">{open?.from} · {open?.time}</Text>
			<Text as="p">{open?.preview}</Text>
		</Stack>
	{/snippet}
	{#snippet empty()}
		<Stack align="center" justify="center" fill>
			<Text tone="muted">Select a message to read it.</Text>
		</Stack>
	{/snippet}
</MasterDetail>

<style>
	.mail {
		display: flex;
		align-items: flex-start;
		gap: var(--sp-3);
		width: 100%;
		padding: var(--sp-3);
		border: 0;
		border-bottom: 1px solid var(--border);
		background: none;
		color: inherit;
		font: inherit;
		text-align: start;
		cursor: pointer;
	}
	.mail.active {
		background: color-mix(in srgb, var(--accent) 14%, transparent);
	}
</style>
