<script lang="ts">
	// ───────────────────────────────────────────────────────────────────────
	// FilterSearchBar organism — a YouTrack-style structured search bar.
	//
	// The textual query IS the single source of truth: the bar is a small query
	// language, so a user can type `artist:"Daft Punk" AND year>=2000` by hand
	// (pure-code mode) OR build it entirely from the context-aware dropdown
	// (visual helper mode). Both edit the same string.
	//
	// The component owns parsing, suggesting and keyboard/dropdown/chips — all of
	// it generic. Everything project-specific is INJECTED:
	//   • `schema`  — the field registry (drives autocomplete + the chips).
	//                 Per-field async `provider`s feed value autocomplete; static
	//                 `options` cover enums. No `fetch` lives in here.
	//   • `onchange(query)` — fires the parsed AST whenever it changes; the host
	//                 runs it against its real backend and renders results.
	//
	// The bar owns the QUERY; the host owns the DISPLAY of results.
	// ───────────────────────────────────────────────────────────────────────
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import { filters, freeText, type Query } from '$lib/query/ast';
	import {
		autoQuoteEdit,
		backspaceEmptyQuotes,
		closingQuoteExit
	} from '$lib/query/edit';
	import { findField, operatorById, type Schema } from '$lib/query/schema';
	import { parse } from '$lib/query/parser';
	import { suggest, type SuggestState } from '$lib/query/suggest';

	let {
		schema,
		value = $bindable(''),
		placeholder = 'artist:"Daft Punk" AND year>=2000',
		showChips = true,
		autoQuote = true,
		onchange,
		onsubmit
	}: {
		schema: Schema;
		/** The raw textual query (two-way bindable). */
		value?: string;
		placeholder?: string;
		/** Render the parsed, removable filter chips under the bar. */
		showChips?: boolean;
		/**
		 * When a string field's value step opens (`title:`), auto-insert a `""`
		 * pair with the caret inside so multi-word values stay together; Tab exits
		 * the quotes. Set false for bare typing where spaces split the value.
		 */
		autoQuote?: boolean;
		/** Fires the parsed AST on every change — feed this to your backend. */
		onchange?: (query: Query, raw: string) => void;
		/** Fires on Enter / clear / chip-remove with the raw query string. */
		onsubmit?: (value: string) => void;
	} = $props();

	let el = $state<HTMLInputElement | null>(null);
	let menu = $state<SuggestState | null>(null);
	let active = $state(0);
	let open = $state(false);
	let reqId = 0;

	// Parsed view (drives the removable chips + the onchange AST).
	const ast = $derived(parse(value, schema));
	const chips = $derived(filters(ast));
	const text = $derived(freeText(ast));

	// Emit the AST whenever the parse result changes.
	$effect(() => {
		onchange?.(ast, value);
	});

	function labelFor(fieldName: string): string {
		return findField(schema, fieldName)?.label ?? fieldName;
	}

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
				active = (active + 1) % menu.items.length;
				break;
			case 'ArrowUp':
				e.preventDefault();
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

<div class="fsb" data-tsu="FilterSearchBar">
	<div class="fsb__bar">
		<span class="fsb__icon"><Icon name="search" label="Search" /></span>
		<input
			bind:this={el}
			bind:value
			class="fsb__input"
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
		{#if value}
			<button
				type="button"
				class="fsb__clear"
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
		<div class="fsb__menu" role="listbox" aria-label={kindLabel[menu.kind]}>
			<div class="fsb__menu-head">{kindLabel[menu.kind]}</div>
			{#each menu.items as item, i (item.insert + i)}
				<button
					type="button"
					class="fsb__opt"
					class:is-active={i === active}
					role="option"
					aria-selected={i === active}
					onmousedown={(e) => e.preventDefault()}
					onmouseenter={() => (active = i)}
					onclick={() => accept(i)}
				>
					<span class="fsb__opt-label">{item.label}</span>
					{#if item.hint}<span class="fsb__opt-hint">{item.hint}</span>{/if}
					{#if item.code}<span class="fsb__opt-code">{item.code}</span>{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

{#if showChips && (chips.length || text)}
	<div class="fsb__chips">
		{#each chips as f (f.span[0])}
			<Badge tone="info" removable onremove={() => removeChip(f.span)}>
				<span class="fsb__chip-field">{labelFor(f.field)}</span>
				<span class="fsb__chip-op">{operatorById(f.op)?.label}</span>
				<span class="fsb__chip-val">{f.values.join(', ') || '∅'}</span>
			</Badge>
		{/each}
		{#if text}
			<Badge tone="neutral">
				<span class="fsb__chip-op">text</span>
				<span class="fsb__chip-val">{text}</span>
			</Badge>
		{/if}
	</div>
{/if}

<style>
	.fsb {
		position: relative;
	}
	.fsb__bar {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		padding: 0 var(--sp-3);
		height: 44px;
		background: var(--bg-elevated);
		border: 1px solid var(--border-strong);
		border-radius: var(--r-md);
	}
	.fsb__bar:focus-within {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-dim);
	}
	.fsb__icon {
		display: flex;
		color: var(--text-faint);
	}
	.fsb__input {
		flex: 1;
		border: 0;
		background: transparent;
		color: var(--text);
		font-family: var(--font-mono);
		font-size: var(--fs-md);
		outline: none;
		min-width: 0;
	}
	.fsb__input::placeholder {
		color: var(--text-faint);
	}
	.fsb__clear {
		display: flex;
		border: 0;
		background: transparent;
		color: var(--text-faint);
		cursor: pointer;
		padding: var(--sp-1);
		border-radius: var(--r-sm);
	}
	.fsb__clear:hover {
		color: var(--text);
		background: var(--bg-elevated-2);
	}

	.fsb__menu {
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
	.fsb__menu-head {
		font-size: var(--fs-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-faint);
		padding: var(--sp-2) var(--sp-2) var(--sp-1);
	}
	.fsb__opt {
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
	.fsb__opt.is-active {
		background: var(--accent-dim);
	}
	.fsb__opt-label {
		font-weight: var(--fw-medium);
	}
	.fsb__opt-hint {
		color: var(--text-faint);
		font-size: var(--fs-xs);
	}
	.fsb__opt-code {
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		color: var(--text-muted);
		background: var(--bg-elevated-2);
		padding: 0 var(--sp-1);
		border-radius: var(--r-sm);
	}

	.fsb__chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--sp-2);
		margin-top: var(--sp-3);
	}
	.fsb__chip-field {
		font-weight: var(--fw-semibold);
	}
	.fsb__chip-op {
		opacity: 0.7;
		font-style: italic;
		margin: 0 var(--sp-1);
	}
	.fsb__chip-val {
		font-family: var(--font-mono);
	}
</style>
