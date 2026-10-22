<script module>
	export const meta = {
		title: 'States',
		caption: 'state="sending" and "failed" with onretry, clamp={3} with the expand toggle, selected, and a long unbroken token that must wrap inside the bubble.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { ChatBubble } from '@dorsk/tsumikit';

	let failed = $state(true);
	const report = Array.from({ length: 8 }, (_, i) => `- step ${i + 1}: ${['lint', 'typecheck', 'unit', 'build', 'e2e', 'deploy', 'smoke', 'notify'][i]} passed`).join('\n');
</script>

<ChatBubble role="user" state="sending" markdown="Ship the release notes." />
<ChatBubble
	role="user"
	state={failed ? 'failed' : undefined}
	onretry={() => (failed = false)}
	markdown={failed ? 'Deploy 0.62.1 to production.' : 'Deploy 0.62.1 to production. (sent)'}
/>
<ChatBubble role="assistant" clamp={3} markdown={`Pipeline report:\n\n${report}`} />
<ChatBubble role="assistant" selected markdown="This message is selected for a reply." />
<ChatBubble
	role="tool"
	roleLabel="Read"
	markdown="sha256:9f12e485513e4d6eb987d81a95cead559f12e485513e4d6eb987d81a95cead55a95cead559f12e485"
/>
