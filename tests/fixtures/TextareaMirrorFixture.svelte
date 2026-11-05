<script lang="ts">
	import Textarea, { type TextareaSegment } from '$lib/components/atoms/Textarea.svelte';
	import Composer from '$lib/components/molecules/Composer.svelte';

	let {
		value = $bindable('plain <redacted>secret</redacted> tail'),
		mirrored = true,
		composer = false,
		maxHeight,
		autoresize = false,
		oninput,
		onscroll
	}: {
		value?: string;
		mirrored?: boolean;
		composer?: boolean;
		maxHeight?: string;
		autoresize?: boolean;
		oninput?: (e: Event) => void;
		onscroll?: (e: Event) => void;
	} = $props();

	const TAG = /(<redacted>)([\s\S]*?)(<\/redacted>)/g;

	export function segments(text: string): TextareaSegment[] {
		const out: TextareaSegment[] = [];
		let last = 0;
		for (const m of text.matchAll(TAG)) {
			if (m.index > last) out.push({ text: text.slice(last, m.index) });
			out.push({ text: m[1], class: 'tag' });
			if (m[2]) out.push({ text: m[2], mask: true });
			out.push({ text: m[3], class: 'tag' });
			last = m.index + m[0].length;
		}
		if (last < text.length) out.push({ text: text.slice(last) });
		return out;
	}
</script>

{#if composer}
	<Composer bind:value onsubmit={() => {}} {segments} />
{:else}
	<Textarea
		bind:value
		segments={mirrored ? segments : undefined}
		{maxHeight}
		{autoresize}
		{oninput}
		{onscroll}
		rows={3}
		aria-label="Mirrored"
		data-testid="ta"
		placeholder="Type here"
	/>
{/if}
