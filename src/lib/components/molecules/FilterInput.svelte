<script module lang="ts">
	import type { FilterNode, Query } from '$lib/query/ast';

	/**
	 * The reactive parse context handed to the `inline` and `below` snippets so a
	 * host can render arbitrary Svelte nodes (badges, custom components, chips)
	 * either inline inside the bar or below it — all derived from the same value.
	 */
	export interface FilterInputContext {
		/** The parsed AST for the current value. */
		ast: Query;
		/** The parsed filter clauses (field/op/value + source span). */
		filters: FilterNode[];
		/** The free-text remainder (non-field terms). */
		text: string;
		/** The raw textual query. */
		value: string;
		/** Splice a clause out by its source span and re-fire onsubmit. */
		remove: (span: [number, number]) => void;
		/** Focus the underlying input. */
		focus: () => void;
	}
</script>

<script lang="ts">
	// ───────────────────────────────────────────────────────────────────────
	// FilterInput primitive — the headless base of the structured search bar.
	//
	// It owns the input element, parse/suggest, the context-aware suggestion
	// dropdown, keyboard + dropdown navigation and the caret-aware editing
	// helpers (autoQuoteEdit / backspaceEmptyQuotes / closingQuoteExit). It does
	// NOT render below-bar chips — that composition lives in FilterSearchBar. A
	// host can render arbitrary inline nodes via the `inline` snippet (single
	// structured field with badges) and/or below-bar content via `below`.
	//
	// Everything project-specific is INJECTED via `schema` (with per-field async
	// `ValueProvider`s). No `fetch` lives in here; the bar owns the QUERY string.
	// ───────────────────────────────────────────────────────────────────────
	import type { Snippet } from 'svelte';
	import Icon, { type IconName } from '$lib/components/atoms/Icon.svelte';
	import { filters, freeText } from '$lib/query/ast';
	import { autoQuoteEdit, backspaceEmptyQuotes, closingQuoteExit } from '$lib/query/edit';
	import { parse } from '$lib/query/parser';
	import { type Schema } from '$lib/query/schema';
	import { suggest, type SuggestState } from '$lib/query/suggest';

	let {
		schema,
		value = $bindable(''),
		placeholder = 'artist:"Daft Punk" AND year>=2000',
		autoQuote = true,
		showClear = true,
		icon = 'search',
		onchange,
		onsubmit,
		inline,
		below
	}: {
		schema: Schema;
		/** The raw textual query (two-way bindable). */
		value?: string;
		placeholder?: string;
		/**
		 * When a string field's value step opens (`title:`), auto-insert a `""`
		 * pair with the caret inside so multi-word values stay together; Tab exits
		 * the quotes. Set false for bare typing where spaces split the value.
		 */
		autoQuote?: boolean;
		/** Show the trailing clear (✕) button when the field is non-empty. */
		showClear?: boolean;
		/** Leading icon; pass `null` to hide it. */
		icon?: IconName | null;
		/** Fires the parsed AST on every change — feed this to your backend. */
		onchange?: (query: Query, raw: string) => void;
		/** Fires on Enter / clear / chip-remove with the raw query string. */
		onsubmit?: (value: string) => void;
		/**
		 * Custom inline content rendered inside the bar, before the input — the
		 * hook for a single structured field that shows badges / custom nodes
		 * inline (no below-bar chips). Receives the reactive parse context.
		 */
		inline?: Snippet<[FilterInputContext]>;
		/**
		 * Content rendered below the bar (e.g. removable chips). FilterSearchBar
		 * passes its chip row here; single-field hosts simply omit it.
		 */
		below?: Snippet<[FilterInputContext]>;
	} = $props();

	let el = $state<HTMLInputElement | null>(null);
	let menuEl = $state<HTMLDivElement | null>(null);
	let menu = $state<SuggestState | null>(null);
	let active = $state(0);
	let open = $state(false);
	let keyboardNavigation = $state(false);
	let reqId = 0;

	// Parsed view (drives the onchange AST + the snippet context).
	const ast = $derived(parse(value, schema));
	const chips = $derived(filters(ast));
	const text = $derived(freeText(ast));

	const ctx = $derived<FilterInputContext>({
		ast,
		filters: chips,
		text,
		value,
		remove: removeChip,
		focus: () => el?.focus()
	});

	// Emit the AST whenever the parse result changes.
	$effect(() => {
		onchange?.(ast, value);
	});

	// Keep keyboard navigation visible without moving the menu under the pointer
	// when the active option changes because of hover.
	$effect(() => {
		active;
		if (!keyboardNavigation || !open || !menuEl) return;
		menuEl.querySelector<HTMLElement>('.fi__opt.is-active')?.scrollIntoView({ block: 'nearest' });
	});

	function setCaret(pos: number) {
		queueMicrotask(() => {
			if (!el) return;
			el.focus();
			el.setSelectionRange(pos, pos);
		});
	}

	function oninput(e: Event) {
		if (autoQuote && el && (e as InputEvent).inputType?.startsWith('insert')) {
			const pos = el.selectionStart ?? value.length;
			const edit = autoQuoteEdit(schema, value, pos);
			if (edit) {
				value = edit.value;
				setCaret(edit.pos);
				queueMicrotask(refresh);
				return;
			}
		}
		refresh();
	}

	async function refresh() {
		if (!el) return;
		const pos = el.selectionStart ?? value.length;
		const id = ++reqId;
		const next = await suggest(schema, value, pos);
		if (id !== reqId) return; // a newer keystroke won
		menu = next;
		active = 0;
		keyboardNavigation = false;
		open = !!next && next.items.length > 0;
	}

	function accept(i: number) {
		if (!menu || !el) return;
		const s = menu.items[i];
		if (!s) return;
		const [a, b] = menu.span;
		value = value.slice(0, a) + s.insert + value.slice(b);
		let caret = s.caret;
		// A field/operator pick that opens a string field's value step gets the
		// same auto-quotes as manual typing.
		if (autoQuote && s.advance) {
			const edit = autoQuoteEdit(schema, value, caret);
			if (edit) {
				value = edit.value;
				caret = edit.pos;
			}
		}
		// Restore caret after the inserted text, then re-run suggestions if the
		// step advanced (field → operator → value) so the flow keeps going.
		queueMicrotask(() => {
			if (!el) return;
			el.focus();
			el.setSelectionRange(caret, caret);
			if (s.advance) refresh();
			else open = false;
		});
	}

	function onkeydown(e: KeyboardEvent) {
		if (autoQuote && el) {
			const pos = el.selectionStart ?? value.length;
			if (e.key === 'Tab') {
				// Inside auto-quotes Tab exits them (takes priority over accepting a
				// dropdown item); elsewhere it falls through to accept.
				const exit = closingQuoteExit(value, pos);
				if (exit !== null) {
					e.preventDefault();
					open = false;
					setCaret(exit);
					return;
				}
			} else if (e.key === 'Backspace') {
				const edit = backspaceEmptyQuotes(value, pos);
				if (edit) {
					e.preventDefault();
					value = edit.value;
					setCaret(edit.pos);
					queueMicrotask(refresh);
					return;
				}
			}
		}
		if (!open || !menu) {
			if (e.key === 'Enter') submit();
			return;
		}
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				keyboardNavigation = true;
				active = (active + 1) % menu.items.length;
				break;
			case 'ArrowUp':
				e.preventDefault();
				keyboardNavigation = true;
				active = (active - 1 + menu.items.length) % menu.items.length;
				break;
			case 'Enter':
			case 'Tab':
				e.preventDefault();
				accept(active);
				break;
			case 'Escape':
				e.preventDefault();
				open = false;
				break;
		}
	}

	function submit() {
		open = false;
		onsubmit?.(value);
	}

	function removeChip(span: [number, number]) {
		// Splice the clause out, plus trailing spaces to avoid doubles.
		const [a, b] = span;
		let end = b;
		while (value[end] === ' ') end++;
		value = (value.slice(0, a) + value.slice(end)).replace(/\s{2,}/g, ' ').trim();
		onsubmit?.(value);
		queueMicrotask(() => el?.focus());
	}

	const kindLabel: Record<string, string> = {
		field: 'Fields',
		operator: 'Operators',
		value: 'Values'
	};
</script>

<div class="fi" data-tsu="FilterInput">
	<div class="fi__bar">
		{#if icon}<span class="fi__icon"><Icon name={icon} label="Search" /></span>{/if}
		{#if inline}{@render inline(ctx)}{/if}
		<input
			bind:this={el}
			bind:value
			class="fi__input"
			spellcheck="false"
			autocomplete="off"
			{placeholder}
			{oninput}
			onclick={refresh}
			onkeyup={(e) => {
				if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') refresh();
			}}
			onfocus={refresh}
			onblur={() => setTimeout(() => (open = false), 120)}
			{onkeydown}
		/>
		{#if showClear && value}
			<button
				type="button"
				class="fi__clear"
				title="Clear"
				onclick={() => {
					value = '';
					onsubmit?.('');
					el?.focus();
				}}
			>
				<Icon name="x" label="Clear" />
			</button>
		{/if}
	</div>

	{#if open && menu}
		<div bind:this={menuEl} class="fi__menu" role="listbox" aria-label={kindLabel[menu.kind]}>
			<div class="fi__menu-head">{kindLabel[menu.kind]}</div>
			{#each menu.items as item, i (item.insert + i)}
				<button
					type="button"
					class="fi__opt"
					class:is-active={i === active}
					role="option"
					aria-selected={i === active}
					onmousedown={(e) => e.preventDefault()}
					onmouseenter={() => {
						keyboardNavigation = false;
						active = i;
					}}
					onclick={() => accept(i)}
				>
					<span class="fi__opt-label">{item.label}</span>
					{#if item.hint}<span class="fi__opt-hint">{item.hint}</span>{/if}
					{#if item.code}<span class="fi__opt-code">{item.code}</span>{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

{#if below}{@render below(ctx)}{/if}

<style>
	.fi {
		position: relative;
	}
	.fi__bar {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		padding: 0 var(--sp-3);
		min-height: 44px;
		background: var(--bg-elevated);
		border: 1px solid var(--border-strong);
		border-radius: var(--r-md);
	}
	.fi__bar:focus-within {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-dim);
	}
	.fi__icon {
		display: flex;
		color: var(--text-faint);
	}
	.fi__input {
		flex: 1;
		border: 0;
		background: transparent;
		color: var(--text);
		font-family: var(--font-mono);
		font-size: var(--fs-md);
		outline: none;
		min-width: 0;
	}
	.fi__input::placeholder {
		color: var(--text-faint);
	}
	.fi__clear {
		display: flex;
		border: 0;
		background: transparent;
		color: var(--text-faint);
		cursor: pointer;
		padding: var(--sp-1);
		border-radius: var(--r-sm);
	}
	.fi__clear:hover {
		color: var(--text);
		background: var(--bg-elevated-2);
	}

	.fi__menu {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		z-index: var(--z-drawer);
		background: var(--bg-elevated);
		border: 1px solid var(--border-strong);
		border-radius: var(--r-md);
		box-shadow: var(--shadow-lg);
		padding: var(--sp-1);
		max-height: 320px;
		overflow-y: auto;
	}
	.fi__menu-head {
		font-size: var(--fs-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-faint);
		padding: var(--sp-2) var(--sp-2) var(--sp-1);
	}
	.fi__opt {
		display: flex;
		align-items: baseline;
		gap: var(--sp-2);
		width: 100%;
		text-align: left;
		border: 0;
		background: transparent;
		color: var(--text);
		padding: var(--sp-2);
		border-radius: var(--r-sm);
		cursor: pointer;
		font-size: var(--fs-sm);
	}
	.fi__opt.is-active {
		background: var(--accent-dim);
	}
	.fi__opt-label {
		font-weight: var(--fw-medium);
	}
	.fi__opt-hint {
		color: var(--text-faint);
		font-size: var(--fs-xs);
	}
	.fi__opt-code {
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		color: var(--text-muted);
		background: var(--bg-elevated-2);
		padding: 0 var(--sp-1);
		border-radius: var(--r-sm);
	}
</style>
