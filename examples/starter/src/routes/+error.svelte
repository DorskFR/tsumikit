<script lang="ts">
	import { Button, EmptyState } from '@dorsk/tsumikit';
	import { page } from '$app/state';

	const notFound = $derived(page.status === 404);
	const title = $derived(notFound ? 'There is nothing at this address' : 'Something went wrong on our side');
	const description = $derived(
		notFound
			? 'The link may be old, or the page may have moved. Your data is not affected.'
			: 'The page could not be loaded. Nothing you did caused this; trying again usually works.',
	);
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<EmptyState tone="danger" icon="alert-circle" {title} {description}>
	{#snippet action()}
		{#if notFound}
			<Button variant="primary" href="/">Go to the start</Button>
		{:else}
			<Button variant="primary" onclick={() => location.reload()}>Try again</Button>
			<Button href="/">Go to the start</Button>
		{/if}
	{/snippet}
</EmptyState>
