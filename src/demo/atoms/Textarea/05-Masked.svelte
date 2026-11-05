<script module>
	export const meta = {
		title: 'Masked spans',
		caption: 'segments splits the value for a mirror overlay behind the textarea; mask hides a span while typing, caret and selection stay native.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Textarea, Text } from '@dorsk/tsumikit';

	let value = $state(
		'Rotate the registry token tonight.\nNew value: <redacted>ghp_7Qx2mN9vLp4Rt8Wz1Kd3Yb6Hs0Fj5Ac</redacted> (expires in 90 days).'
	);

	const TAG = /(<redacted>)([\s\S]*?)(<\/redacted>)/g;

	function segments(text: string) {
		const out: { text: string; mask?: boolean; class?: string }[] = [];
		let last = 0;
		for (const m of text.matchAll(TAG)) {
			if (m.index > last) out.push({ text: text.slice(last, m.index) });
			out.push({ text: m[1], class: 'demo-tag' });
			if (m[2]) out.push({ text: m[2], mask: true });
			out.push({ text: m[3], class: 'demo-tag' });
			last = m.index + m[0].length;
		}
		if (last < text.length) out.push({ text: text.slice(last) });
		return out;
	}
</script>

<Textarea block autoresize bind:value {segments} aria-label="Handover note" />
<Text size="sm" tone="muted">Assistive tech and form submit still get the raw value: {value.length} characters.</Text>

<style>
	:global(.demo-tag) {
		color: var(--text-faint);
	}
</style>
