<script lang="ts">
	// ───────────────────────────────────────────────────────────────────────
	// FilterSearchBar organism — a YouTrack-style structured search bar.
	//
	// The textual query IS the single source of truth: the bar is a small query
	// language, so a user can type `artist:"Daft Punk" AND year>=2000` by hand
	// (pure-code mode) OR build it entirely from the context-aware dropdown
	// (visual helper mode). Both edit the same string.
	//
	// This is now a THIN composition over the headless `FilterInput` primitive:
	// FilterInput owns the input, parse/suggest, the dropdown and the caret edit
	// helpers; FilterSearchBar adds the below-bar removable chips (`filters(ast)`)
	// and forwards onchange/onsubmit. Everything project-specific is INJECTED via
	// `schema` (with per-field async `ValueProvider`s).
	// ───────────────────────────────────────────────────────────────────────
	import Badge from '$lib/components/atoms/Badge.svelte';
	import FilterInput from '$lib/components/molecules/FilterInput.svelte';
	import type { Query } from '$lib/query/ast';
	import { findField, operatorById, type Schema } from '$lib/query/schema';

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

	function labelFor(fieldName: string): string {
		return findField(schema, fieldName)?.label ?? fieldName;
	}
</script>

<FilterInput {schema} bind:value {placeholder} {autoQuote} {onchange} {onsubmit}>
	{#snippet below({ filters: chips, text, remove })}
		{#if showChips && (chips.length || text)}
			<div class="fsb__chips">
				{#each chips as f (f.span[0])}
					<Badge tone="info" removable onremove={() => remove(f.span)}>
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
	{/snippet}
</FilterInput>

<style>
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
