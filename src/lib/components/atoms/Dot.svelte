<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	// Status dot — a small coloured disc, optionally followed by a label. Owns its
	// own styling (it does not rely on any global `.dot` rules). Colour comes from
	// either:
	//   • status → one of the semantic presets (active/stale/dead/hibernated),
	//     each mapped to a token.
	//   • color  → any CSS colour (or var()) for a one-off; overrides `status`.
	// `glow` adds a soft halo in the dot's own colour; `ring` adds a dark halo so
	// the dot stays legible over artwork. With a `label` the whole
	// thing renders as an inline-flex row (dot + caption); without one it's a bare
	// inline dot, so it can sit inline next to other text.
	import Text from './Text.svelte';

	type Status = 'active' | 'stale' | 'dead' | 'hibernated';

	type Own = {
		status?: Status;
		color?: string;
		label?: string;
		glow?: boolean;
		ring?: boolean;
		/** Focusable (`tabindex=0`, `role=img`) so it can anchor a Tooltip. */
		interactive?: boolean;
		class?: string;
	};
	let {
		status = 'active',
		color,
		label,
		glow = false,
		ring = false,
		interactive = false,
		class: klass = '',
		style: styleProp,
		...rest
	}: Omit<HTMLAttributes<HTMLSpanElement>, keyof Own> & Own = $props();

	const inline = $derived(color ? `color: ${color};` : '');
</script>

{#if label}
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<span class="dot-row {klass}" data-tsu="Dot" role={interactive ? 'img' : undefined} tabindex={interactive ? 0 : undefined} aria-label={interactive ? label : undefined} style={styleProp} {...rest}>
		<span class="dot {color ? 'dot-colored' : `dot-${status}`}" class:glow class:ring style={inline || undefined}></span>
		<Text variant="caption">{label}</Text>
	</span>
{:else}
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<span class="dot {color ? 'dot-colored' : `dot-${status}`} {klass}" class:glow class:ring style={inline + (styleProp ?? '') || undefined} data-tsu="Dot" role={interactive ? 'img' : undefined} tabindex={interactive ? 0 : undefined} aria-label={interactive && !color ? status : undefined} {...rest}></span>
{/if}

<style>
	.dot-row {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
	}
	.dot {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: var(--r-pill);
		flex: none;
		display: inline-block;
	}
	.dot-colored {
		background: currentColor;
	}
	.dot-active {
		background: var(--dot-active);
	}
	.dot-stale {
		background: var(--dot-stale);
	}
	.dot-dead {
		background: var(--dot-dead);
	}
	.dot-hibernated {
		background: var(--dot-hibernated);
	}
	.dot-colored.glow {
		box-shadow: 0 0 6px currentColor;
	}
	.dot-active.glow {
		box-shadow: 0 0 6px var(--dot-active);
	}
	.dot-stale.glow {
		box-shadow: 0 0 6px var(--dot-stale);
	}
	.dot-dead.glow {
		box-shadow: 0 0 6px var(--dot-dead);
	}
	.dot-hibernated.glow {
		box-shadow: 0 0 6px var(--dot-hibernated);
	}
	.dot.ring {
		box-shadow: 0 0 0 3px rgb(0 0 0 / 0.35);
	}
	.dot-colored.ring.glow {
		box-shadow:
			0 0 0 3px rgb(0 0 0 / 0.35),
			0 0 6px currentColor;
	}
	.dot-active.ring.glow {
		box-shadow:
			0 0 0 3px rgb(0 0 0 / 0.35),
			0 0 6px var(--dot-active);
	}
	.dot-stale.ring.glow {
		box-shadow:
			0 0 0 3px rgb(0 0 0 / 0.35),
			0 0 6px var(--dot-stale);
	}
	.dot-dead.ring.glow {
		box-shadow:
			0 0 0 3px rgb(0 0 0 / 0.35),
			0 0 6px var(--dot-dead);
	}
	.dot-hibernated.ring.glow {
		box-shadow:
			0 0 0 3px rgb(0 0 0 / 0.35),
			0 0 6px var(--dot-hibernated);
	}
</style>
