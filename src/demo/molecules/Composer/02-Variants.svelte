<script module>
	export const meta = {
		title: 'Layouts',
		caption: 'Fused (attach and send inside the field), leading / trailing snippets, rows={3} with resize="top", and submitOn="mod-enter" for multi-line prompts.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Composer, Kbd, Text } from '@dorsk/tsumikit';

	let drafts = $state({ fused: '', slotted: '', tall: '' });
	let log = $state('');

	function sender(key: keyof typeof drafts) {
		return (text: string) => {
			log = text;
			drafts[key] = '';
		};
	}
</script>

<Composer bind:value={drafts.fused} onsubmit={sender('fused')} onfiles={() => {}} placeholder="Message #platform" />
<Composer bind:value={drafts.slotted} onsubmit={sender('slotted')} placeholder="Reply in thread">
	{#snippet leading()}<Text size="sm" tone="muted">@jun</Text>{/snippet}
	{#snippet trailing()}<Kbd keys="enter" />{/snippet}
</Composer>
<Composer
	bind:value={drafts.tall}
	onsubmit={sender('tall')}
	rows={3}
	resize="top"
	submitOn="mod-enter"
	sendLabel="Post review"
	placeholder="Write a review comment (Ctrl/⌘+Enter to post)"
/>
<Text size="sm" tone="muted">{log ? `Sent: ${log}` : 'Each composer clears after sending.'}</Text>
