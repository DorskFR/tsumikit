<script lang="ts">
	// Yes/no dialog on top of Modal. An async `onconfirm` keeps the dialog open
	// and busy until it settles; a rejection surfaces its message and leaves the
	// dialog open so the user can retry or cancel.
	import type { Snippet } from 'svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Text from '$lib/components/atoms/Text.svelte';
	import Modal from './Modal.svelte';

	let {
		open = $bindable(false),
		title,
		message,
		children,
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		tone = 'primary',
		busy = false,
		onconfirm,
		oncancel
	}: {
		open?: boolean;
		title: string;
		message?: string;
		children?: Snippet;
		confirmLabel?: string;
		cancelLabel?: string;
		tone?: 'primary' | 'danger' | 'warn';
		busy?: boolean;
		onconfirm: () => void | Promise<void>;
		oncancel?: () => void;
	} = $props();

	let pending = $state(false);
	let error = $state<string | null>(null);
	const working = $derived(busy || pending);

	$effect(() => {
		if (!open) error = null;
	});

	async function confirm() {
		if (working) return;
		error = null;
		try {
			const result = onconfirm();
			if (result instanceof Promise) {
				pending = true;
				await result;
			}
			open = false;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			pending = false;
		}
	}

	function cancel() {
		if (working) return;
		open = false;
		oncancel?.();
	}
</script>

<Modal
	bind:open
	{title}
	tone={tone === 'primary' ? 'neutral' : tone}
	busy={working}
	onclose={oncancel}
	size="sm"
>
	{#snippet body()}
		<div class="confirm-body" data-tsu="ConfirmModal">
			{#if message}<Text variant="body">{message}</Text>{/if}
			{@render children?.()}
			{#if error}
				<Text variant="caption" tone="danger" role="alert" class="confirm-error">{error}</Text>
			{/if}
		</div>
	{/snippet}
	{#snippet footer()}
		<Button onclick={cancel} disabled={working}>{cancelLabel}</Button>
		<Button
			variant={tone === 'danger' ? 'danger' : 'primary'}
			tone={tone === 'warn' ? 'warn' : 'none'}
			loading={working}
			onclick={confirm}
		>
			{confirmLabel}
		</Button>
	{/snippet}
</Modal>

<style>
	.confirm-body {
		display: flex;
		flex-direction: column;
		gap: var(--sp-3);
	}
</style>
