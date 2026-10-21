<script lang="ts">
	import Spinner from '$lib/components/atoms/Spinner.svelte';
	import Skeleton from '$lib/components/atoms/Skeleton.svelte';
	import Progress from '$lib/components/atoms/Progress.svelte';
	let {
		variant,
		size,
		label = 'Loading',
		class: klass,
		style
	}: { variant?: never; size?: number; label?: string | undefined; class?: string; style?: string } &
		Record<string, unknown> = $props();
</script>

<div id="default"><Spinner /></div>
<div id="variant"><Spinner {variant} {size} {label} class={klass} {style} /></div>
<div id="skeleton"><Skeleton lines={2} /></div>
<div id="progress"><Progress label="Importing" /></div>
