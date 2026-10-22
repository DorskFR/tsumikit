<script lang="ts">
	import { Link } from '@dorsk/tsumikit';
	import { base } from '$app/paths';

	$effect(() => {
		location.replace(`${base}/${location.hash}`);
	});
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<p>The showcase moved to <Link href="{base}/">{base}/</Link>.</p>
