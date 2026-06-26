<script lang="ts">
	// An icon/glyph button with a native <select> overlaid transparently on top:
	// it gets the platform dropdown UI while keeping the compact icon-button
	// affordance. Used by the header font-size + theme pickers and the drawer
	// font-size picker (CCT-250 #5 / CCT-297 #11). Composes the Button primitive
	// for the base look.
	import Button from '$lib/components/atoms/Button.svelte';
	import Select from '$lib/components/atoms/Select.svelte';

	type Option = { value: string; label: string };

	let {
		glyph,
		label,
		title,
		value,
		options,
		groups,
		onchange,
		class: klass = '',
		...rest
	}: {
		// Visible content of the button (a letter like "A" or an emoji icon).
		glyph: string;
		label: string;
		title?: string;
		value: string;
		// Flat option list. Ignored when `groups` is given.
		options?: Option[];
		// Sectioned options, rendered as native <optgroup> blocks (TSU-1). Used by
		// the theme picker to split light/dark; falls back to `options` otherwise.
		groups?: { label: string; options: Option[] }[];
		onchange: (value: string) => void;
		class?: string;
		[key: string]: unknown;
	} = $props();
</script>

<!-- The wrapper (owned here, so styled scoped) is the positioning context that
     clips the transparent overlaid <select>; the icon Button shows through. -->
<span class="select-button {klass}" data-tsu="SelectButton" {...rest}>
	<Button variant="ghost" icon {title} aria-label={label}>
		<span aria-hidden="true">{glyph}</span>
		<Select
			variant="ghost"
			aria-label={label}
			{value}
			onchange={(e) => onchange((e.currentTarget as HTMLSelectElement).value)}
		>
			{#if groups}
				{#each groups as g (g.label)}
					<optgroup label={g.label}>
						{#each g.options as o (o.value)}
							<option value={o.value}>{o.label}</option>
						{/each}
					</optgroup>
				{/each}
			{:else}
				{#each options ?? [] as o (o.value)}
					<option value={o.value}>{o.label}</option>
				{/each}
			{/if}
		</Select>
	</Button>
</span>

<style>
	.select-button {
		position: relative;
		display: inline-flex;
		overflow: hidden;
		border-radius: var(--r-md);
		font-weight: var(--fw-bold);
	}
</style>
