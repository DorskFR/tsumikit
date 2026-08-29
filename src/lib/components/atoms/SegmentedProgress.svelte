<script lang="ts" module>
	// One bar split into proportional segments (e.g. one per season of a series),
	// each filled value/max with its own tone. Token-styled, thin separators.
	export type ProgressSegment = {
		value: number;
		max: number;
		// Fill colour per segment. `muted` renders a faint fill for empty parts.
		tone?: 'accent' | 'success' | 'warn' | 'danger' | 'muted';
		// Native tooltip / accessible name for the segment.
		label?: string;
	};
</script>

<script lang="ts">
	let {
		segments,
		label,
		size = 'md',
		class: klass = ''
	}: {
		segments: ProgressSegment[];
		label?: string;
		// Track height. `sm` is a thin ~5px track for inline rows.
		size?: 'sm' | 'md';
		class?: string;
	} = $props();

	const totalMax = $derived(segments.reduce((s, seg) => s + Math.max(0, seg.max), 0));
	const totalValue = $derived(
		segments.reduce((s, seg) => s + Math.max(0, Math.min(seg.value, seg.max)), 0)
	);

	function pct(seg: ProgressSegment): number {
		if (seg.max <= 0) return 0;
		return Math.max(0, Math.min(100, (seg.value / seg.max) * 100));
	}
</script>

<div
	data-tsu="SegmentedProgress"
	class="segmented-progress size-{size} {klass}"
	role="progressbar"
	aria-label={label}
	aria-valuemin={0}
	aria-valuemax={totalMax}
	aria-valuenow={totalValue}
>
	{#each segments as seg, i (i)}
		<div
			class="segment tone-{seg.tone ?? 'accent'}"
			style="flex-grow: {Math.max(seg.max, 1)}"
			title={seg.label}
		>
			<div class="bar" style="width: {pct(seg)}%"></div>
		</div>
	{/each}
</div>

<style>
	.segmented-progress {
		display: flex;
		width: 100%;
		height: 0.5rem;
		gap: 2px;
		border-radius: var(--r-pill);
	}
	.segmented-progress.size-sm {
		height: 0.3125rem;
	}
	.segment {
		flex: 0 1 0%;
		min-width: 3px;
		height: 100%;
		background: var(--bg-elevated-2);
		overflow: hidden;
	}
	.segment:first-child {
		border-top-left-radius: var(--r-pill);
		border-bottom-left-radius: var(--r-pill);
	}
	.segment:last-child {
		border-top-right-radius: var(--r-pill);
		border-bottom-right-radius: var(--r-pill);
	}
	.bar {
		height: 100%;
		background: var(--fill, var(--accent));
		transition: width 0.2s var(--ease);
	}
	.tone-success {
		--fill: var(--ok);
	}
	.tone-warn {
		--fill: var(--warn);
	}
	.tone-danger {
		--fill: var(--danger);
	}
	.tone-muted {
		--fill: var(--text-faint);
	}
</style>
