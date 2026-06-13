<script lang="ts">
	// Renders the toast queue in a bottom-centered, polite live region. Mount once
	// near the app root. Each toast is tap/click-dismissible; screen readers
	// announce additions via aria-live. Sits in its own stacking context above
	// page content but below modals' top layer.
	import { toasts } from '$lib/stores/toast.svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';
</script>

<div class="toaster" role="status" aria-live="polite" aria-relevant="additions">
	{#each toasts.items as t (t.id)}
		<button
			type="button"
			class="toast"
			class:ok={t.tone === 'ok'}
			class:err={t.tone === 'error'}
			onclick={() => toasts.dismiss(t.id)}
		>
			{#if t.tone === 'ok'}<Icon name="check" />{:else if t.tone === 'error'}<Icon name="warning" />{/if}
			<span class="msg">{t.message}</span>
			<Icon name="x" />
		</button>
	{/each}
</div>

<style>
	.toaster {
		position: fixed;
		left: 50%;
		transform: translateX(-50%);
		bottom: calc(var(--safe-bottom) + var(--sp-4));
		z-index: var(--z-toast);
		display: flex;
		flex-direction: column;
		gap: var(--sp-2);
		width: calc(100% - var(--sp-8));
		max-width: 30rem;
		pointer-events: none;
	}
	.toast {
		pointer-events: auto;
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		width: 100%;
		text-align: left;
		color: var(--text);
		background: var(--bg-elevated-2);
		border: 1px solid var(--border-strong);
		border-radius: var(--r-md);
		padding: var(--sp-3) var(--sp-4);
		box-shadow: var(--shadow-md);
		font-size: var(--fs-sm);
		animation: toast-in 0.18s var(--ease);
	}
	.toast .msg {
		flex: 1;
	}
	.toast.ok {
		border-color: var(--ok);
		color: var(--ok);
	}
	.toast.err {
		border-color: var(--danger);
		color: var(--danger);
	}
	@keyframes toast-in {
		from {
			transform: translateY(8px);
			opacity: 0;
		}
	}
</style>
