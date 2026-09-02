<script lang="ts">
	// Renders the toast queue in a bottom-centered, polite live region. Mount once
	// near the app root. The stack lives in a manual popover so it paints in the
	// top layer above an open Modal <dialog>; without the Popover API the
	// attribute is ignored and the fixed/z-index positioning applies instead.
	import { toasts } from '$lib/stores/toast.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';

	let el: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (!el || typeof el.showPopover !== 'function') return;
		try {
			if (toasts.items.length) el.showPopover();
			else el.hidePopover();
		} catch {}
	});
</script>

<div
	class="toaster"
	bind:this={el}
	popover="manual"
	role="status"
	aria-live="polite"
	aria-relevant="additions"
	data-tsu="Toaster"
>
	{#each toasts.items as t (t.id)}
		{#if t.action}
			<Card
				as="div"
				surface="raised"
				class="toast"
				tone={t.tone === 'ok' ? 'ok' : t.tone === 'error' ? 'danger' : t.tone === 'info' ? 'info' : undefined}
			>
				<button type="button" class="toast-text" onclick={() => toasts.dismiss(t.id)}>
					{#if t.tone === 'ok'}<Icon name="check" />{:else if t.tone === 'error'}<Icon name="warning" />{:else if t.tone === 'info'}<Icon name="info" />{/if}
					<span class="msg">{t.message}</span>
				</button>
				<Button size="sm" variant="ghost" loading={t.pending} onclick={() => toasts.act(t.id)}>
					{t.action.label}
				</Button>
			</Card>
		{:else}
			<Card
				as="button"
				surface="raised"
				class="toast"
				tone={t.tone === 'ok' ? 'ok' : t.tone === 'error' ? 'danger' : t.tone === 'info' ? 'info' : undefined}
				type="button"
				onclick={() => toasts.dismiss(t.id)}
			>
				{#if t.tone === 'ok'}<Icon name="check" />{:else if t.tone === 'error'}<Icon name="warning" />{:else if t.tone === 'info'}<Icon name="info" />{/if}
				<span class="msg">{t.message}</span>
				<Icon name="x" />
			</Card>
		{/if}
	{/each}
</div>

<style>
	.toaster {
		position: fixed;
		inset: auto;
		left: 50%;
		transform: translateX(-50%);
		bottom: calc(var(--safe-bottom) + var(--sp-4));
		z-index: var(--z-toast);
		display: flex;
		flex-direction: column;
		gap: var(--sp-2);
		width: calc(100% - var(--sp-8));
		max-width: var(--toast-max-width, 28rem);
		margin: 0;
		padding: 0;
		border: 0;
		background: transparent;
		overflow: visible;
		pointer-events: none;
	}
	.toaster:not(:popover-open) {
		display: none;
	}
	.toaster :global(.toast) {
		pointer-events: auto;
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		width: 100%;
		text-align: left;
		font-size: var(--fs-sm);
		animation: toast-in 0.18s var(--ease);
	}
	.toaster :global(.toast.card-ok) {
		color: var(--ok);
	}
	.toaster :global(.toast.card-danger) {
		color: var(--danger);
	}
	.toaster :global(.toast.card-info) {
		color: var(--info);
	}
	.toast-text {
		flex: 1;
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		min-width: 0;
		padding: 0;
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}
	.msg {
		flex: 1;
	}
	@keyframes toast-in {
		from {
			transform: translateY(8px);
			opacity: 0;
		}
	}
</style>
