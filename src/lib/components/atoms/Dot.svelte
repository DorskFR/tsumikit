<script lang="ts">
	// Status dot — a small coloured disc, optionally followed by a label. Owns its
	// own styling (it does not rely on any global `.dot` rules). Colour comes from
	// either:
	//   • status → one of the semantic presets (active/stale/dead/hibernated),
	//     each mapped to a token.
	//   • color  → any CSS colour (or var()) for a one-off; overrides `status`.
	// `glow` adds a soft halo in the dot's own colour. With a `label` the whole
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

	let {
		status = 'active',
		color,
		label,
		glow = false,
		class: klass = '',
		...rest
	}: {
		status?: Status;
		color?: string;
		label?: string;
		glow?: boolean;
		class?: string;
		[key: string]: unknown;
	} = $props();

	const resolved = $derived(color ?? STATUS_COLOR[status]);
</script>

{#if label}
	<span class="dot-row {klass}" {...rest}>
		<span class="dot" class:glow style="--dot-color:{resolved}"></span>
		<Text variant="caption">{label}</Text>
	</span>
{:else}
	<span class="dot {klass}" class:glow style="--dot-color:{resolved}" {...rest}></span>
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
</style>
