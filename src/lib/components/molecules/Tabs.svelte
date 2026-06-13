<script lang="ts" module>
	export interface TabItem {
		id: string;
		label: string;
		icon?: import('$lib/components/atoms/Icon.svelte').IconName;
	}
</script>

<script lang="ts">
	// WAI-ARIA tabs. A `tablist` of `tab`s controlling a single `tabpanel`.
	// Follows the automatic-activation pattern: ←/→ (and Home/End) move selection
	// and reveal the panel in one step; roving tabindex keeps exactly one tab in
	// the Tab order. `value` is bindable; `panel` is a snippet that receives the
	// active id so the caller renders the matching content.
	import type { Snippet } from 'svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';

	let {
		tabs,
		value = $bindable(),
		label = 'Tabs',
		panel
	}: {
		tabs: TabItem[];
		value?: string;
		label?: string;
		panel: Snippet<[string]>;
	} = $props();

	// Default to the first tab when no value is supplied.
	$effect(() => {
		if (value === undefined && tabs.length) value = tabs[0].id;
	});

	let listEl = $state<HTMLDivElement | null>(null);
	const baseId = `tabs-${Math.random().toString(36).slice(2, 8)}`;

	function select(id: string, focus = false) {
		value = id;
		if (focus) {
			queueMicrotask(() => listEl?.querySelector<HTMLButtonElement>(`#${baseId}-tab-${id}`)?.focus());
		}
	}
	function onkeydown(e: KeyboardEvent) {
		const i = tabs.findIndex((t) => t.id === value);
		if (i < 0) return;
		let next = i;
		if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
		else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
		else if (e.key === 'Home') next = 0;
		else if (e.key === 'End') next = tabs.length - 1;
		else return;
		e.preventDefault();
		select(tabs[next].id, true);
	}
</script>

<div class="tabs">
	<div bind:this={listEl} role="tablist" aria-label={label} tabindex="-1" class="tablist" {onkeydown}>
		{#each tabs as t (t.id)}
			<button
				type="button"
				role="tab"
				id="{baseId}-tab-{t.id}"
				aria-selected={value === t.id}
				aria-controls="{baseId}-panel"
				tabindex={value === t.id ? 0 : -1}
				class="tab"
				class:selected={value === t.id}
				onclick={() => select(t.id)}
			>
				{#if t.icon}<Icon name={t.icon} />{/if}
				<span>{t.label}</span>
			</button>
		{/each}
	</div>
	<div role="tabpanel" id="{baseId}-panel" tabindex="0" class="tabpanel">
		{#if value !== undefined}{@render panel(value)}{/if}
	</div>
</div>

<style>
	.tablist {
		display: flex;
		gap: var(--sp-1);
		border-bottom: 1px solid var(--border);
	}
	.tab {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-2);
		padding: var(--sp-2) var(--sp-3);
		border: none;
		background: none;
		color: var(--text-muted);
		font-size: var(--fs-sm);
		font-weight: var(--fw-medium);
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		transition:
			color 0.12s var(--ease),
			border-color 0.12s var(--ease);
	}
	.tab:hover {
		color: var(--text);
	}
	.tab.selected {
		color: var(--accent);
		border-bottom-color: var(--accent);
	}
	.tabpanel {
		padding-top: var(--sp-4);
	}
	.tabpanel:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
		border-radius: var(--r-sm);
	}
</style>
