<script module>
	export const meta = {
		title: 'Phone regime in a narrow box',
		caption: 'The breakpoint is the component width, not the viewport: boxed at 22rem it is one pane at a time even on a desktop.',
		layout: 'center'
	};
</script>

<script lang="ts">
	import { Heading, MasterDetail, NavItem, Stack, Text } from '@dorsk/tsumikit';
	import { inbox } from './data';

	let openId = $state<number | null>(null);
	const open = $derived(inbox.find((m) => m.id === openId));
</script>

<div style="width: 22rem; max-width: 100%">
	<MasterDetail
		selected={open !== undefined}
		onback={() => (openId = null)}
		backLabel="Inbox"
		style="height: 20rem; border: 1px solid var(--border); border-radius: var(--r-md)"
	>
		{#snippet list()}
			<Stack gap="0" style="padding: var(--sp-1)">
				{#each inbox as mail (mail.id)}
					<NavItem icon="mail" label={mail.subject} onclick={() => (openId = mail.id)} />
				{/each}
			</Stack>
		{/snippet}
		{#snippet detail()}
			<Stack style="padding: var(--sp-4)">
				<Heading level={3} size="md">{open?.subject}</Heading>
				<Text as="p">{open?.preview}</Text>
			</Stack>
		{/snippet}
	</MasterDetail>
</div>
