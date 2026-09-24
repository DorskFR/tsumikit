<script lang="ts" module>
	export interface TabItem {
		id: string;
		label: string;
		icon?: import('$lib/components/atoms/Icon.svelte').IconName;
		/** Greyed out, not selectable, skipped by keyboard navigation. */
		disabled?: boolean;
		/** Trailing count badge. */
		count?: number | string;
		/** Hover text for the whole tab — the full document name behind a truncated label. */
		title?: string;
		/** Per-tab override of the strip's `closable` (pin one tab open). */
		closable?: boolean;
		/**
		 * Extra attributes for this tab's button — `data-*`, `title`…
		 * The tab's own semantics (`role`, `aria-*`, `id`, `class`, `disabled`,
		 * `tabindex`, `onclick`) are applied after and win.
		 */
		attrs?: import('svelte/elements').HTMLButtonAttributes;
	}
</script>

<script lang="ts">
	import Badge from '$lib/components/atoms/Badge.svelte';
	// WAI-ARIA tabs. A `tablist` of `tab`s controlling a single `tabpanel`.
	// Follows the automatic-activation pattern: ←/→ (and Home/End) move selection
	// and reveal the panel in one step; roving tabindex keeps exactly one tab in
	// the Tab order. `value` is bindable; `panel` is a snippet that receives the
	// active id so the caller renders the matching content.
	//
	// Without `panel` the tablist stands alone as a document strip: `closable`
	// tabs gain a close control, Delete and middle-click close the focused tab,
	// `leading` decorates each tab and `actions` trails the strip.
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import IconButton from '$lib/components/molecules/IconButton.svelte';

	let {
		tabs,
		value = $bindable(),
		label = 'Tabs',
		panel,
		closable = false,
		onclose,
		closeLabel = 'Close tab',
		leading,
		actions,
		class: klass = '',
		style: styleProp = '',
		panelClass = '',
		panelPadding = 'md',
		...rest
	}: Omit<HTMLAttributes<HTMLDivElement>, keyof Own> & Own = $props();

	type Own = {
		tabs: TabItem[];
		value?: string;
		label?: string;
		/** Content for the active tab. Omit it for a strip-only tablist. */
		panel?: Snippet<[string]>;
		/** Every tab gets a close control; Delete and middle-click close too. */
		closable?: boolean;
		/** Called with the tab id; the caller removes it from `tabs`. */
		onclose?: (id: string) => void;
		/** Accessible name of each close control. */
		closeLabel?: string;
		/** Rendered before the icon and label of every tab (a status dot, a number). */
		leading?: Snippet<[TabItem]>;
		/** Trailing controls after the strip (close all, new tab). */
		actions?: Snippet;
		class?: string;
		style?: string;
		panelClass?: string;
		panelPadding?: 'none' | 'sm' | 'md';
	};

	// Default to the first selectable tab when no value is supplied.
	$effect(() => {
		if (value === undefined) {
			const first = tabs.find((t) => !t.disabled);
			if (first) value = first.id;
		}
	});

	let listEl = $state<HTMLDivElement | null>(null);
	const baseId = `tabs-${Math.random().toString(36).slice(2, 8)}`;
	const panelId = $derived(panel ? `${baseId}-panel` : undefined);

	function canClose(t: TabItem): boolean {
		return t.closable ?? closable;
	}

	function select(id: string, focus = false) {
		if (tabs.find((t) => t.id === id)?.disabled) return;
		value = id;
		queueMicrotask(() => {
			const el = listEl?.querySelector<HTMLElement>(`#${baseId}-tab-${id}`);
			// The list scrolls when it is too narrow, so keyboard selection has to
			// bring the tab back into view or it moves somewhere unseen.
			el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
			if (focus) el?.focus();
		});
	}
	// Step to the next non-disabled tab in a direction, wrapping around.
	function step(from: number, dir: 1 | -1): number {
		for (let n = 1; n <= tabs.length; n++) {
			const j = (from + dir * n + tabs.length * n) % tabs.length;
			if (!tabs[j].disabled) return j;
		}
		return from;
	}
	// Closing the selected tab hands selection to a neighbour first, so the
	// caller's removal never leaves the strip without a tabbable tab.
	function close(id: string, focus = false) {
		const i = tabs.findIndex((t) => t.id === id);
		if (i < 0 || !canClose(tabs[i])) return;
		if (value === id) {
			const others = tabs.filter((t) => t.id !== id && !t.disabled);
			const next = others.find((t) => tabs.indexOf(t) > i) ?? others.at(-1);
			if (next) select(next.id, focus);
			else value = undefined;
		}
		onclose?.(id);
	}
	function onauxclick(e: MouseEvent, id: string) {
		if (e.button !== 1) return;
		e.preventDefault();
		close(id);
	}
	function onkeydown(e: KeyboardEvent) {
		const i = tabs.findIndex((t) => t.id === value);
		if (i < 0) return;
		if (e.key === 'Delete') {
			if (!canClose(tabs[i])) return;
			e.preventDefault();
			close(tabs[i].id, true);
			return;
		}
		let next = i;
		if (e.key === 'ArrowRight') next = step(i, 1);
		else if (e.key === 'ArrowLeft') next = step(i, -1);
		else if (e.key === 'Home') next = tabs.findIndex((t) => !t.disabled);
		else if (e.key === 'End') next = tabs.length - 1 - [...tabs].reverse().findIndex((t) => !t.disabled);
		else return;
		e.preventDefault();
		select(tabs[next].id, true);
	}
</script>

{#snippet body(t: TabItem)}
	{#if leading}{@render leading(t)}{/if}
	{#if t.icon}<Icon name={t.icon} />{/if}
	<span class="label">{t.label}</span>
	{#if t.count !== undefined}<Badge size="sm" tone={value === t.id ? 'accent' : 'neutral'}>{t.count}</Badge>{/if}
{/snippet}

<div {...rest} class="tabs {klass}" style={styleProp} data-tsu="Tabs">
	<div class="strip">
		<div bind:this={listEl} role="tablist" aria-label={label} tabindex="-1" class="tablist" {onkeydown}>
			{#each tabs as t (t.id)}
				{#if canClose(t)}
					<!-- A close control cannot nest inside a <button>, so a closable tab is a div. -->
					<div
						{...t.attrs as HTMLAttributes<HTMLDivElement>}
						role="tab"
						id="{baseId}-tab-{t.id}"
						title={t.title ?? t.attrs?.title}
						aria-selected={value === t.id}
						aria-controls={panelId}
						aria-disabled={t.disabled || undefined}
						tabindex={value === t.id ? 0 : -1}
						class="tab closable"
						class:selected={value === t.id}
						class:disabled={t.disabled}
						onclick={() => select(t.id)}
						onauxclick={(e) => onauxclick(e, t.id)}
					>
						{@render body(t)}
						<IconButton
							icon="x"
							label={closeLabel}
							inline
							hoverDanger
							size={14}
							hitArea="compact"
							tabindex={-1}
							disabled={t.disabled}
							onclick={(e) => {
								e.stopPropagation();
								close(t.id);
							}}
						/>
					</div>
				{:else}
					<button
						type="button"
						{...t.attrs}
						role="tab"
						id="{baseId}-tab-{t.id}"
						title={t.title ?? t.attrs?.title}
						aria-selected={value === t.id}
						aria-controls={panelId}
						disabled={t.disabled}
						tabindex={value === t.id ? 0 : -1}
						class="tab"
						class:selected={value === t.id}
						onclick={() => select(t.id)}
					>
						{@render body(t)}
					</button>
				{/if}
			{/each}
		</div>
		{#if actions}
			<div class="actions">{@render actions()}</div>
		{/if}
	</div>
	{#if panel}
		<div role="tabpanel" id={panelId} tabindex="0" class="tabpanel {panelClass}" class:pad-none={panelPadding === 'none'} class:pad-sm={panelPadding === 'sm'}>
			{#if value !== undefined}{@render panel(value)}{/if}
		</div>
	{/if}
</div>

<style>
	.strip {
		display: flex;
		align-items: stretch;
	}
	.tablist {
		display: flex;
		flex: 1 1 auto;
		min-width: 0;
		gap: var(--sp-1);
		border-bottom: 1px solid var(--border);
		overflow-x: auto;
		overflow-y: hidden;
		scrollbar-width: thin;
	}
	.tab {
		display: inline-flex;
		flex: 0 0 auto;
		white-space: nowrap;
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
		max-width: var(--tab-max-width, none);
		transition:
			color 0.12s var(--ease),
			border-color 0.12s var(--ease);
	}
	.tab.closable {
		cursor: pointer;
		padding-inline-end: var(--sp-2);
		user-select: none;
	}
	.tab:hover:not(:disabled, .disabled) {
		color: var(--text);
	}
	.tab:disabled,
	.tab.disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.tab.selected {
		color: var(--accent);
		border-bottom-color: var(--accent);
	}
	.label {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.actions {
		display: flex;
		flex: 0 0 auto;
		align-items: center;
		gap: var(--sp-1);
		padding-inline-start: var(--sp-2);
		border-bottom: 1px solid var(--border);
	}
	.tabpanel {
		padding-top: var(--sp-4);
	}
	.tabpanel.pad-sm {
		padding-top: var(--sp-2);
	}
	.tabpanel.pad-none {
		padding-top: 0;
	}
	.tabpanel:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
		border-radius: var(--r-sm);
	}
</style>
