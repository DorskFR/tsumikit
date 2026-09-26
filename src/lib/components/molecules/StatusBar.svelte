<script lang="ts">
	// Thin live-status row for a panel: a tone dot (spinner while busy), a label
	// or custom children, and a trailing slot for elapsed time / counters.
	import type { Snippet } from 'svelte';
	import Dot from '$lib/components/atoms/Dot.svelte';
	import Spinner from '$lib/components/atoms/Spinner.svelte';

	type Tone = 'idle' | 'busy' | 'ok' | 'warn' | 'error';

	const TONE_COLOR: Record<Exclude<Tone, 'busy'>, string> = {
		idle: 'var(--text-faint)',
		ok: 'var(--ok)',
		warn: 'var(--warn)',
		error: 'var(--danger)'
	};

	let {
		tone = 'idle',
		label,
		children,
		trailing,
		class: klass = '',
		style: styleProp = ''
	}: {
		tone?: Tone;
		label?: string;
		/** Replaces `label`. */
		children?: Snippet;
		trailing?: Snippet;
		class?: string;
		style?: string;
	} = $props();
</script>

<div
	data-tsu="StatusBar"
	data-tone={tone}
	class="status-bar {klass}"
	class:idle={tone === 'idle'}
	style={styleProp}
	role="status"
	aria-live="polite"
	aria-busy={tone === 'busy' || undefined}
>
	{#if tone === 'busy'}
		<Spinner size={10} label={undefined} class="status-glyph" />
	{:else}
		<Dot color={TONE_COLOR[tone]} class="status-glyph" aria-hidden="true" />
	{/if}
	<span class="status-label">
		{#if children}{@render children()}{:else}{label}{/if}
	</span>
	{#if trailing}<span class="status-trailing">{@render trailing()}</span>{/if}
</div>

<style>
	.status-bar {
		flex: none;
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		min-width: 0;
		padding: var(--sp-1) var(--sp-3);
		font-size: var(--fs-xs);
		color: var(--text-muted);
	}
	.status-bar.idle {
		color: var(--text-faint);
	}
	.status-bar :global(.status-glyph) {
		flex: none;
		color: var(--accent);
	}
	.status-label {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.status-trailing {
		flex: none;
		display: inline-flex;
		align-items: center;
		gap: var(--sp-2);
		color: var(--text-faint);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
</style>
