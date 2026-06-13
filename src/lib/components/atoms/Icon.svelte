<script lang="ts" module>
	// Open icon system. A curated, dependency-free set ships as named glyphs, but
	// the atom is NOT closed: pass a `children` snippet of raw <path>/<circle>/…
	// (24×24 viewBox) to render any icon without adding it to the registry, or
	// register project icons by extending PATHS in your own wrapper. Sized at 1em
	// so it tracks the surrounding text (and the --fs-scale font control).
	export type IconName =
		| 'archive'
		| 'back'
		| 'check'
		| 'chevron-down'
		| 'copy'
		| 'download'
		| 'edit'
		| 'external'
		| 'filter'
		| 'folder'
		| 'fork'
		| 'image'
		| 'info'
		| 'link'
		| 'live'
		| 'markdown'
		| 'menu'
		| 'more'
		| 'plus'
		| 'retry'
		| 'search'
		| 'send'
		| 'settings'
		| 'star'
		| 'stop'
		| 'trash'
		| 'upload'
		| 'warning'
		| 'x';

	// Glyphs that read better filled than stroked.
	const FILLED = new Set<IconName>(['stop', 'star', 'live']);
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		name,
		size,
		label,
		children,
		...rest
	}: {
		/** Named glyph from the registry. Omit when supplying `children`. */
		name?: IconName;
		/** Explicit pixel size. Omit to track the surrounding text (1em) — best
		 *  for icons sitting inline with a label. */
		size?: number;
		/** When set, the icon is exposed to AT with this label; otherwise it is
		 *  decorative (aria-hidden) and the parent control carries the label. */
		label?: string;
		/** Raw SVG markup (24×24 viewBox) — overrides `name`. */
		children?: Snippet;
		[key: string]: unknown;
	} = $props();

	const filled = $derived(name ? FILLED.has(name) : false);
</script>

<svg
	class="icon"
	style={size ? `font-size: ${size}px` : undefined}
	viewBox="0 0 24 24"
	fill={filled ? 'currentColor' : 'none'}
	stroke={filled ? 'none' : 'currentColor'}
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
	{...rest}
>
	{#if children}
		{@render children()}
	{:else if name === 'search'}
		<circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
	{:else if name === 'back'}
		<path d="m15 18-6-6 6-6" />
	{:else if name === 'check'}
		<path d="M20 6 9 17l-5-5" />
	{:else if name === 'x'}
		<path d="M18 6 6 18" /><path d="m6 6 12 12" />
	{:else if name === 'plus'}
		<path d="M12 5v14" /><path d="M5 12h14" />
	{:else if name === 'chevron-down'}
		<path d="m6 9 6 6 6-6" />
	{:else if name === 'menu'}
		<path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" />
	{:else if name === 'archive'}
		<rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" /><path d="M9 12h6" />
	{:else if name === 'trash'}
		<path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M6 6v14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6" /><path d="M10 11v6" /><path d="M14 11v6" />
	{:else if name === 'download'}
		<path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M4 19h16" />
	{:else if name === 'upload'}
		<path d="M12 15V3" /><path d="m7 8 5-5 5 5" /><path d="M4 19h16" />
	{:else if name === 'copy'}
		<rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
	{:else if name === 'edit'}
		<path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
	{:else if name === 'folder'}
		<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
	{:else if name === 'link'}
		<path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
	{:else if name === 'external'}
		<path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
	{:else if name === 'markdown'}
		<rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 15V9l3 3 3-3v6" /><path d="m15 11 2 2 2-2" />
	{:else if name === 'image'}
		<rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.8" /><path d="m21 15-4.5-4.5L7 21" />
	{:else if name === 'fork'}
		<circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="12" cy="19" r="2.5" /><path d="M6 8.5v2a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-2" /><path d="M12 13.5v3" />
	{:else if name === 'more'}
		<circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
	{:else if name === 'settings'}
		<circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
	{:else if name === 'retry'}
		<path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" />
	{:else if name === 'stop'}
		<rect x="6" y="6" width="12" height="12" rx="1.5" />
	{:else if name === 'star'}
		<path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.9l-5.8 3.05 1.1-6.47-4.7-4.58 6.5-.95z" />
	{:else if name === 'live'}
		<circle cx="12" cy="12" r="5" />
	{:else if name === 'send'}
		<path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4z" />
	{:else if name === 'filter'}
		<path d="M3 4h18l-7 8v6l-4 2v-10z" />
	{:else if name === 'info'}
		<circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" />
	{:else if name === 'warning'}
		<path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" />
	{/if}
</svg>

<style>
	.icon {
		flex: none;
		width: 1em;
		height: 1em;
	}
</style>
