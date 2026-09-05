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

	const STATUS_COLOR: Record<Status, string> = {
		active: 'var(--dot-active)',
		stale: 'var(--dot-stale)',
		dead: 'var(--dot-dead)',
		hibernated: 'var(--dot-hibernated)',
	};

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
		...rest
	}: Omit<HTMLAttributes<HTMLSpanElement>, keyof Own> & Own = $props();

	const resolved = $derived(color ?? STATUS_COLOR[status]);
</script>

{#if label}
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<span class="dot-row {klass}" data-tsu="Dot" role={interactive ? 'img' : undefined} tabindex={interactive ? 0 : undefined} aria-label={interactive ? label : undefined} {...rest}>
		<span class="dot" class:glow class:ring style="--dot-color:{resolved}"></span>
		<Text variant="caption">{label}</Text>
	</span>
{:else}
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<span class="dot {klass}" class:glow class:ring style="--dot-color:{resolved}" data-tsu="Dot" role={interactive ? 'img' : undefined} tabindex={interactive ? 0 : undefined} {...rest}></span>
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
		background: var(--dot-color);
	}
	.glow {
		box-shadow: 0 0 6px var(--dot-color);
	}
	.ring {
		box-shadow: 0 0 0 3px rgb(0 0 0 / 0.35);
	}
	.ring.glow {
		box-shadow:
			0 0 0 3px rgb(0 0 0 / 0.35),
			0 0 6px var(--dot-color);
	}
</style>
