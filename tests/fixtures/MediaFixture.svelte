<script lang="ts">
	import { minWidth } from '$lib/breakpoints';
	import { media, mq } from '$lib/media.svelte';

	const md = media(minWidth('md'));
</script>

<span data-part="md" data-matches={md.matches}></span>
<span data-part="mq-sm" data-matches={mq.sm}></span>
<span data-part="mq-lg" data-matches={mq.lg}></span>
