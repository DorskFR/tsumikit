<script lang="ts">
	// Renders the toast queue in two live regions, inside one region named by
	// `label`: polite for ok/info/neutral, assertive (role=alert) for errors. Mount once near the
	// app root. Bottom placements sit above the TabBar, the DataTable selection
	// bar and `--toaster-offset` (an app's own bottom bars). The stack lives in a manual popover so it paints in the top
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
		placement = 'bottom',
		position,
		class: klass = '',
		style: styleProp = '',
		sound = true,
		label = 'Notifications'
	}: {
		/** Where the stack sits; bottom placements clear the bottom bars. */
		placement?: 'bottom' | 'bottom-start' | 'bottom-end' | 'top';
		/** Which side of that edge the stack hugs. Defaults to the side `placement`
		 *  names (`bottom-start` left, `bottom-end` right), otherwise the centre. */
		position?: 'left' | 'center' | 'right';
		class?: string;
		style?: string;
		/** Play UI sounds when enabled globally; false silences this instance. */
		sound?: boolean;
		/** Accessible name of the region holding both live regions. */
		label?: string;
	} = $props();

	const side = $derived(
		position ?? (placement === 'bottom-start' ? 'left' : placement === 'bottom-end' ? 'right' : 'center')
	);

	let host: HTMLDivElement | undefined = $state();
	let el: HTMLElement | undefined = $state();
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
	function show(stack: HTMLElement) {
		if (typeof stack.showPopover !== 'function') return;
		try {
			stack.showPopover();
			shown = true;
		} catch {}
	}
	function hide(stack: HTMLElement) {
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

	// Hover, focus and a swipe each hold the timer; it resumes once none does.
	const holds = new Map<number, Set<string>>();
	function hold(id: number, why: string) {
		const set = holds.get(id) ?? new Set<string>();
		if (!set.size) toasts.pause(id);
		set.add(why);
		holds.set(id, set);
	}
	function release(id: number, why: string) {
		const set = holds.get(id);
		if (!set?.delete(why) || set.size) return;
		holds.delete(id);
		toasts.resume(id);
	}
	function hover(e: PointerEvent, id: number) {
		if (e.pointerType === 'mouse') hold(id, 'hover');
	}
	function unhover(e: PointerEvent, id: number) {
		if (e.pointerType === 'mouse') release(id, 'hover');
	}

	let focused: number | null = null;
	let restore: HTMLElement | null = null;
	function focusIn(e: FocusEvent, id: number) {
		const from = e.relatedTarget;
		if (!(from instanceof Node && el?.contains(from))) restore = from instanceof HTMLElement ? from : null;
		focused = id;
		hold(id, 'focus');
	}
	function focusOut(e: FocusEvent, id: number) {
		const to = e.relatedTarget;
		if (to instanceof Node && (e.currentTarget as HTMLElement).contains(to)) return;
		if (focused === id) focused = null;
		release(id, 'focus');
	}

	// A dismissed toast must not drop focus to <body>: return it to where it
	// came from, else to the next toast.
	function refocus() {
		focused = null;
		const back = restore;
		restore = null;
		if (back?.isConnected) {
			back.focus();
			if (document.activeElement === back) return;
		}
		const next = el?.querySelector<HTMLElement>('.toast:not([data-leaving])');
		(next?.matches('button') ? next : next?.querySelector<HTMLElement>('button'))?.focus();
	}

	$effect(() => {
		const items = toasts.items;
		for (const id of holds.keys()) if (!items.some((t) => t.id === id)) holds.delete(id);
		if (focused === null) return;
		const t = items.find((x) => x.id === focused);
		if (!t || t.leaving) refocus();
	});

	// Touch swipe to dismiss. The drag writes `translate` straight to the
	// element so a move costs no reactive update.
	const SWIPE_SLOP = 8;
	const SWIPE_DISMISS = 48;
	let swipe: { id: number; pointerId: number; x: number; y: number; dx: number; locked: boolean } | null = null;
	let swallowClick = false;

	function swipeStart(e: PointerEvent, t: (typeof toasts.items)[number]) {
		swallowClick = false;
		if (e.pointerType !== 'touch' || swipe || t.leaving) return;
		swipe = { id: t.id, pointerId: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, locked: false };
	}
	function swipeMove(e: PointerEvent) {
		if (!swipe || e.pointerId !== swipe.pointerId) return;
		const el = e.currentTarget as HTMLElement;
		const dx = e.clientX - swipe.x;
		if (!swipe.locked) {
			const dy = e.clientY - swipe.y;
			if (Math.hypot(dx, dy) < SWIPE_SLOP) return;
			if (Math.abs(dy) >= Math.abs(dx)) {
				swipe = null;
				return;
			}
			swipe.locked = true;
			swallowClick = true;
			hold(swipe.id, 'swipe');
			el.dataset.swiping = '';
			try {
				el.setPointerCapture?.(e.pointerId);
			} catch {}
		}
		swipe.dx = dx;
		el.style.translate = `${dx}px 0`;
	}
	function swipeEnd(e: PointerEvent, cancelled = false) {
		if (!swipe || e.pointerId !== swipe.pointerId) return;
		const { id, dx, locked } = swipe;
		swipe = null;
		if (!locked) return;
		const el = e.currentTarget as HTMLElement;
		delete el.dataset.swiping;
		if (!cancelled && Math.abs(dx) >= SWIPE_DISMISS) {
			el.style.translate = `calc(${dx}px + ${Math.sign(dx) * 6} * var(--shift-md)) 0`;
			toasts.dismiss(id);
		} else {
			el.style.removeProperty('translate');
			release(id, 'swipe');
		}
	}
	function swallowSwipeClick(e: MouseEvent) {
		if (!swallowClick) return;
		swallowClick = false;
		e.stopPropagation();
		e.preventDefault();
	}
</script>

{#snippet toast(t: (typeof toasts.items)[number])}
	{@const tone = t.tone === 'ok' ? 'ok' : t.tone === 'error' ? 'danger' : t.tone === 'info' ? 'info' : undefined}
	{#if t.action}
		<Card
			as="div"
			surface="raised"
			border="solid"
			class="toast"
			{tone}
			data-leaving={t.leaving || undefined}
			onpointerenter={(e: PointerEvent) => hover(e, t.id)}
			onpointerleave={(e: PointerEvent) => unhover(e, t.id)}
			onfocusin={(e: FocusEvent) => focusIn(e, t.id)}
			onfocusout={(e: FocusEvent) => focusOut(e, t.id)}
			onpointerdown={(e: PointerEvent) => swipeStart(e, t)}
			onpointermove={swipeMove}
			onpointerup={(e: PointerEvent) => swipeEnd(e)}
			onpointercancel={(e: PointerEvent) => swipeEnd(e, true)}
			onlostpointercapture={(e: PointerEvent) => swipeEnd(e, true)}
			onclickcapture={swallowSwipeClick}
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
			border="solid"
			class="toast"
			{tone}
			type="button"
			aria-label="Dismiss: {t.message}"
			data-leaving={t.leaving || undefined}
			onpointerenter={(e: PointerEvent) => hover(e, t.id)}
			onpointerleave={(e: PointerEvent) => unhover(e, t.id)}
			onfocusin={(e: FocusEvent) => focusIn(e, t.id)}
			onfocusout={(e: FocusEvent) => focusOut(e, t.id)}
			onpointerdown={(e: PointerEvent) => swipeStart(e, t)}
			onpointermove={swipeMove}
			onpointerup={(e: PointerEvent) => swipeEnd(e)}
			onpointercancel={(e: PointerEvent) => swipeEnd(e, true)}
			onlostpointercapture={(e: PointerEvent) => swipeEnd(e, true)}
			onclickcapture={swallowSwipeClick}
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
	<section
		class="toaster {klass}"
		style={styleProp}
		bind:this={el}
		popover="manual"
		aria-label={label}
		data-tsu="Toaster"
		data-placement={placement}
		data-position={side}
	>
		<div class="region" role="status" aria-live="polite">
			{#each polite as t (t.id)}{@render toast(t)}{/each}
		</div>
		<div class="region" role="alert" aria-live="assertive">
			{#each assertive as t (t.id)}{@render toast(t)}{/each}
		</div>
	</section>
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
		bottom: calc(
			var(--safe-bottom) + var(--tabbar-h, 0px) + var(--selectionbar-h, 0px) + var(--toaster-offset, 0px) +
				var(--sp-4)
		);
		z-index: var(--z-toast);
		display: flex;
		flex-direction: column;
		gap: var(--sp-2);
		width: calc(100% - var(--sp-8));
		max-width: 28rem;
		margin: 0;
		padding: 0;
		border: 0;
		background: transparent;
		overflow: visible;
		pointer-events: none;
	}
	.toaster[data-position='left'] {
		left: calc(var(--safe-left) + var(--sp-4));
		transform: none;
	}
	.toaster[data-position='right'] {
		left: auto;
		right: calc(var(--safe-right) + var(--sp-4));
		transform: none;
	}
	.toaster[data-placement='top'] {
		top: calc(var(--safe-top) + var(--toaster-offset-top, 0px) + var(--sp-4));
		bottom: auto;
		flex-direction: column-reverse;
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
		touch-action: pan-y;
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
		.toaster[data-placement='top'] :global(.toast) {
			translate: 0 calc(-1 * var(--shift-md));
		}
	}
	.toaster :global(.toast[data-leaving]) {
		opacity: 0;
		scale: 0.96;
		pointer-events: none;
		transition-duration: var(--dur-exit-slow);
	}
	.toaster :global(.toast[data-swiping]) {
		transition: none;
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
