<script lang="ts">
	// Lightweight tooltip. Shows on hover (after a short delay) and on keyboard
	// focus of the trigger; hides on blur / mouseleave / Escape. The trigger is
	// any snippet; an action wires `aria-describedby` onto its first focusable
	// element so screen readers announce the text. CSS-positioned above the
	// trigger (centered). Dependency-free.
	import type { Snippet } from 'svelte';

	let {
		text,
		placement = 'top',
		delay = 200,
		trigger
	}: {
		text: string;
		placement?: 'top' | 'bottom';
		delay?: number;
		trigger: Snippet;
	} = $props();

	const id = `tip-${Math.random().toString(36).slice(2, 8)}`;
	let open = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	function show() {
		clearTimeout(timer);
		timer = setTimeout(() => (open = true), delay);
	}
	function hide() {
		clearTimeout(timer);
		open = false;
	}

	const FOCUSABLE = 'a[href],button,input,select,textarea,[tabindex]';
	// Action: wire aria-describedby onto the trigger's focusable element AND the
	// hover/focus listeners (attached via the DOM, so the wrapper stays a plain,
	// role-less container — the interactive element is the trigger inside).
	function tooltip(node: HTMLElement) {
		const target = (node.matches(FOCUSABLE) ? node : node.querySelector(FOCUSABLE)) as
			| HTMLElement
			| null;
		target?.setAttribute('aria-describedby', id);
		const onkey = (e: KeyboardEvent) => e.key === 'Escape' && hide();
		node.addEventListener('mouseenter', show);
		node.addEventListener('mouseleave', hide);
		node.addEventListener('focusin', show);
		node.addEventListener('focusout', hide);
		node.addEventListener('keydown', onkey);
		return {
			destroy() {
				target?.removeAttribute('aria-describedby');
				node.removeEventListener('mouseenter', show);
				node.removeEventListener('mouseleave', hide);
				node.removeEventListener('focusin', show);
				node.removeEventListener('focusout', hide);
				node.removeEventListener('keydown', onkey);
			}
		};
	}
</script>

<span class="tip-wrap" use:tooltip>
	{@render trigger()}
	<span {id} role="tooltip" class="tip tip-{placement}" class:open aria-hidden={!open}>
		{text}
	</span>
</span>

<style>
	.tip-wrap {
		position: relative;
		display: inline-flex;
	}
	.tip {
		position: absolute;
		left: 50%;
		transform: translateX(-50%) scale(0.96);
		z-index: var(--z-toast);
		max-width: 16rem;
		width: max-content;
		padding: var(--sp-1) var(--sp-2);
		background: var(--bg-elevated-2);
		color: var(--text);
		border: 1px solid var(--border-strong);
		border-radius: var(--r-sm);
		box-shadow: var(--shadow-md);
		font-size: var(--fs-xs);
		line-height: 1.4;
		white-space: normal;
		pointer-events: none;
		opacity: 0;
		transition:
			opacity 0.12s var(--ease),
			transform 0.12s var(--ease);
	}
	.tip-top {
		bottom: calc(100% + 6px);
	}
	.tip-bottom {
		top: calc(100% + 6px);
	}
	.tip.open {
		opacity: 1;
		transform: translateX(-50%) scale(1);
	}
</style>
