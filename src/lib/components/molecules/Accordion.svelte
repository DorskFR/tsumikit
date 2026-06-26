<script lang="ts" module>
	import type { Snippet } from 'svelte';
	export interface AccordionItem {
		id: string;
		title: string;
		/** Panel content for this item. */
		content: Snippet;
		open?: boolean;
	}
</script>

<script lang="ts">
	// Disclosure accordion built on native <details>/<summary> — zero JS for the
	// open/close, full keyboard + a11y for free. When `multiple` is false the
	// items share a `name`, using the platform's exclusive-accordion behavior
	// (only one open at a time). The summary marker is replaced with a rotating
	// chevron.
	import Icon from '$lib/components/atoms/Icon.svelte';

	let {
		items,
		multiple = true,
		class: klass = ''
	}: {
		items: AccordionItem[];
		multiple?: boolean;
		class?: string;
	} = $props();

	// One shared name → native single-open accordion (stable id, derived toggle).
	const gid = `acc-${Math.random().toString(36).slice(2, 8)}`;
	const groupName = $derived(multiple ? undefined : gid);
</script>

<div class="accordion {klass}" data-tsu="Accordion">
	{#each items as item (item.id)}
		<details name={groupName} open={item.open}>
			<summary>
				<span class="acc-title">{item.title}</span>
				<span class="acc-chevron"><Icon name="chevron-down" /></span>
			</summary>
			<div class="acc-panel">{@render item.content()}</div>
		</details>
	{/each}
</div>

<style>
	.accordion {
		border: 1px solid var(--border);
		border-radius: var(--r-lg);
		overflow: hidden;
	}
	details + details {
		border-top: 1px solid var(--border);
	}
	summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-2);
		padding: var(--sp-3) var(--sp-4);
		cursor: pointer;
		font-weight: var(--fw-medium);
		font-size: var(--fs-sm);
		list-style: none;
		user-select: none;
	}
	/* Hide the default disclosure triangle across engines. */
	summary::-webkit-details-marker {
		display: none;
	}
	summary::marker {
		content: '';
	}
	summary:hover {
		background: var(--bg-elevated-2);
	}
	summary:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}
	/* Wrap the chevron in our own element so rotation is a scoped rule (no
	   :global into the Icon child). The Icon inherits the color via currentColor. */
	.acc-chevron {
		display: inline-flex;
		color: var(--text-muted);
		transition: transform 0.15s var(--ease);
	}
	details[open] summary .acc-chevron {
		transform: rotate(180deg);
	}
	.acc-panel {
		padding: 0 var(--sp-4) var(--sp-4);
		font-size: var(--fs-sm);
		color: var(--text-muted);
	}
</style>
