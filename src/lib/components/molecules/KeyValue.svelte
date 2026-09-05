<script lang="ts" module>
	import type { Snippet } from 'svelte';

	import type { Tone } from '$lib/tone';
	export type KeyValueTone = Tone;

	export interface KeyValueRow {
		label: string;
		value: string | number | Snippet;
		mono?: boolean;
		tone?: KeyValueTone;
		hint?: string;
	}
</script>

<script lang="ts">
	// Label/value grid as a semantic <dl>: one or two label+value column pairs,
	// values optionally mono / toned, with a faint hint line under the value.
	import Text from '../atoms/Text.svelte';

	const TEXT_TONE = {
		neutral: 'default',
		ok: 'success',
		warn: 'warn',
		danger: 'danger',
		info: 'accent',
		success: 'success',
		accent: 'accent',
	} as const;

	let {
		rows,
		columns = 1,
		dense = false,
		align = 'start',
		class: klass = '',
		...rest
	}: {
		rows: KeyValueRow[];
		columns?: 1 | 2;
		dense?: boolean;
		align?: 'start' | 'end';
		class?: string;
		[key: string]: unknown;
	} = $props();
</script>

<dl
	data-tsu="KeyValue"
	class="kv {klass}"
	class:kv-cols-2={columns === 2}
	class:kv-dense={dense}
	class:kv-align-end={align === 'end'}
	{...rest}
>
	{#each rows as row, i (i)}
		<div class="kv-row">
			<dt class="kv-label">{row.label}</dt>
			<dd class="kv-value">
				{#if typeof row.value === 'function'}
					{@render row.value()}
				{:else}
					<Text
						tone={TEXT_TONE[row.tone ?? 'neutral']}
						variant={row.mono ? 'code' : undefined}
						numeric={typeof row.value === 'number'}
					>
						{row.value}
					</Text>
				{/if}
				{#if row.hint}
					<Text as="div" variant="caption" class="kv-hint">{row.hint}</Text>
				{/if}
			</dd>
		</div>
	{/each}
</dl>

<style>
	.kv {
		display: grid;
		grid-template-columns: max-content minmax(0, 1fr);
		column-gap: var(--sp-4);
		row-gap: var(--sp-2);
		margin: 0;
		font-size: var(--fs-sm);
	}
	.kv-cols-2 {
		grid-template-columns: repeat(2, max-content minmax(0, 1fr));
	}
	.kv-dense {
		row-gap: var(--sp-1);
		column-gap: var(--sp-3);
		font-size: var(--fs-xs);
	}
	.kv-row {
		display: contents;
	}
	.kv-label {
		color: var(--text-muted);
		font-weight: var(--fw-medium);
	}
	.kv-value {
		margin: 0;
		min-width: 0;
		color: var(--text);
		overflow-wrap: anywhere;
	}
	.kv-align-end .kv-value {
		text-align: end;
	}
	.kv-value :global(.kv-hint) {
		margin-top: var(--sp-1);
	}
	@container (max-width: 30rem) {
		.kv-cols-2 {
			grid-template-columns: max-content minmax(0, 1fr);
		}
	}
</style>
