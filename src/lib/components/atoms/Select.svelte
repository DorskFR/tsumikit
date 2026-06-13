<script lang="ts">
	// Native <select> primitive. Owns its styling from theme tokens; supports
	// `bind:value` and passes through every native attribute. Options are slotted
	// children so call-sites keep full control over <option> rendering.
	//
	// The default variant hides the OS chevron (appearance: none) and draws its
	// own, so the control looks identical across platforms and the chevron sits
	// at a consistent, token-defined offset that adapts to the theme.
	//
	// `variant="ghost"` makes the control fill its (positioned) parent fully
	// transparently — for the "native select overlaid on a custom trigger" pattern
	// (SelectButton): the platform popup with no custom outside-click logic, while
	// a styled trigger shows through underneath.
	import type { Snippet } from 'svelte';
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import Icon from '$lib/components/atoms/Icon.svelte';

	type Props = HTMLSelectAttributes & {
		variant?: 'default' | 'ghost';
		class?: string;
		value?: HTMLSelectAttributes['value'];
		children?: Snippet;
	};

	let {
		variant = 'default',
		class: klass = '',
		value = $bindable(),
		children,
		...rest
	}: Props = $props();
</script>

{#if variant === 'ghost'}
	<select class="select ghost {klass}" bind:value {...rest}>
		{@render children?.()}
	</select>
{:else}
	<div class="select-wrap {klass}">
		<select class="select" bind:value {...rest}>
			{@render children?.()}
		</select>
		<span class="select-chevron" aria-hidden="true">
			<Icon name="chevron-down" size={16} />
		</span>
	</div>
{/if}

<style>
	.select-wrap {
		position: relative;
		display: block;
		width: 100%;
	}
	.select {
		width: 100%;
		padding: var(--sp-3);
		background: var(--bg);
		border: 1px solid var(--border-strong);
		border-radius: var(--r-md);
		color: var(--text);
		transition: border-color 0.12s var(--ease);
	}
	/* Default variant: drop the OS chevron, reserve room for our own. */
	.select-wrap .select {
		appearance: none;
		-webkit-appearance: none;
		padding-right: calc(var(--sp-3) + 1.25rem);
	}
	.select:focus {
		outline: none;
		border-color: var(--accent);
	}
	.select-chevron {
		position: absolute;
		top: 50%;
		right: var(--sp-3);
		transform: translateY(-50%);
		display: inline-flex;
		color: var(--text-muted);
		pointer-events: none; /* clicks fall through to the select */
	}
	/* Transparent overlay: fills the positioned parent, the trigger shows through. */
	.select.ghost {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		padding: 0;
		opacity: 0;
		border: none;
		background: none;
		cursor: pointer;
	}
</style>
