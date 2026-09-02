<script lang="ts">
	// Tri-state "load more" footer for paginated lists: idle button, loading
	// button (spinner, blocks re-entry), error line with retry, or a faint
	// "done" note. `pill` renders the compact centered chip used to load older
	// items above a feed.
	import Button from '../atoms/Button.svelte';
	import Text from '../atoms/Text.svelte';

	let {
		state = 'idle',
		onload,
		label = 'Load more',
		loadingLabel = 'Loading…',
		errorLabel = 'Failed to load',
		retryLabel = 'Retry',
		doneLabel = 'No more items',
		pill = false,
		class: klass = '',
		...rest
	}: {
		state?: 'idle' | 'loading' | 'error' | 'done';
		onload?: () => void;
		label?: string;
		loadingLabel?: string;
		errorLabel?: string;
		retryLabel?: string;
		doneLabel?: string;
		pill?: boolean;
		class?: string;
		[key: string]: unknown;
	} = $props();
</script>

<div
	data-tsu="LoadMore"
	data-state={state}
	class="load-more {klass}"
	class:load-more-pill={pill}
	role="status"
	aria-busy={state === 'loading' || undefined}
	{...rest}
>
	{#if state === 'done'}
		<Text variant="caption" class="load-more-done">{doneLabel}</Text>
	{:else if state === 'error'}
		<Text tone="danger" size="sm" class="load-more-error">{errorLabel}</Text>
		<Button size="sm" onclick={() => onload?.()}>{retryLabel}</Button>
	{:else}
		<Button
			size="sm"
			variant={pill ? 'default' : 'ghost'}
			loading={state === 'loading'}
			class={pill ? 'load-more-chip' : ''}
			onclick={() => onload?.()}
		>
			{state === 'loading' ? loadingLabel : label}
		</Button>
	{/if}
</div>

<style>
	.load-more {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: var(--sp-2);
		padding: var(--sp-2);
		min-height: var(--sp-8);
	}
	.load-more-pill {
		padding: var(--sp-1);
	}
	.load-more :global(.load-more-chip) {
		border-radius: var(--r-pill);
		font-size: var(--fs-xs);
	}
</style>
