<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import EmptyState from '$lib/components/molecules/EmptyState.svelte';
	import { pending } from '$lib/pending.svelte';

	let {
		busy = false,
		delay,
		min
	}: { busy?: boolean; delay?: number; min?: number } = $props();

	const p = pending(() => busy, () => ({ delay, min }));
</script>

<span data-part="raw" data-visible={p.visible}></span>
<Button loading={busy} loadingDelay={delay} loadingMin={min}>Save</Button>
<Button loading={busy} loadingStyle="morph" loadingDelay={delay} loadingMin={min}>Morph</Button>
<EmptyState loading={busy} loadingDelay={delay} loadingMin={min} title="Loading" />
