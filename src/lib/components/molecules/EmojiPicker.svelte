<script lang="ts">
	// Emoji chooser: a Popover holding a search box, a tab strip of catalogue
	// groups and a grid of glyphs. Desktop browsers have no emoji keyboard, so
	// this is the click-only path next to a plain text field.
	import Input from '$lib/components/atoms/Input.svelte';
	import Popover from '$lib/components/molecules/Popover.svelte';
	import { type EmojiGroup, EMOJI_GROUPS, searchEmoji } from '$lib/emoji';

	let {
		value = '',
		onselect,
		groups = EMOJI_GROUPS,
		columns = 8,
		label = 'Choose an emoji',
		searchLabel = 'Search an emoji…',
		emptyLabel = 'No emoji matches.',
		placement = 'bottom-start',
		triggerClass = '',
		disabled = false,
		class: klass = '',
		style: styleProp = '',
	}: {
		/** The current glyph, highlighted in the grid. */
		value?: string;
		onselect: (emoji: string) => void;
		/** Catalogue to browse; defaults to the kit's EN+FR keyword set. */
		groups?: readonly EmojiGroup[];
		columns?: number;
		/** Accessible name of the trigger and of the glyph grid. */
		label?: string;
		searchLabel?: string;
		emptyLabel?: string;
		placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
		triggerClass?: string;
		disabled?: boolean;
		class?: string;
		style?: string;
	} = $props();

	const uid = `emoji-${Math.random().toString(36).slice(2, 8)}`;
	const tabId = (id: string) => `${uid}-tab-${id}`;
	const panelId = `${uid}-panel`;

	let query = $state('');
	let groupId = $state<string | null>(null);
	let cursor = $state(0);
	let gridEl = $state<HTMLDivElement | null>(null);

	const current = $derived(groups.find((g) => g.id === groupId) ?? groups[0]);
	const searching = $derived(query.trim().length > 0);
	const shown = $derived(searching ? searchEmoji(query, groups) : (current?.entries ?? []));
	const active = $derived(Math.min(cursor, Math.max(shown.length - 1, 0)));
	const picked = $derived(value.trim());

	function focusCell(i: number) {
		const cells = gridEl?.querySelectorAll<HTMLElement>('[role="option"]');
		if (!cells?.length) return;
		cursor = Math.max(0, Math.min(i, cells.length - 1));
		cells[cursor].focus();
	}

	function pick(emoji: string, close: () => void) {
		onselect(emoji);
		query = '';
		close();
	}

	function onGridClick(e: MouseEvent, close: () => void) {
		const cell = (e.target as HTMLElement | null)?.closest<HTMLElement>('[role="option"]');
		if (cell?.dataset.emoji) pick(cell.dataset.emoji, close);
	}

	function onGridKeydown(e: KeyboardEvent, close: () => void) {
		const keys: Record<string, number> = {
			ArrowRight: active + 1,
			ArrowLeft: active - 1,
			ArrowDown: active + columns,
			ArrowUp: active - columns,
			Home: 0,
			End: shown.length - 1,
		};
		if (e.key in keys) {
			e.preventDefault();
			focusCell(keys[e.key]);
		} else if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			const emoji = shown[active]?.emoji;
			if (emoji) pick(emoji, close);
		}
	}

	function onTabsKeydown(e: KeyboardEvent) {
		const i = groups.findIndex((g) => g.id === current?.id);
		const next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
		if (next === null) return;
		e.preventDefault();
		const g = groups[(next + groups.length) % groups.length];
		groupId = g.id;
		cursor = 0;
		document.getElementById(tabId(g.id))?.focus();
	}
</script>

<Popover
	{label}
	{placement}
	{triggerClass}
	{disabled}
	class={klass}
	style={styleProp}
	control
	role="dialog"
	onopen={() => {
		query = '';
		cursor = 0;
	}}
>
	{#snippet trigger()}
		<span class="emoji-trigger" aria-hidden="true">{picked || '🙂'}</span>
	{/snippet}

	{#snippet children({ close }: { close: () => void })}
		<div class="picker">
			<Input
				bind:value={query}
				placeholder={searchLabel}
				aria-label={searchLabel}
				size="sm"
				clearable
				onclear={() => (query = '')}
				style="width:100%"
			/>

			{#if !searching}
				<div class="tabs" role="tablist" tabindex={-1} aria-label={label} onkeydown={onTabsKeydown}>
					{#each groups as g (g.id)}
						<button
							type="button"
							role="tab"
							id={tabId(g.id)}
							class="tab"
							class:on={g.id === current?.id}
							aria-selected={g.id === current?.id}
							aria-controls={panelId}
							aria-label={g.label}
							tabindex={g.id === current?.id ? 0 : -1}
							onclick={() => {
								groupId = g.id;
								cursor = 0;
							}}
						>
							<span aria-hidden="true">{g.icon}</span>
						</button>
					{/each}
				</div>
			{/if}

			<div
				id={panelId}
				role={searching ? undefined : 'tabpanel'}
				aria-labelledby={searching || !current ? undefined : tabId(current.id)}
			>
				{#if shown.length}
					<!-- Options are not buttons: `option` is only valid as a listbox child,
					     and a roving tabindex keeps the grid to one tab stop. -->
					<div
						bind:this={gridEl}
						class="grid"
						role="listbox"
						tabindex={-1}
						aria-label={label}
						style:--emoji-columns={columns}
						onclick={(e) => onGridClick(e, close)}
						onkeydown={(e) => onGridKeydown(e, close)}
					>
						{#each shown as x, i (x.emoji)}
							<div
								role="option"
								class="cell"
								class:on={x.emoji === picked}
								aria-selected={x.emoji === picked}
								data-emoji={x.emoji}
								title={x.keys}
								tabindex={i === active ? 0 : -1}
							>
								{x.emoji}
							</div>
						{/each}
					</div>
				{:else}
					<p class="empty">{emptyLabel}</p>
				{/if}
			</div>
		</div>
	{/snippet}
</Popover>

<style>
	.emoji-trigger {
		font-size: var(--fs-md);
		line-height: 1;
	}
	.picker {
		display: flex;
		flex-direction: column;
		gap: var(--sp-2);
		width: min(20rem, calc(100vw - var(--sp-6)));
	}
	.tabs {
		display: flex;
		gap: var(--sp-1);
	}
	.tab,
	.cell {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--sp-1);
		border: 1px solid transparent;
		border-radius: var(--r-sm);
		background: none;
		color: inherit;
		font-size: var(--fs-lg);
		line-height: 1;
		cursor: pointer;
	}
	.tab.on,
	.cell.on {
		border-color: var(--accent);
		background: var(--bg-elevated-2);
	}
	.tab:hover,
	.cell:hover,
	.tab:focus-visible,
	.cell:focus-visible {
		background: var(--bg-elevated-2);
	}
	.tab:focus-visible,
	.cell:focus-visible {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(var(--emoji-columns), 1fr);
		gap: var(--sp-1);
		max-height: 14rem;
		overflow-y: auto;
	}
	.empty {
		margin: var(--sp-2) 0;
		color: var(--text-muted);
		font-size: var(--fs-xs);
		text-align: center;
	}
</style>
