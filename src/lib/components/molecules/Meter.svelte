<script lang="ts">
	// Labelled usage meter: label row, Progress track (markers / thresholds
	// forwarded), trailing value and an optional caption line (reset time…).
	import type { Snippet } from 'svelte';
	import Progress from '$lib/components/atoms/Progress.svelte';
	import type { ControlSize } from '$lib/size';
	import type { Tone } from '$lib/tone';

	let {
		label,
		value,
		max = 100,
		format = (v: number, m: number) => `${Math.round((v / m) * 100)}%`,
		caption,
		markers,
		toneAt,
		tone,
		size = 'md',
		actions,
		class: klass = '',
		style: styleProp = ''
	}: {
		label: string;
		value: number;
		max?: number;
		/** Trailing readout; defaults to a percentage. */
		format?: (value: number, max: number) => string;
		caption?: string | Snippet;
		markers?: { at: number; label?: string; tone?: Tone }[];
		toneAt?: { warn?: number; danger?: number };
		tone?: Tone;
		size?: ControlSize;
		/** Inline controls after the readout (edit cap, bypass…). */
		actions?: Snippet;
		class?: string;
		style?: string;
	} = $props();
</script>

<div data-tsu="Meter" class="meter size-{size} {klass}" style={styleProp}>
	<div class="head">
		<span class="label">{label}</span>
		<span class="readout">{format(value, max)}</span>
		{#if actions}<span class="actions">{@render actions()}</span>{/if}
	</div>
	<Progress {value} {max} label={label} {markers} {toneAt} tone={tone ?? 'accent'} size={size === 'lg' ? 'md' : size} />
	{#if caption}
		<div class="caption">{#if typeof caption === 'string'}{caption}{:else}{@render caption()}{/if}</div>
	{/if}
</div>

<style>
	.meter {
		display: flex;
		flex-direction: column;
		gap: var(--sp-1);
		min-width: 0;
		font-size: var(--fs-sm);
	}
	.size-sm {
		font-size: var(--fs-xs);
	}
	.head {
		display: flex;
		align-items: baseline;
		gap: var(--sp-2);
	}
	.label {
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--text-muted);
	}
	.readout {
		font-variant-numeric: tabular-nums;
		font-family: var(--font-mono);
		color: var(--text);
		white-space: nowrap;
	}
	.actions {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
	}
	.caption {
		font-size: var(--fs-xs);
		color: var(--text-faint);
	}
</style>
