<script module>
	export const meta = {
		title: 'Assistant prompt',
		caption: 'toolbarStart / toolbarEnd move attach and send into a row under the field; history browses earlier prompts with ↑/↓; onfiles enables attaching; pasted, dropped or picked files land in bind:attachments.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Composer, SegmentedControl, Text } from '@dorsk/tsumikit';

	let draft = $state('');
	let attachments = $state<File[]>([]);
	let history = $state(['Summarise the 0.62 release notes', 'Why is cache-01 restarting?']);
	let mode = $state('ask');
	let sent = $state('');

	function send(text: string, files: File[]) {
		sent = `${mode}: “${text}”${files.length ? ` + ${files.length} file(s)` : ''}`;
		history = [...history, text];
		draft = '';
		attachments = [];
	}
</script>

<Composer
	bind:value={draft}
	bind:attachments
	{history}
	onsubmit={send}
	onfiles={() => {}}
	placeholder="Ask about the fleet… (↑ for history)"
>
	{#snippet toolbarStart()}
		<SegmentedControl
			size="sm"
			bind:value={mode}
			options={[{ value: 'ask', label: 'Ask' }, { value: 'plan', label: 'Plan' }, { value: 'edit', label: 'Edit' }]}
			label="Mode"
		/>
	{/snippet}
	{#snippet toolbarEnd()}
		<Badge size="xs" tone="muted">opus 5.5</Badge>
	{/snippet}
</Composer>
<Text size="sm" tone="muted">{sent || 'Nothing sent yet.'}</Text>
