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
		box,
		hitArea = 'auto',
		grow = false,
		shrink = true,
		block = false,
		class: klass = '',
		...rest
	}: {
		// Visible content of the button (a letter like "A" or an emoji icon).
		glyph: string;
		label: string;
		/** Fill the free space of a flex row (`flex: 1 1 0`). */
		grow?: boolean;
		/** `false` pins the box (`flex: none`) so a flex row cannot squeeze it. */
		shrink?: boolean;
		/** Full-width block. */
		block?: boolean;
		title?: string;
		value: string;
		// Flat option list. Ignored when `groups` is given.
		options?: Option[];
		// Sectioned options, rendered as native <optgroup> blocks (TSU-1). Used by
		// the theme picker to split light/dark; falls back to `options` otherwise.
		groups?: { label: string; options: Option[] }[];
		onchange: (value: string) => void;
		// Shared square box scale (`--box-xs/sm/md/lg`); default is the 2.25rem icon box.
		box?: 'xs' | 'sm' | 'md' | 'lg';
		hitArea?: 'auto' | 'compact';
		class?: string;
		[key: string]: unknown;
	} = $props();
</script>

<!-- The wrapper (owned here, so styled scoped) is the positioning context that
     clips the transparent overlaid <select>; the icon Button shows through. -->
<span class="select-button {klass}" data-tsu="SelectButton" {...rest}
	class:grow={grow}
	class:no-shrink={!shrink}
	class:block={block}>
	<Button variant="ghost" icon {box} {hitArea} {title} aria-label={label}>
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
	.grow {
		flex: 1 1 0;
		min-width: 0;
	}
	.no-shrink {
		flex: none;
	}
	.block {
		display: flex;
		width: 100%;
	}
	.select-button {
		position: relative;
		display: inline-flex;
		overflow: hidden;
		border-radius: var(--r-md);
		font-weight: var(--fw-bold);
	}
</style>
