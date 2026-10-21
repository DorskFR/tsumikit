<script lang="ts">
	// Renders the toast queue bottom-centered in two live regions: polite for
	// ok/info/neutral, assertive (role=alert) for errors. Mount once near the
	// app root. The stack lives in a manual popover so it paints in the top
	// layer; without the Popover API the attribute is ignored and the
	// fixed/z-index positioning applies instead. While a modal <dialog> is open
	// everything outside it is inert, top layer included, so the stack moves
	// into the topmost modal dialog and back to its host when it closes.
	import { toasts } from '$lib/stores/toast.svelte';
	import { playSound } from '$lib/sound';
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';

	let {
		class: klass = '',
		style: styleProp = '',
		sound = true
	}: {
		class?: string;
		style?: string;
		/** Play UI sounds when enabled globally; false silences this instance. */
		sound?: boolean;
	} = $props();

	let host: HTMLDivElement | undefined = $state();
	let el: HTMLDivElement | undefined = $state();
	const polite = $derived(toasts.items.filter((t) => t.tone !== 'error'));
	const assertive = $derived(toasts.items.filter((t) => t.tone === 'error'));

	function topModal(): HTMLDialogElement | null {
		let found: HTMLDialogElement | null = null;
		for (const d of document.querySelectorAll<HTMLDialogElement>('dialog[open]')) {
			try {
				if (d.matches(':modal')) found = d;
			} catch {}
		}
		return found;
	}

	let shown = false;
	function show(stack: HTMLDivElement) {
		if (typeof stack.showPopover !== 'function') return;
		try {
			stack.showPopover();
			shown = true;
		} catch {}
	}
	function hide(stack: HTMLDivElement) {
		if (!shown || typeof stack.hidePopover !== 'function') return;
		shown = false;
		try {
			stack.hidePopover();
		} catch {}
	}

	$effect(() => {
		const stack = el;
		const home = host;
		if (!stack || !home) return;
		if (!toasts.items.length) {
			hide(stack);
			return;
		}
		const place = () => {
			const target = topModal() ?? home;
			if (stack.parentNode !== target) {
				hide(stack);
				target.appendChild(stack);
			}
			show(stack);
		};
		place();
		const observer = new MutationObserver(place);
		observer.observe(document.body, { attributes: true, attributeFilter: ['open'], subtree: true });
		return () => observer.disconnect();
	});

	$effect(() => () => {
		if (el && host && el.parentNode !== host) host.appendChild(el);
	});

	// Feedback tones sound once, when the toast appears; the queue present at
	// mount is a sync, not an arrival.
	let seen: Set<number> | null = null;
	$effect(() => {
		const items = toasts.items;
		if (!seen) {
			seen = new Set(items.map((t) => t.id));
			return;
		}
		for (const t of items) {
			if (seen.has(t.id)) continue;
			seen.add(t.id);
			if (t.tone === 'ok') playSound('success', sound);
			else if (t.tone === 'error') playSound('error', sound);
		}
	});

	// Hovering a toast holds its timer; only a real pointer counts.
	function hold(e: PointerEvent, id: number) {
		if (e.pointerType === 'mouse') toasts.pause(id);
	}
	function release(e: PointerEvent, id: number) {
		if (e.pointerType === 'mouse') toasts.resume(id);
	}
</script>

{#snippet toast(t: (typeof toasts.items)[number])}
	{@const tone = t.tone === 'ok' ? 'ok' : t.tone === 'error' ? 'danger' : t.tone === 'info' ? 'info' : undefined}
	{#if t.action}
		<Card
			as="div"
			surface="raised"
			class="toast"
			{tone}
			data-leaving={t.leaving || undefined}
			onpointerenter={(e: PointerEvent) => hold(e, t.id)}
			onpointerleave={(e: PointerEvent) => release(e, t.id)}
		>
			<button
				type="button"
				class="toast-text"
				aria-label="Dismiss: {t.message}"
				onclick={() => toasts.dismiss(t.id)}
			>
				<span aria-hidden="true" class="toast-icon">
					{#if t.tone === 'ok'}<Icon name="check" />{:else if t.tone === 'error'}<Icon name="warning" />{:else if t.tone === 'info'}<Icon name="info" />{/if}
				</span>
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
			{tone}
			type="button"
			aria-label="Dismiss: {t.message}"
			data-leaving={t.leaving || undefined}
			onpointerenter={(e: PointerEvent) => hold(e, t.id)}
			onpointerleave={(e: PointerEvent) => release(e, t.id)}
			onclick={() => toasts.dismiss(t.id)}
		>
			<span aria-hidden="true" class="toast-icon">
				{#if t.tone === 'ok'}<Icon name="check" />{:else if t.tone === 'error'}<Icon name="warning" />{:else if t.tone === 'info'}<Icon name="info" />{/if}
			</span>
			<span class="msg">{t.message}</span>
			<span aria-hidden="true" class="toast-icon"><Icon name="x" /></span>
		</Card>
	{/if}
{/snippet}

<div class="toaster-host" bind:this={host}>
	<div class="toaster {klass}" style={styleProp} bind:this={el} popover="manual" data-tsu="Toaster">
		<div class="region" role="status" aria-live="polite">
			{#each polite as t (t.id)}{@render toast(t)}{/each}
		</div>
		<div class="region" role="alert" aria-live="assertive">
			{#each assertive as t (t.id)}{@render toast(t)}{/each}
		</div>
	</div>
</div>

<style>
	.toaster-host {
		display: contents;
	}
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
	.region {
		display: contents;
	}
	.toast-icon {
		display: inline-flex;
	}
	.toaster :global(.toast) {
		pointer-events: auto;
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		width: 100%;
		text-align: left;
		font-size: var(--fs-sm);
		transition:
			opacity var(--dur-sheet) var(--ease-out),
			translate var(--dur-sheet) var(--ease-out),
			scale var(--dur-sheet) var(--ease-out);
	}
	@starting-style {
		.toaster :global(.toast) {
			opacity: 0;
			translate: 0 var(--shift-md);
			scale: 0.98;
		}
	}
	.toaster :global(.toast[data-leaving]) {
		opacity: 0;
		scale: 0.96;
		pointer-events: none;
		transition-duration: var(--dur-exit-slow);
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
</style>
