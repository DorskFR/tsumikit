<script lang="ts">
	import { goto } from '$app/navigation';
	import DemoIndex from '../../demo/framework/DemoIndex.svelte';
	import { pageFor } from '../../demo/framework/hash';
	import { pathOf } from '../../demo/framework/routes';

	$effect(() => {
		const follow = () => {
			const to = location.hash && pageFor(location.hash, pathOf);
			if (to) goto(to, { replaceState: true });
		};
		follow();
		addEventListener('hashchange', follow);
		return () => removeEventListener('hashchange', follow);
	});
</script>

<svelte:head>
	<title>@dorsk/tsumikit</title>
</svelte:head>

<DemoIndex />
