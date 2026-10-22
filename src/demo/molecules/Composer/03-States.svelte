<script module>
	export const meta = {
		title: 'States',
		caption: 'busy while a reply streams, disabled when the session ended, pre-attached files, and a long draft capped by maxHeight.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Composer } from '@dorsk/tsumikit';
	import { files } from '../../fixtures';

	let busy = $state('Rerun the flaky e2e suite');
	let attachments = $state(files.slice(1, 4).map((f) => new File(['x'.repeat(Math.min(f.size, 64))], f.name, { type: f.type })));
	let withFiles = $state('Can you compare these two exports?');
	let long = $state(
		Array.from({ length: 12 }, (_, i) => `${i + 1}. Check ${['logs', 'metrics', 'traces', 'alerts'][i % 4]} for worker-0${(i % 3) + 1}`).join('\n')
	);
</script>

<Composer bind:value={busy} onsubmit={() => {}} busy />
<Composer value="" onsubmit={() => {}} disabled placeholder="This session has ended" />
<Composer bind:value={withFiles} bind:attachments onsubmit={() => (attachments = [])} onfiles={() => {}} />
<Composer bind:value={long} onsubmit={() => (long = '')} maxHeight="8rem" />
